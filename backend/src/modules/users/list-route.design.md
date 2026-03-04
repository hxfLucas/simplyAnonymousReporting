# Users List Route Design

- **Router path:** `/list` (mounted under `/users` → full path: `/users/list`)
- **HTTP method:** `GET`

- **Query parameters:**
  - `limit` (integer, optional): alias for `size`. If provided, it sets the number of items per page. Default: `25`. Max: `100`.
  - `size` (integer, optional): number of items per page. Default: `25`. Max: `100`.
  - `page` (integer, optional): 1-based page index. Default: `1`.
  - `search` (string, optional): free-text search applied to `email`, `firstName`, and `lastName`. Partial, case-insensitive match. If omitted, no text filtering is applied.

- **Authentication / Authorization:**
  - Requires authentication via existing bearer/JWT mechanism.
  - Requires admin privileges: route guarded by `ensureAdmin` (admin-only listing).

- **Response shape (200 OK):**
  - Top-level object with:
    - `items`: array of user objects (may be empty).
    - `pagination` (optional, present when paging is used):
      - `total` (integer): total number of users matching the filters.
      - `count` (integer): number of items returned in this response (`items.length`).
      - `page` (integer): current page (1-based).
      - `size` (integer): page size used for this response.

- **User item shape (safe response fields):**
  - `id` (string | number) — public identifier for the user.
  - `email` (string)
  - `firstName` (string | null)
  - `lastName` (string | null)
  - `roles` (string[]) — array of role names / keys.
  - `isActive` (boolean)
  - `createdAt` (string, ISO8601)
  - `updatedAt` (string, ISO8601)

  - Notes: Do NOT return sensitive fields such as `password`, `salt`, `resetToken`, `verificationToken`, or internal-only attributes.

- **Error cases & status codes:**
  - `200 OK` — success, returns `items` and optional `pagination`.
  - `400 Bad Request` — invalid query parameters (e.g., non-numeric `page`/`size`/`limit`, `page < 1`, `size` out of allowed range).
  - `401 Unauthorized` — missing or invalid authentication token.
  - `403 Forbidden` — authenticated but not an admin (fails `ensureAdmin`).
  - `500 Internal Server Error` — unexpected server error.

- **Behavior details & constraints:**
  - `limit` and `size` are interchangeable; if both provided, the last one parsed by the server wins (server should prefer `size` or explicitly document precedence).
  - `page` is 1-based; offset = `(page - 1) * size`.
  - `search` should be trimmed and ignored if empty.
  - Server should enforce a reasonable maximum `size` (suggested `100`) to avoid large responses.

-- End of design
