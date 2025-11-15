from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import boto3
from botocore.exceptions import ClientError
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# AWS S3 Configuration
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME', 'pluginverse')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize S3 client
s3_client = None
if AWS_ACCESS_KEY and AWS_SECRET_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=AWS_REGION
    )

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    coins: int = 0
    purchases: List[str] = []
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Plugin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: int
    logo_url: str = ""
    file_url: str = ""
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    downloads: int = 0

class Deposit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    amount: int
    method: str
    txn_id: str
    status: str = "Pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepositCreate(BaseModel):
    amount: int
    method: str
    txn_id: str

class PaymentSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "payment_settings"
    easypaisa: str = ""
    jazzcash: str = ""
    upi: str = ""

class PaymentSettingsUpdate(BaseModel):
    easypaisa: str
    jazzcash: str
    upi: str

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, is_admin: bool) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if not user.get('is_admin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

async def upload_to_s3(file: UploadFile, folder: str) -> str:
    """Upload file to S3 and return URL"""
    if not s3_client:
        # Fallback to local storage if S3 not configured
        uploads_dir = ROOT_DIR / "uploads" / folder
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = uploads_dir / unique_filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return f"/api/files/{folder}/{unique_filename}"
    
    try:
        file_key = f"{folder}/{uuid.uuid4()}_{file.filename}"
        await file.seek(0)
        content = await file.read()
        s3_client.put_object(
            Bucket=AWS_BUCKET_NAME,
            Key=file_key,
            Body=content,
            ContentType=file.content_type
        )
        return f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
    except Exception as e:
        logging.error(f"S3 upload error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

# Initialize admin and payment settings
@app.on_event("startup")
async def startup_event():
    # Create admin user if not exists
    admin_email = "jsab2210@gmail.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = User(
            username="admin",
            email=admin_email,
            coins=0,
            is_admin=True
        )
        admin_dict = admin_user.model_dump()
        admin_dict['password_hash'] = hash_password("mypass245")
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        await db.users.insert_one(admin_dict)
        logging.info("Admin user created")
    
    # Initialize payment settings if not exists
    payment_settings = await db.payment_settings.find_one({"id": "payment_settings"})
    if not payment_settings:
        settings = PaymentSettings(
            easypaisa="03001234567",
            jazzcash="03007654321",
            upi="example@upi"
        )
        await db.payment_settings.insert_one(settings.model_dump())
        logging.info("Payment settings initialized")

# Auth Routes
@api_router.post("/auth/signup")
async def signup(data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": data.email}, {"username": data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user = User(
        username=data.username,
        email=data.email,
        coins=0,
        is_admin=False
    )
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_jwt_token(user.id, user.email, user.is_admin)
    
    return {
        "message": "Signup successful",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "coins": user.coins,
            "is_admin": user.is_admin
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['email'], user.get('is_admin', False))
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "coins": user['coins'],
            "is_admin": user.get('is_admin', False)
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "coins": user['coins'],
        "purchases": user.get('purchases', []),
        "is_admin": user.get('is_admin', False)
    }

# Plugin Routes
@api_router.get("/plugins")
async def get_plugins():
    plugins = await db.plugins.find({}, {"_id": 0}).to_list(1000)
    for plugin in plugins:
        if isinstance(plugin.get('upload_date'), str):
            plugin['upload_date'] = datetime.fromisoformat(plugin['upload_date'])
    return plugins

@api_router.get("/plugins/{plugin_id}")
async def get_plugin(plugin_id: str):
    plugin = await db.plugins.find_one({"id": plugin_id}, {"_id": 0})
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    if isinstance(plugin.get('upload_date'), str):
        plugin['upload_date'] = datetime.fromisoformat(plugin['upload_date'])
    return plugin

@api_router.post("/plugins/buy/{plugin_id}")
async def buy_plugin(plugin_id: str, user: dict = Depends(get_current_user)):
    # Get plugin
    plugin = await db.plugins.find_one({"id": plugin_id}, {"_id": 0})
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    # Check if already purchased
    if plugin_id in user.get('purchases', []):
        raise HTTPException(status_code=400, detail="Plugin already purchased")
    
    # Check coins
    if user['coins'] < plugin['price']:
        raise HTTPException(status_code=400, detail="Insufficient coins")
    
    # Deduct coins and add to purchases
    new_coins = user['coins'] - plugin['price']
    new_purchases = user.get('purchases', []) + [plugin_id]
    
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {"coins": new_coins, "purchases": new_purchases}}
    )
    
    # Increment download count
    await db.plugins.update_one(
        {"id": plugin_id},
        {"$inc": {"downloads": 1}}
    )
    
    return {"message": "Plugin purchased successfully", "coins_remaining": new_coins}

@api_router.get("/plugins/{plugin_id}/download")
async def download_plugin(plugin_id: str, user: dict = Depends(get_current_user)):
    # Check if user purchased
    if plugin_id not in user.get('purchases', []):
        raise HTTPException(status_code=403, detail="Plugin not purchased")
    
    plugin = await db.plugins.find_one({"id": plugin_id}, {"_id": 0})
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    # Return download URL
    return {"download_url": plugin['file_url'], "name": plugin['name']}

