# src/main.py
from flask import Flask, jsonify, request, redirect, url_for
from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
import bcrypt
import re
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
import bleach
import pymongo
from pymongo.errors import PyMongoError
from bson import ObjectId
import logging
import json
from flask_dance.consumer import OAuth2ConsumerBlueprint
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from flask_login import LoginManager, UserMixin, current_user
from sqlalchemy import Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import create_engine

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

# Configure CORS
CORS(app,
    origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Range"]
)

# Configure MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/CloseTable")
mongo = PyMongo(app)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", os.urandom(32).hex())
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
jwt = JWTManager(app)

# Rate Limiter Configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["500 per day", "200 per hour"],
    storage_uri="memory://",
    strategy="fixed-window",
    enabled=os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
)

# Configure Google OAuth
google_blueprint = OAuth2ConsumerBlueprint(
    "google",
    __name__,
    client_id="1019626177258-961n3ctfmegqk6iflp2ggsvm823emrtf.apps.googleusercontent.com",
    client_secret="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",
    scope=["openid", "email", "profile"],
    base_url="https://www.googleapis.com/oauth2/v2/",
    authorization_url="https://accounts.google.com/o/oauth2/auth",
    token_url="https://accounts.google.com/o/oauth2/token",
    redirect_url="/api/auth/google/callback"
)
app.register_blueprint(google_blueprint, url_prefix="/login")

# Database initialization
with app.app_context():
    try:
        mongo.db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        mongo.db.token_blocklist.create_index([("jti", pymongo.ASCENDING)], unique=True)
        mongo.db.token_blocklist.create_index([("exp", pymongo.ASCENDING)], expireAfterSeconds=0)
        app.logger.info("Database indexes created successfully")
    except PyMongoError as e:
        app.logger.error(f"Database initialization error: {str(e)}")

# Helper functions
def sanitize_input(data: dict):
    """Sanitize user input"""
    return {
        "username": bleach.clean(data.get("username", "")).strip(),
        "email": bleach.clean(data.get("email", "")).lower().strip(),
        "password": data.get("password", "").strip(),
        "role": bleach.clean(data.get("role", "Customer")).strip()
    }

# JWT Callbacks
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return bool(mongo.db.token_blocklist.find_one({"jti": jti}))

# Google login endpoint
@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        google_id = data.get('googleId')

        # Check if user exists
        user = mongo.db.users.find_one({"email": email})
        
        if user:
            # Generate tokens for existing user
            access_token = create_access_token(identity=str(user["_id"]))
            refresh_token = create_refresh_token(identity=str(user["_id"]))
            
            # Update last login
            mongo.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.now(timezone.utc)}}
            )
            
            return jsonify({
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": str(user["_id"]),
                    "name": user.get("username", ""),  # Use username field
                    "email": user["email"],
                    "role": user.get("role", "Customer")  # Updated default role
                }
            }), 200
        else:
            # Create new user with updated role
            new_user = {
                "username": name,
                "email": email,
                "google_id": google_id,
                "password": None,  # Google users don't have passwords
                "created_at": datetime.now(timezone.utc),
                "role": "Customer",  # Updated default role
                "verified": True
            }
            
            result = mongo.db.users.insert_one(new_user)
            
            access_token = create_access_token(identity=str(result.inserted_id))
            refresh_token = create_refresh_token(identity=str(result.inserted_id))
            
            return jsonify({
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": str(result.inserted_id),
                    "name": name,
                    "email": email,
                    "role": "Customer"  # Updated default role
                }
            }), 200
            
    except Exception as e:
        app.logger.error(f"Google login error: {str(e)}", exc_info=True)
        return jsonify({"error": "Google login failed"}), 500

