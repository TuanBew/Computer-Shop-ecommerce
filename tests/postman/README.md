# Computer Shop API — Postman Collection

## Import
1. Open Postman
2. Import `computer-shop.postman_collection.json`
3. Set `baseUrl` to `http://localhost:3000`

## Run with Newman
```bash
npm install -g newman
newman run tests/postman/computer-shop.postman_collection.json --env-var baseUrl=http://localhost:3000
```

## Endpoints covered
- 30+ endpoints across 5 folders
- 8 automated test scripts on critical endpoints
- Authentication flow: register → login saves token → auth requests use token
