import requests

url = "http://127.0.0.1:8000/predict"

data = {
    "data": [0, "tcp", "http", "SF", 181, 5450]
}

response = requests.post(url, json=data)

print(response.json())