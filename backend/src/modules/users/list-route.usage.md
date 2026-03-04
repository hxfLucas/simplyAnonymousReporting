Endpoint: GET /api/users

Description: Returns a paginated list of users. Supports filtering and sorting.

Query parameters:
- `page` (number, optional) — Page number (default: 1).
- `limit` (number, optional) — Items per page (default: 20).
- `search` (string, optional) — Text search across name and email.
- `sort` (string, optional) — Sort field, e.g. `createdAt` or `name`.

Example request:

curl -s "http://localhost:3000/api/users?page=1&limit=20&search=alice&sort=createdAt"

Example response (200):

{
  "data": [
    {
      "id": "1",
      "email": "alice@example.com",
      "name": "Alice Example",
      "role": "user",
      "createdAt": "2024-01-02T15:04:05.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
