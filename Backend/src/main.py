# src/main.py
from flask import Flask, json, jsonify, request, abort, send_file
from flask_pymongo import PyMongo, ASCENDING
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from functools import wraps
import bcrypt
import re
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
import bleach
from pymongo.errors import PyMongoError
from bson import ObjectId
import logging
from bson.json_util import dumps
from gridfs import GridFS
from werkzeug.utils import secure_filename
import uuid

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
fs = GridFS(mongo.db)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", os.urandom(32).hex())
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
jwt = JWTManager(app)

# Configure allowed file types and sizes
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_RESTAURANT_IMAGES = 5
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Rate Limiter Configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["500 per day", "200 per hour"],
    storage_uri="memory://",
    strategy="fixed-window",
    enabled=os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
)

# Database initialization
with app.app_context():
    try:
        # Users
        mongo.db.users.create_index([("email", ASCENDING)], unique=True)
        mongo.db.users.create_index([("saved_restaurants", ASCENDING)])
        
        # Restaurants
        mongo.db.restaurants.create_index([("owner_id", ASCENDING)])
        mongo.db.restaurants.create_index([("status", ASCENDING)])
        mongo.db.restaurants.create_index([("name", "text")])
        
        # Reservations
        mongo.db.reservations.create_index([("user_id", ASCENDING)])
        mongo.db.reservations.create_index([("restaurant_id", ASCENDING)])
        mongo.db.reservations.create_index([("datetime", ASCENDING)])
        
        # Menu Items
        mongo.db.menu_items.create_index([("restaurant_id", ASCENDING)])
        mongo.db.menu_items.create_index([("name", "text")])
        
        # Reviews
        mongo.db.reviews.create_index([("restaurant_id", ASCENDING)])
        mongo.db.reviews.create_index([("user_id", ASCENDING)])
        
        # Token Blocklist
        mongo.db.token_blocklist.create_index([("jti", ASCENDING)], unique=True)
        mongo.db.token_blocklist.create_index([("exp", ASCENDING)], expireAfterSeconds=0)
        
        app.logger.info("Database indexes verified")
    except PyMongoError as e:
        app.logger.error(f"Index error: {str(e)}")

# Helper functions
def sanitize_input(data: dict):
    return {
        "first_name": bleach.clean(data.get("first_name", "")).strip(),
        "last_name": bleach.clean(data.get("last_name", "")).strip(),
        "email": bleach.clean(data.get("email", "")).lower().strip(),
        "password": data.get("password", "").strip(),
    }

def validate_price(price):
    try:
        value = float(price)
        return value > 0
    except (ValueError, TypeError):
        return False

def has_role(required_role):
    def wrapper(fn):
        @wraps(fn)  # This preserves the original function's metadata
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user = mongo.db.users.find_one(
                {"_id": ObjectId(get_jwt_identity())},
                {"role": 1}
            )
            if not current_user or current_user.get("role") != required_role:
                return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorated_function
    return wrapper

# JWT Callbacks
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return bool(mongo.db.token_blocklist.find_one({"jti": jti}))

