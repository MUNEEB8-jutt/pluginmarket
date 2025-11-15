from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps

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
            current_user = users_collection.find_one({'_id': data['user_id']})
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
        password = data.get('password')
        
        user = users_collection.find_one({'username': username})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
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
        return jsonify({'error': str(e)}), 500

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

# Vercel serverless handler
if __name__ == '__main__':
    app.run(debug=True)
