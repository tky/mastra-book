
```
curl -N -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"messages": [{"id": "ml", "role": "user", "parts": [{"type": "text", "text": "こんにちわ"}]}]}'
```
