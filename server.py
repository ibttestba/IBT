# Save this as: C:\GamingWorkshop\server.py

import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime
import socket

PORT = 8000
DATA_DIR = "data"

# Create data directory if it doesn't exist
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_local_ip():
    """Get local IP address"""
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def read_json_file(filename):
    """Read JSON file from data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def write_json_file(filename, data):
    """Write JSON file to data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except:
        return False

class GameWorkshopHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404)
    
    def handle_api_get(self):
        """Handle API GET requests"""
        if self.path == '/api/registrations':
            registrations = read_json_file('registrations.json')
            self.send_json_response({
                'success': True,
                'data': registrations,
                'count': len(registrations)
            })
        
        elif self.path == '/api/sessions':
            sessions = read_json_file('sessions.json')
            self.send_json_response({
                'success': True,
                'data': sessions,
                'count': len(sessions)
            })
        
        elif self.path == '/api/health':
            self.send_json_response({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'platform': 'Python Local Server'
            })
        
        elif self.path == '/api/backup':
            registrations = read_json_file('registrations.json')
            sessions = read_json_file('sessions.json')
            backup = {
                'timestamp': datetime.now().isoformat(),
                'platform': 'Python Local Server',
                'registrations': registrations,
                'sessions': sessions
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Disposition', 'attachment; filename=gaming-workshop-backup.json')
            self.end_headers()
            self.wfile.write(json.dumps(backup, indent=2).encode())
        
        else:
            self.send_error(404)
    
    def handle_api_post(self):
        """Handle API POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            self.send_json_response({'success': False, 'error': 'Invalid JSON'}, 400)
            return
        
        if self.path == '/api/registrations':
            if write_json_file('registrations.json', data):
                self.send_json_response({
                    'success': True,
                    'count': len(data),
                    'message': 'Registrations saved successfully'
                })
            else:
                self.send_json_response({'success': False, 'error': 'Failed to save'}, 500)
        
        elif self.path == '/api/sessions':
            if write_json_file('sessions.json', data):
                self.send_json_response({
                    'success': True,
                    'count': len(data),
                    'message': 'Sessions saved successfully'
                })
            else:
                self.send_json_response({'success': False, 'error': 'Failed to save'}, 500)
        
        else:
            self.send_error(404)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), GameWorkshopHandler) as httpd:
        local_ip = get_local_ip()
        
        print("=" * 60)
        print("🎮 GAMING WORKSHOP SERVER STARTED! 🎮")
        print("=" * 60)
        print(f"Platform: Python Local Server")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"\nAccess URLs:")
        print(f"  Local:    http://localhost:{PORT}")
        print(f"  Network:  http://{local_ip}:{PORT}")
        print(f"\nPages:")
        print(f"  Registration: http://{local_ip}:{PORT}/index.html")
        print(f"  Dashboard:    http://{local_ip}:{PORT}/dashboard.html")
        print(f"  Admin:        http://{local_ip}:{PORT}/admin.html")
        print(f"\n" + "=" * 60)
        print("Share the Network URL with participants!")
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")