# Authentication Routes
@app.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.get_json()
        user = mongo.db.users.find_one({"email": data["email"].lower().strip()})
        
        if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=str(user["_id"]))
        refresh_token = create_refresh_token(identity=str(user["_id"]))
        
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user["_id"]),
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
                "role": user.get("role", "Customer")
            }
        }), 200
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/api/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    try:
        data = sanitize_input(request.get_json())
        required_fields = ["first_name", "last_name", "email", "password"]
        if any(field not in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        if mongo.db.users.find_one({"email": data["email"]}):
            return jsonify({"error": "Email already exists"}), 409

        hashed_pw = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())
        user_doc = {
            **data,
            "password": hashed_pw,
            "role": "Customer",
            "created_at": datetime.now(timezone.utc),
            "verified": False,
            "saved_restaurants": []
        }
        result = mongo.db.users.insert_one(user_doc)
        return jsonify({"message": "User created", "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500

# Image Upload Endpoints
@app.route('/api/images', methods=['POST'])
@jwt_required()
def upload_image():
    try:
        # Verify user is restaurant owner or admin
        current_user_id = ObjectId(get_jwt_identity())
        user = mongo.db.users.find_one({"_id": current_user_id})
        if user['role'] not in ['Restaurant Owner', 'Admin']:
            abort(403)

        if 'file' not in request.files:
            abort(400, description="No file part")
            
        file = request.files['file']
        if file.filename == '':
            abort(400, description="No selected file")

        if file and allowed_file(file.filename):
            if len(file.read()) > MAX_FILE_SIZE:
                abort(413, description="File too large")
            file.seek(0)  # Reset file pointer after reading

            fs = GridFS(mongo.db)
            filename = secure_filename(file.filename)
            file_id = fs.put(
                file,
                filename=filename,
                content_type=file.content_type,
                metadata={
                    "uploader_id": current_user_id,
                    "restaurant_id": request.form.get('restaurant_id'),
                    "menu_item_id": request.form.get('menu_item_id')
                }
            )
            return jsonify({"file_id": str(file_id)}), 201
        else:
            abort(400, description="Invalid file type")
    except PyMongoError as e:
        app.logger.error(f"Image upload error: {str(e)}")
        abort(500)

# Get Image Endpoint
@app.route('/api/images/<file_id>')
def get_image(file_id):
    try:
        fs = GridFS(mongo.db)
        grid_file = fs.get(ObjectId(file_id))
        return send_file(grid_file, mimetype=grid_file.content_type)
    except Exception as e:
        app.logger.error(f"Image retrieval error: {str(e)}")
        abort(404)


# Restaurant Routes
@app.route("/api/restaurants", methods=["GET"])
def get_restaurants():
    try:
        query = {"status": "approved"}
        name = request.args.get("name")
        cuisine = request.args.get("cuisine")
        
        if name:
            query["name"] = {"$regex": re.escape(name), "$options": "i"}
        if cuisine:
            query["cuisine"] = {"$regex": re.escape(cuisine), "$options": "i"}
            
        restaurants = list(mongo.db.restaurants.find(query))
        return jsonify(json.loads(dumps(restaurants))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/restaurants", methods=["POST"])
@jwt_required()
def create_restaurant():
    try:
        user_id = ObjectId(get_jwt_identity())
        user = mongo.db.users.find_one({"_id": user_id})
        
        # Upgrade customer to restaurant owner
        if user["role"] == "Customer":
            mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": {"role": "Restaurant Owner"}}
            )
            # Refresh user data after update
            user = mongo.db.users.find_one({"_id": user_id})

        # Verify permissions after potential role update
        if user.get("role") not in ["Restaurant Owner", "Admin"]:
            return jsonify({"error": "Requires restaurant owner privileges"}), 403

        data = request.get_json()
        restaurant = {
            "name": bleach.clean(data["name"]).strip(),
            "address": bleach.clean(data["address"]).strip(),
            "cuisine": bleach.clean(data.get("cuisine", "")).strip(),
            "description": bleach.clean(data.get("description", "")).strip(),
            "owner_id": user_id,
            "status": "pending",
            "images": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        result = mongo.db.restaurants.insert_one(restaurant)
        return jsonify({
            "id": str(result.inserted_id),
            "message": "Restaurant created successfully. Waiting for admin approval."
        }), 201

    except Exception as e:
        app.logger.error(f"Restaurant creation error: {str(e)}")
        return jsonify({"error": "Restaurant creation failed"}), 500
        
@app.route("/api/restaurants/<id>", methods=["GET"])
def get_restaurant(id):
    try:
        restaurant = mongo.db.restaurants.find_one({"_id": ObjectId(id)})
        if not restaurant or restaurant["status"] != "approved":
            return jsonify({"error": "Restaurant not found"}), 404
        return jsonify(json.loads(dumps(restaurant))), 200
    except Exception as e:
        return jsonify({"error": "Invalid ID"}), 400

@app.route("/api/restaurants/<id>", methods=["PUT"])
@jwt_required()
def update_restaurant(id):
    try:
        user_id = ObjectId(get_jwt_identity())
        restaurant = mongo.db.restaurants.find_one({"_id": ObjectId(id)})
        
        
        


        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404
            
        user = mongo.db.users.find_one({"_id": user_id})
        if user["role"] != "Admin" and restaurant["owner_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        


        data = request.get_json()
        updates = {
            "name": bleach.clean(data.get("name", restaurant["name"])).strip(),
            "address": bleach.clean(data.get("address", restaurant["address"])).strip(),
            "cuisine": bleach.clean(data.get("cuisine", restaurant["cuisine"])).strip(),
            "description": bleach.clean(data.get("description", restaurant["description"])).strip(),
            "updated_at": datetime.now(timezone.utc)
        }

        if 'images' in data:
            existing_images = restaurant.get('images', [])
            new_images = [ObjectId(img_id) for img_id in data['images'] 
                         if ObjectId.is_valid(img_id)]
            
            # Enforce maximum 5 images
            if len(existing_images) + len(new_images) > MAX_RESTAURANT_IMAGES:
                return jsonify({"error": f"Maximum {MAX_RESTAURANT_IMAGES} images allowed"}), 400
                
            updates['images'] = existing_images + new_images


        
        if user["role"] != "Admin":
            updates["status"] = "pending"

       
        mongo.db.restaurants.update_one(
            {"_id": ObjectId(id)},
            {"$set": updates}
        )
        return jsonify({"message": "Restaurant updated"}), 200
    except Exception as e:
        app.logger.error(f"Update error: {str(e)}")
        return jsonify({"error": "Update failed"}), 500

@app.route("/api/restaurants/<id>", methods=["DELETE"])
@jwt_required()
def delete_restaurant(id):
    try:
        user_id = ObjectId(get_jwt_identity())
        restaurant = mongo.db.restaurants.find_one({"_id": ObjectId(id)})
        
        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404
            
        user = mongo.db.users.find_one({"_id": user_id})
        if user["role"] != "Admin" and restaurant["owner_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Cascade delete related data
        mongo.db.menu_items.delete_many({"restaurant_id": ObjectId(id)})
        mongo.db.reservations.delete_many({"restaurant_id": ObjectId(id)})
        mongo.db.reviews.delete_many({"restaurant_id": ObjectId(id)})
        mongo.db.restaurants.delete_one({"_id": ObjectId(id)})
        
        return jsonify({"message": "Restaurant and related data deleted"}), 200
    except Exception as e:
        app.logger.error(f"Delete error: {str(e)}")
        return jsonify({"error": "Deletion failed"}), 500

# Reservation Routes
@app.route("/api/reservations", methods=["GET"])
@jwt_required()
def get_reservations():
    try:
        user_id = ObjectId(get_jwt_identity())
        user = mongo.db.users.find_one({"_id": user_id})
        
        query = {}
        if user["role"] == "Customer":
            query["user_id"] = user_id
        elif user["role"] == "Restaurant Owner":
            restaurants = list(mongo.db.restaurants.find({"owner_id": user_id}))
            query["restaurant_id"] = {"$in": [r["_id"] for r in restaurants]}
        elif user["role"] != "Admin":
            return jsonify({"error": "Unauthorized"}), 403

        reservations = list(mongo.db.reservations.find(query))
        return jsonify(json.loads(dumps(reservations))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reservations", methods=["POST"])
@jwt_required()
def create_reservation():
    try:
        data = request.get_json()
        restaurant = mongo.db.restaurants.find_one({
            "_id": ObjectId(data["restaurant_id"]),
            "status": "approved"
        })
        if not restaurant:
            return jsonify({"error": "Restaurant not available"}), 400

        reservation = {
            "user_id": ObjectId(get_jwt_identity()),
            "restaurant_id": ObjectId(data["restaurant_id"]),
            "datetime": datetime.fromisoformat(data["datetime"]),
            "party_size": int(data["party_size"]),
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc)
        }
        result = mongo.db.reservations.insert_one(reservation)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as e:
        app.logger.error(f"Reservation error: {str(e)}")
        return jsonify({"error": "Reservation failed"}), 500

@app.route("/api/reservations/<id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_reservation(id):
    try:
        reservation = mongo.db.reservations.find_one({"_id": ObjectId(id)})
        if not reservation:
            return jsonify({"error": "Reservation not found"}), 404

        user_id = ObjectId(get_jwt_identity())
        user = mongo.db.users.find_one({"_id": user_id})
        
        # Authorization check
        is_owner = mongo.db.restaurants.find_one({
            "_id": reservation["restaurant_id"],
            "owner_id": user_id
        })
        
        if reservation["user_id"] != user_id and not is_owner and user["role"] != "Admin":
            return jsonify({"error": "Unauthorized"}), 403

        if request.method == "PUT":
            data = request.get_json()
            updates = {}
            if "datetime" in data:
                updates["datetime"] = datetime.fromisoformat(data["datetime"])
            if "party_size" in data:
                updates["party_size"] = int(data["party_size"])
            if "status" in data and user["role"] in ["Restaurant Owner", "Admin"]:
                updates["status"] = data["status"]
            
            updates["updated_at"] = datetime.now(timezone.utc)
            mongo.db.reservations.update_one(
                {"_id": ObjectId(id)},
                {"$set": updates}
            )
            return jsonify({"message": "Reservation updated"}), 200

        elif request.method == "DELETE":
            new_status = "canceled" if user["role"] == "Customer" else "rejected"
            mongo.db.reservations.update_one(
                {"_id": ObjectId(id)},
                {"$set": {
                    "status": new_status,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            return jsonify({"message": "Reservation canceled"}), 200

    except Exception as e:
        app.logger.error(f"Reservation error: {str(e)}")
        return jsonify({"error": "Operation failed"}), 500

# Menu Item Routes
@app.route("/api/menu-items", methods=["GET"])
def get_menu_items():
    try:
        restaurant_id = request.args.get("restaurant_id")
        query = {"restaurant_id": ObjectId(restaurant_id)} if restaurant_id else {}
        items = list(mongo.db.menu_items.find(query))
        return jsonify(json.loads(dumps(items))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/menu-items", methods=["POST"])
@jwt_required()
def create_menu_item():
    try:
        data = request.get_json()
        if not validate_price(data.get("price")):
            return jsonify({"error": "Invalid price"}), 400
        

        restaurant = mongo.db.restaurants.find_one({
            "_id": ObjectId(data["restaurant_id"]),
            "owner_id": ObjectId(get_jwt_identity()),
            "status": "approved"
        })
        if not restaurant:
            return jsonify({"error": "Invalid restaurant or permissions"}), 403

        menu_item = {
            "name": bleach.clean(data["name"]).strip(),
            "description": bleach.clean(data.get("description", "")).strip(),
            "price": float(data["price"]),
             "image": ObjectId(data["image"]) if data.get("image") else None, 
            "restaurant_id": ObjectId(data["restaurant_id"]),
            "created_at": datetime.now(timezone.utc)
        }
        menu_item['image'] = ObjectId(data['image'])

        result = mongo.db.menu_items.insert_one(menu_item)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as e:
        app.logger.error(f"Menu item error: {str(e)}")
        return jsonify({"error": "Creation failed"}), 500


@app.route("/api/menu-items/<id>", methods=["PUT"])
@jwt_required()
def manage_menu_item(id):
    try:
        menu_item = mongo.db.menu_items.find_one({"_id": ObjectId(id)})
        if not menu_item:
            return jsonify({"error": "Menu item not found"}), 404

        restaurant = mongo.db.restaurants.find_one({
            "_id": menu_item["restaurant_id"],
            "owner_id": ObjectId(get_jwt_identity())
        })
        if not restaurant and mongo.db.users.find_one({"_id": ObjectId(get_jwt_identity())})["role"] != "Admin":
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        updates = {
            "name": bleach.clean(data.get("name", menu_item["name"])).strip(),
            "description": bleach.clean(data.get("description", menu_item["description"])).strip(),
            "price": float(data["price"]) if "price" in data else menu_item["price"],
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Handle image update
        if 'image' in data:
            if data['image'] is None:
                updates['image'] = None
            elif ObjectId.is_valid(data['image']):
                updates['image'] = ObjectId(data['image'])
            else:
                return jsonify({"error": "Invalid image ID"}), 400

        mongo.db.menu_items.update_one(
            {"_id": ObjectId(id)},
            {"$set": updates}
        )
        return jsonify({"message": "Menu item updated"}), 200

    except Exception as e:
        app.logger.error(f"Menu item error: {str(e)}")
        return jsonify({"error": "Operation failed"}), 500



@app.route("/api/menu-items/<id>", methods=[ "DELETE"])
@jwt_required()
def manage_menu_item(id):
    try:
        menu_item = mongo.db.menu_items.find_one({"_id": ObjectId(id)})
        if not menu_item:
            return jsonify({"error": "Menu item not found"}), 404

        restaurant = mongo.db.restaurants.find_one({
            "_id": menu_item["restaurant_id"],
            "owner_id": ObjectId(get_jwt_identity())
        })
        if not restaurant and mongo.db.users.find_one({"_id": ObjectId(get_jwt_identity())})["role"] != "Admin":
            return jsonify({"error": "Unauthorized"}), 403
       
       

        if request.method == "PUT":
            data = request.get_json()
            updates = {
                "name": bleach.clean(data.get("name", menu_item["name"])).strip(),
                "description": bleach.clean(data.get("description", menu_item["description"])).strip(),
                "price": float(data["price"]) if "price" in data else menu_item["price"],
                "updated_at": datetime.now(timezone.utc),
               
            }
            
            mongo.db.menu_items.update_one(
                {"_id": ObjectId(id)},
                {"$set": updates}
            )
            return jsonify({"message": "Menu item updated"}), 200

        elif request.method == "DELETE":
            mongo.db.menu_items.delete_one({"_id": ObjectId(id)})
            return jsonify({"message": "Menu item deleted"}), 200

    except Exception as e:
        app.logger.error(f"Menu item error: {str(e)}")
        return jsonify({"error": "Operation failed"}), 500

# Review Routes
@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    try:
        restaurant_id = request.args.get("restaurant_id")
        query = {"restaurant_id": ObjectId(restaurant_id)} if restaurant_id else {}
        reviews = list(mongo.db.reviews.find(query))
        return jsonify(json.loads(dumps(reviews))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reviews", methods=["POST"])
@jwt_required()
def create_review():
    try:
        data = request.get_json()
        review = {
            "user_id": ObjectId(get_jwt_identity()),
            "restaurant_id": ObjectId(data["restaurant_id"]),
            "rating": min(5, max(1, int(data["rating"]))),
            "comment": bleach.clean(data.get("comment", "")).strip(),
            "created_at": datetime.now(timezone.utc)
        }
        result = mongo.db.reviews.insert_one(review)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as e:
        app.logger.error(f"Review error: {str(e)}")
        return jsonify({"error": "Creation failed"}), 500

@app.route("/api/reviews/<id>", methods=["DELETE"])
@jwt_required()
def delete_review(id):
    try:
        review = mongo.db.reviews.find_one({"_id": ObjectId(id)})
        if not review:
            return jsonify({"error": "Review not found"}), 404

        user_id = ObjectId(get_jwt_identity())
        user = mongo.db.users.find_one({"_id": user_id})
        
        if review["user_id"] != user_id and user["role"] != "Admin":
            return jsonify({"error": "Unauthorized"}), 403

        mongo.db.reviews.delete_one({"_id": ObjectId(id)})
        return jsonify({"message": "Review deleted"}), 200
    except Exception as e:
        app.logger.error(f"Review deletion error: {str(e)}")
        return jsonify({"error": "Deletion failed"}), 500

# Admin Routes
@app.route("/api/admin/users", methods=["GET"])
@has_role("Admin")
def admin_get_users():
    try:
        users = list(mongo.db.users.find({}, {"password": 0}))
        return jsonify(json.loads(dumps(users))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<id>/role", methods=["PUT"])
@has_role("Admin")
def update_user_role_handler(id):
    try:
        data = request.get_json()
        allowed_roles = ["Customer", "Restaurant Owner", "Admin"]
        if data["role"] not in allowed_roles:
            return jsonify({"error": "Invalid role"}), 400

        mongo.db.users.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"role": data["role"]}}
        )
        return jsonify({"message": "Role updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<id>", methods=["DELETE"])
@has_role("Admin")
def delete_user(id):
    try:
        mongo.db.users.delete_one({"_id": ObjectId(id)})
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/restaurants", methods=["GET"])
@has_role("Admin")
def admin_get_restaurants():
    try:
        status = request.args.get("status", "pending")
        restaurants = list(mongo.db.restaurants.find({"status": status}))
        return jsonify(json.loads(dumps(restaurants))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/restaurants/<id>/approve", methods=["PUT"])
@has_role("Admin")
def approve_restaurant_handler(id):
    try:
        data = request.get_json()
        mongo.db.restaurants.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "status": "approved",
                "admin_notes": bleach.clean(data.get("notes", "")),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return jsonify({"message": "Restaurant approved"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/restaurants/<id>/reject", methods=["PUT"])
@has_role("Admin")
def reject_restaurant_handler(id):
    try:
        data = request.get_json()
        mongo.db.restaurants.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "status": "rejected",
                "admin_notes": bleach.clean(data.get("notes", "")),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return jsonify({"message": "Restaurant rejected"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Profile Management
@app.route("/api/profile", methods=["GET", "PUT"])
@jwt_required()
def profile():
    try:
        user_id = ObjectId(get_jwt_identity())
        if request.method == "GET":
            user = mongo.db.users.find_one({"_id": user_id}, {"password": 0})
            return jsonify(json.loads(dumps(user))) if user else abort(404)
        
        elif request.method == "PUT":
            data = request.get_json()
            allowed_fields = ["first_name", "last_name", "email"]
            updates = {k: bleach.clean(v).strip() for k, v in data.items() if k in allowed_fields}
            
            if "email" in updates:
                existing = mongo.db.users.find_one({"email": updates["email"]})
                if existing and existing["_id"] != user_id:
                    return jsonify({"error": "Email already exists"}), 400
            
            mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": updates}
            )
            return jsonify({"message": "Profile updated"}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Saved Restaurants
@app.route("/api/saved-restaurants", methods=["POST", "GET", "DELETE"])
@jwt_required()
def saved_restaurants():
    try:
        user_id = ObjectId(get_jwt_identity())
        restaurant_id = request.args.get("restaurant_id") or request.json.get("restaurant_id")
        
        if request.method == "POST":
            # Validate restaurant exists and is approved
            if not mongo.db.restaurants.find_one({"_id": ObjectId(restaurant_id), "status": "approved"}):
                return jsonify({"error": "Invalid restaurant"}), 400
            
            mongo.db.users.update_one(
                {"_id": user_id},
                {"$addToSet": {"saved_restaurants": ObjectId(restaurant_id)}}
            )
            return jsonify({"message": "Restaurant saved"}), 200
        
        elif request.method == "GET":
            user = mongo.db.users.find_one({"_id": user_id}, {"saved_restaurants": 1})
            restaurants = list(mongo.db.restaurants.find({
                "_id": {"$in": user.get("saved_restaurants", [])},
                "status": "approved"
            }))
            return jsonify(json.loads(dumps(restaurants))), 200
        
        elif request.method == "DELETE":
            if not restaurant_id:
                return jsonify({"error": "Missing restaurant_id"}), 400
            
            mongo.db.users.update_one(
                {"_id": user_id},
                {"$pull": {"saved_restaurants": ObjectId(restaurant_id)}}
            )
            return jsonify({"message": "Restaurant unsaved"}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Token Management
@app.route("/api/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    return jsonify(access_token=create_access_token(identity=identity)), 200

@app.route("/api/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    mongo.db.token_blocklist.insert_one({
        "jti": jti,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    })
    return jsonify(message="Logged out"), 200

# Error Handlers
@app.errorhandler(400)
def bad_request(e):
    return jsonify(error="Bad request"), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify(error="Unauthorized"), 401

@app.errorhandler(403)
def forbidden(e):
    return jsonify(error="Forbidden"), 403

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Resource not found"), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify(error="Internal server error"), 500

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