# File serving endpoint
@api_router.get("/files/{folder}/{filename}")
async def serve_file(folder: str, filename: str):
    """Serve uploaded files from local storage"""
    file_path = ROOT_DIR / "uploads" / folder / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return StreamingResponse(
        open(file_path, "rb"),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

# Admin Plugin Routes
@api_router.post("/admin/plugins")
async def create_plugin(
    name: str = Form(...),
    description: str = Form(...),
    price: int = Form(...),
    logo: UploadFile = File(...),
    plugin_file: UploadFile = File(...),
    admin: dict = Depends(get_admin_user)
):
    # Upload files
    logo_url = await upload_to_s3(logo, "logos")
    file_url = await upload_to_s3(plugin_file, "plugins")
    
    # Create plugin
    plugin = Plugin(
        name=name,
        description=description,
        price=price,
        logo_url=logo_url,
        file_url=file_url,
        downloads=0
    )
    
    plugin_dict = plugin.model_dump()
    plugin_dict['upload_date'] = plugin_dict['upload_date'].isoformat()
    
    await db.plugins.insert_one(plugin_dict)
    
    return {"message": "Plugin created successfully", "plugin": plugin}

@api_router.put("/admin/plugins/{plugin_id}")
async def update_plugin(
    plugin_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[int] = Form(None),
    logo: Optional[UploadFile] = File(None),
    plugin_file: Optional[UploadFile] = File(None),
    admin: dict = Depends(get_admin_user)
):
    plugin = await db.plugins.find_one({"id": plugin_id}, {"_id": 0})
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    update_data = {}
    if name:
        update_data['name'] = name
    if description:
        update_data['description'] = description
    if price is not None:
        update_data['price'] = price
    if logo:
        update_data['logo_url'] = await upload_to_s3(logo, "logos")
    if plugin_file:
        update_data['file_url'] = await upload_to_s3(plugin_file, "plugins")
    
    if update_data:
        await db.plugins.update_one({"id": plugin_id}, {"$set": update_data})
    
    return {"message": "Plugin updated successfully"}

@api_router.delete("/admin/plugins/{plugin_id}")
async def delete_plugin(plugin_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.plugins.delete_one({"id": plugin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return {"message": "Plugin deleted successfully"}

# Deposit Routes
@api_router.post("/deposits")
async def create_deposit(data: DepositCreate, user: dict = Depends(get_current_user)):
    deposit = Deposit(
        user_id=user['id'],
        username=user['username'],
        amount=data.amount,
        method=data.method,
        txn_id=data.txn_id,
        status="Pending"
    )
    
    deposit_dict = deposit.model_dump()
    deposit_dict['created_at'] = deposit_dict['created_at'].isoformat()
    
    await db.deposits.insert_one(deposit_dict)
    
    return {"message": "Deposit submitted successfully. Admin will verify and add coins to your account."}

@api_router.get("/deposits/my")
async def get_my_deposits(user: dict = Depends(get_current_user)):
    deposits = await db.deposits.find({"user_id": user['id']}, {"_id": 0}).to_list(1000)
    for deposit in deposits:
        if isinstance(deposit.get('created_at'), str):
            deposit['created_at'] = datetime.fromisoformat(deposit['created_at'])
    return deposits

# Admin Deposit Routes
@api_router.get("/admin/deposits")
async def get_all_deposits(admin: dict = Depends(get_admin_user)):
    deposits = await db.deposits.find({}, {"_id": 0}).to_list(1000)
    for deposit in deposits:
        if isinstance(deposit.get('created_at'), str):
            deposit['created_at'] = datetime.fromisoformat(deposit['created_at'])
    return deposits

@api_router.post("/admin/deposits/{deposit_id}/approve")
async def approve_deposit(deposit_id: str, admin: dict = Depends(get_admin_user)):
    deposit = await db.deposits.find_one({"id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    if deposit['status'] != "Pending":
        raise HTTPException(status_code=400, detail="Deposit already processed")
    
    # Add coins to user
    user = await db.users.find_one({"id": deposit['user_id']}, {"_id": 0})
    if user:
        new_coins = user['coins'] + deposit['amount']
        await db.users.update_one({"id": deposit['user_id']}, {"$set": {"coins": new_coins}})
    
    # Update deposit status
    await db.deposits.update_one({"id": deposit_id}, {"$set": {"status": "Approved"}})
    
    return {"message": "Deposit approved and coins added"}

@api_router.post("/admin/deposits/{deposit_id}/reject")
async def reject_deposit(deposit_id: str, admin: dict = Depends(get_admin_user)):
    deposit = await db.deposits.find_one({"id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    if deposit['status'] != "Pending":
        raise HTTPException(status_code=400, detail="Deposit already processed")
    
    await db.deposits.update_one({"id": deposit_id}, {"$set": {"status": "Rejected"}})
    
    return {"message": "Deposit rejected"}

# Admin User Routes
@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# Payment Settings Routes
@api_router.get("/payment-settings")
async def get_payment_settings():
    settings = await db.payment_settings.find_one({"id": "payment_settings"}, {"_id": 0})
    if not settings:
        settings = PaymentSettings().model_dump()
    return settings

@api_router.put("/admin/payment-settings")
async def update_payment_settings(data: PaymentSettingsUpdate, admin: dict = Depends(get_admin_user)):
    await db.payment_settings.update_one(
        {"id": "payment_settings"},
        {"$set": {"easypaisa": data.easypaisa, "jazzcash": data.jazzcash, "upi": data.upi}},
        upsert=True
    )
    return {"message": "Payment settings updated successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()