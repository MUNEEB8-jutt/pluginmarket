from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from io import BytesIO
import uuid
import base64

app = Flask(__name__)
CORS(app)

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb+srv://muneeb:muneeb@pluginverse.awggjn6.mongodb.net/?appName=pluginverse')
DB_NAME = os.environ.get('DB_NAME', 'pluginverse')
JWT_SECRET = os.environ.get('JWT_SECRET', 'mC9pLuG1nV3rS3-s3cR3t-k3Y-2024-pR0dUcT10n')

# MongoDB connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db['users']
plugins_collection = db['plugins']
deposits_collection = db['deposits']

# JWT decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            token = token.replace('Bearer ', '')
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            # Try both _id and username for compatibility
            current_user = users_collection.find_one({'$or': [{'_id': data['user_id']}, {'username': data['user_id']}]})
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Routes
@app.route('/')
def home():
    return jsonify({'message': 'Minecraft Plugin Store API', 'status': 'running'})

@app.route('/api/plugins', methods=['GET'])
def get_plugins():
    try:
        plugins = list(plugins_collection.find({}, {'_id': 0}))
        return jsonify(plugins)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if users_collection.find_one({'$or': [{'username': username}, {'email': email}]}):
            return jsonify({'error': 'User already exists'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = {
            '_id': username,
            'username': username,
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'coins': 0,
            'purchases': [],
            'is_admin': False,
            'created_at': datetime.utcnow()
        }
        
        users_collection.insert_one(user)
        
        token = jwt.encode({
            'user_id': username,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'email': user['email'],
                'coins': user['coins'],
                'is_admin': user['is_admin']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Support login with either username or email
        query = {'$or': [{'username': username}, {'email': email}]} if username or email else {}
        user = users_collection.find_one(query)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Check password
        try:
            stored_password = user['password']
            # Handle both string and bytes
            if isinstance(stored_password, str):
                stored_password = stored_password.encode('utf-8')
            
            if not bcrypt.checkpw(password.encode('utf-8'), stored_password):
                return jsonify({'error': 'Wrong password'}), 401
        except Exception as pwd_err:
            return jsonify({'error': f'Password check failed: {str(pwd_err)}'}), 500
        
        token = jwt.encode({
            'user_id': username,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'email': user['email'],
                'coins': user.get('coins', 0),
                'is_admin': user.get('is_admin', False),
                'purchases': user.get('purchases', [])
            }
        })
    except Exception as e:
        return jsonify({'error': f'Login error: {str(e)}'}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'username': current_user['username'],
        'email': current_user['email'],
        'coins': current_user.get('coins', 0),
        'is_admin': current_user.get('is_admin', False),
        'purchases': current_user.get('purchases', [])
    })

@app.route('/api/deposits/my', methods=['GET'])
@token_required
def get_my_deposits(current_user):
    try:
        deposits = list(deposits_collection.find(
            {'username': current_user['username']},
            {'_id': 0}
        ))
        return jsonify(deposits)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin routes
@app.route('/api/admin/deposits', methods=['GET'])
@token_required
def get_all_deposits(current_user):
    if not current_user.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        deposits = list(deposits_collection.find({}, {'_id': 0}))
        return jsonify(deposits)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    if not current_user.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        users = list(users_collection.find({}, {'_id': 0, 'password': 0}))
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/plugins', methods=['POST'])
@token_required
def add_plugin(current_user):
    if not current_user.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        import base64
        
        # Get form data
        name = request.form.get('name')
        description = request.form.get('description')
        price = int(request.form.get('price', 0))
        
        # Generate plugin ID
        plugin_id = str(uuid.uuid4())[:8]
        
        # Handle logo upload (base64 encode for small files)
        logo_data = None
        logo_filename = None
        if 'logo' in request.files:
            logo = request.files['logo']
            if logo.filename:
                logo_data = base64.b64encode(logo.read()).decode('utf-8')
                logo_filename = logo.filename
        
        # Handle plugin file upload (base64 encode)
        plugin_data = None
        plugin_filename = None
        if 'plugin_file' in request.files:
            plugin_file = request.files['plugin_file']
            if plugin_file.filename:
                plugin_data = base64.b64encode(plugin_file.read()).decode('utf-8')
                plugin_filename = plugin_file.filename
        
        # Create plugin document
        plugin = {
            'id': plugin_id,
            'name': name,
            'description': description,
            'price': price,
            'logo_data': logo_data,
            'logo_filename': logo_filename,
            'plugin_data': plugin_data,
            'plugin_filename': plugin_filename,
            'logo_url': f'/api/plugin-logo/{plugin_id}' if logo_data else None,
            'file_url': f'/api/plugin-file/{plugin_id}' if plugin_data else None,
            'downloads': 0,
            'created_at': datetime.utcnow()
        }
        
        plugins_collection.insert_one(plugin)
        
        # Remove large data from response
        response_plugin = {k: v for k, v in plugin.items() if k not in ['logo_data', 'plugin_data']}
        
        return jsonify({'message': 'Plugin added successfully', 'plugin': response_plugin})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/plugins/<plugin_id>', methods=['DELETE'])
@token_required
def delete_plugin(current_user, plugin_id):
    if not current_user.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        result = plugins_collection.delete_one({'id': plugin_id})
        if result.deleted_count > 0:
            return jsonify({'message': 'Plugin deleted successfully'})
        else:
            return jsonify({'error': 'Plugin not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Plugin logo route
@app.route('/api/plugin-logo/<plugin_id>', methods=['GET'])
def get_plugin_logo(plugin_id):
    try:
        import base64
        plugin = plugins_collection.find_one({'id': plugin_id})
        if not plugin or not plugin.get('logo_data'):
            return jsonify({'error': 'Logo not found'}), 404
        
        logo_bytes = base64.b64decode(plugin['logo_data'])
        return send_file(
            BytesIO(logo_bytes),
            mimetype='image/png',
            as_attachment=False,
            download_name=plugin.get('logo_filename', 'logo.png')
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# Plugin download route (for users who purchased)
@app.route('/api/plugins/<plugin_id>/download', methods=['GET'])
@token_required
def download_plugin(current_user, plugin_id):
    try:
        import base64
        
        # Check if user purchased the plugin
        if plugin_id not in current_user.get('purchases', []):
            return jsonify({'error': 'Plugin not purchased'}), 403
        
        # Get plugin
        plugin = plugins_collection.find_one({'id': plugin_id})
        if not plugin or not plugin.get('plugin_data'):
            return jsonify({'error': 'Plugin file not found'}), 404
        
        # Decode file
        plugin_bytes = base64.b64decode(plugin['plugin_data'])
        
        # Increment download count
        plugins_collection.update_one(
            {'id': plugin_id},
            {'$inc': {'downloads': 1}}
        )
        
        return send_file(
            BytesIO(plugin_bytes),
            mimetype='application/java-archive',
            as_attachment=True,
            download_name=plugin.get('plugin_filename', 'plugin.jar')
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Plugin file route (for preview/info)
@app.route('/api/plugin-file/<plugin_id>', methods=['GET'])
def get_plugin_file(plugin_id):
    try:
        import base64
        plugin = plugins_collection.find_one({'id': plugin_id})
        if not plugin or not plugin.get('plugin_data'):
            return jsonify({'error': 'File not found'}), 404
        
        plugin_bytes = base64.b64decode(plugin['plugin_data'])
        return send_file(
            BytesIO(plugin_bytes),
            mimetype='application/java-archive',
            as_attachment=True,
            download_name=plugin.get('plugin_filename', 'plugin.jar')
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# Admin setup route (one-time use)
@app.route('/api/setup-admin', methods=['POST'])
def setup_admin():
    try:
        # Delete all existing users
        users_collection.delete_many({})
        
        # Create admin user
        admin_password = bcrypt.hashpw('admin@786'.encode('utf-8'), bcrypt.gensalt())
        
        admin_user = {
            '_id': 'admin',
            'username': 'admin',
            'email': 'admin@gmail.com',
            'password': admin_password.decode('utf-8'),
            'coins': 999999,
            'purchases': [],
            'is_admin': True,
            'created_at': datetime.utcnow()
        }
        
        users_collection.insert_one(admin_user)
        
        return jsonify({'message': 'Admin user created successfully', 'email': 'admin@gmail.com', 'password': 'admin@786'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Vercel serverless handler
if __name__ == '__main__':
    app.run(debug=True)
