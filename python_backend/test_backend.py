import requests
import os

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing health/root...")
    try:
        # FastAPI root doesn't have a GET / by default in my implementation, 
        # but let's see if it's up.
        response = requests.get(f"{BASE_URL}/docs")
        print(f"Status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chatbot_creation():
    print("\nTesting chatbot creation...")
    url = f"{BASE_URL}/upload-pdf"
    # Create a dummy text file and rename it to .pdf for testing (PDFReader might fail if not valid PDF)
    # Better: use a small valid PDF if possible.
    
    # For now, let's just see if we can reach the endpoint.
    # We'll mock the multipart form data.
    files = [('files', ('test.pdf', b'%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF', 'application/pdf'))]
    data = {
        'chatbot_name': 'Test Python Bot',
        'owner_id': '00000000-0000-0000-0000-000000000000'
    }
    
    try:
        response = requests.post(url, data=data, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    if test_health():
        res = test_chatbot_creation()
        if res and "chatbot_id" in res:
            chatbot_id = res["chatbot_id"]
            print(f"\nSuccessfully created chatbot: {chatbot_id}")
            
            # Test chat
            print("\nTesting chat...")
            chat_url = f"{BASE_URL}/chat/{chatbot_id}"
            chat_data = {
                "message": "Hello, who are you?",
                "session_id": "test-session",
                "history": []
            }
            chat_res = requests.post(chat_url, json=chat_data)
            print(f"Chat Status: {chat_res.status_code}")
            print(f"Chat Response: {chat_res.json()}")
        else:
            print("\nChatbot creation failed, skipping chat test.")
    else:
        print("\nBackend not reachable.")
