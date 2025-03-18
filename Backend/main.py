from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS= CORS(app,origins='*')

@app.route('/api/users',methods=['GET'])
def get_users():
    return jsonify({
        'users': [
            {
                'id': 1,
                'username': 'Ali'
            },
            {
                'id': 2,
                'username': 'Mujtaba'
            }
        ]
    })
if  __name__ == '__main__':
    app.run(debug=True,port=8080) 