# Existing login endpoint
@app.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    try:
        if not request.is_json:
            return jsonify({"error": "Missing JSON in request"}), 400

        data = request.get_json()
        app.logger.debug(f"Login attempt data: {json.dumps(data)}")

        if "email" not in data or "password" not in data:
            return jsonify({"error": "Missing email or password"}), 400

        user = mongo.db.users.find_one({"email": data["email"].lower().strip()})
        
        if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"]):
            app.logger.warning(f"Failed login attempt for email: {data['email']}")
            return jsonify({"error": "Invalid email or password"}), 401

        # Generate tokens
        access_token = create_access_token(identity=str(user["_id"]))
        refresh_token = create_refresh_token(identity=str(user["_id"]))
        
        # Update last login
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "role": user.get("role", "Customer")
            }
        }), 200

    except PyMongoError as e:
        app.logger.error(f"Database error during login: {str(e)}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

# Existing signup endpoint
@app.route("/api/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ["username", "email", "password", "role"]
        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        # Sanitize input
        clean_data = sanitize_input(data)

        # Check existing user
        if mongo.db.users.find_one({"$or": [
            {"email": clean_data["email"]},
            {"username": clean_data["username"]}
        ]}):
            return jsonify({"error": "Username/email already exists"}), 409

        # Hash password
        hashed_pw = bcrypt.hashpw(clean_data["password"].encode("utf-8"), bcrypt.gensalt())
        
        # Create user document
        user_doc = {
            "username": clean_data["username"],
            "email": clean_data["email"],
            "password": hashed_pw,
            "created_at": datetime.now(timezone.utc),
            "role": clean_data["role"],
            "verified": False
        }

        # Insert into database
        result = mongo.db.users.insert_one(user_doc)
        
        return jsonify({
            "message": "User created successfully",
            "user_id": str(result.inserted_id)
        }), 201

    except PyMongoError as e:
        app.logger.error(f"MongoDB Error: {str(e)}")
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected Error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Existing refresh endpoint
@app.route("/api/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token), 200

# Existing logout endpoint
@app.route("/api/logout", methods=["POST"])
@jwt_required()
def logout():
    """Revoke current access token"""
    try:
        jti = get_jwt()["jti"]
        now = datetime.now(timezone.utc)
        mongo.db.token_blocklist.insert_one({
            "jti": jti,
            "expires": now + timedelta(hours=1)
        })
        return jsonify({"message": "Successfully logged out"}), 200
    except PyMongoError as e:
        app.logger.error(f"Logout error: {str(e)}")
        return jsonify({"error": "Logout failed"}), 500

# Existing users endpoint
@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():
    try:
        # Verify admin role
        current_user_id = get_jwt_identity()
        user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
        
        if user.get("role") != "Resturant Owner":
            return jsonify({"error": "Unauthorized access"}), 403

        users = list(mongo.db.users.find({}, {"password": 0}))
        for user in users:
            user["_id"] = str(user["_id"])
            
        return jsonify(users), 200
        
    except PyMongoError as e:
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "Failed to retrieve users"}), 500

# Protected Endpoints
@app.route("/api/profile", methods=["GET"])
@jwt_required()
def user_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = mongo.db.users.find_one(
            {"_id": ObjectId(user_id)}, 
            {"password": 0, "tokens": 0}
        )
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user["_id"] = str(user["_id"])
        return jsonify(user), 200
        
    except PyMongoError as e:
        app.logger.error(f"Profile error: {str(e)}")
        return jsonify({"error": "Database error"}), 500

# Error Handlers
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "rate_limit_exceeded",
        "message": f"Too many requests. Retry after {e.description}"
    }), 429

@app.errorhandler(401)
def unauthorized_handler(e):
    return jsonify({"error": "Unauthorized access"}), 401

# Security Headers
@app.after_request
def add_security_headers(response):
    headers = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
    for key, value in headers.items():
        response.headers[key] = value
    return response

if __name__ == "__main__":
    try:
        mongo.db.command('ping')
        app.logger.info("✅ Successfully connected to MongoDB")
    except PyMongoError as e:
        app.logger.error(f"❌ MongoDB connection error: {str(e)}")
    
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
        threaded=True
    )