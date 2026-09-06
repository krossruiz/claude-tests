# API Reference

All endpoints return JSON. Request bodies should be sent as `application/json`.

Error responses follow the format:

```json
{ "error": "Description of the error." }
```

---

## Clubs

### GET /api/clubs

Returns all clubs, sorted alphabetically by name.

**Response:** `200 OK`

```json
[
  {
    "_id": "664a...",
    "name": "Robotics Club",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### POST /api/clubs

Creates a new club. If a club with the same name already exists, the existing club is returned.

**Request body:**

| Field  | Type   | Required | Description |
|--------|--------|----------|-------------|
| `name` | string | yes      | Club name.  |

**Response:** `201 Created` (new club) or `200 OK` (already exists)

```json
{
  "_id": "664a...",
  "name": "Robotics Club",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

---

## Requests

### GET /api/requests

Returns all requests with optional filtering and sorting.

**Query parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `club`    | string | Filter by exact club name. |
| `sort`    | string | Sort mode. `"delivery"` sorts by item delivery estimate (ascending). Omit or use any other value for default chronological sort (newest first). |

**Response:** `200 OK`

```json
[
  {
    "_id": "664b...",
    "clubName": "Robotics Club",
    "personName": "Jane Smith",
    "message": "Need supplies for the upcoming competition.",
    "urgency": "urgent",
    "desiredDeliveryDate": "2025-02-01T00:00:00.000Z",
    "status": "pending",
    "items": [
      {
        "_id": "664c...",
        "amazonUrl": "https://www.amazon.com/dp/B0...",
        "quantity": 2,
        "trackingUrl": null,
        "orderStatus": "not_ordered",
        "deliveryEstimate": null,
        "extractedInfo": {
          "itemName": null,
          "price": null,
          "carrier": null,
          "lastChecked": null,
          "rawSummary": null
        }
      }
    ],
    "createdAt": "2025-01-20T14:30:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
]
```

### GET /api/requests/:id

Returns a single request by its ID.

**Response:** `200 OK` or `404 Not Found`

### POST /api/requests

Creates a new order request. If the club name does not already exist in the database, it is automatically added.

**Request body:**

| Field                 | Type   | Required | Description |
|-----------------------|--------|----------|-------------|
| `clubName`            | string | yes      | Name of the club. |
| `personName`          | string | yes      | Name of the person submitting the request. |
| `message`             | string | yes      | Details about the request. |
| `urgency`             | string | yes      | `"urgent"` or `"not-urgent"`. |
| `desiredDeliveryDate` | string | conditional | ISO 8601 date string. Required if urgency is `"urgent"`. |
| `items`               | array  | yes      | Array of item objects (at least one). |

**Item object:**

| Field       | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `amazonUrl` | string  | yes      | URL of the Amazon product. |
| `quantity`   | integer | no       | Number to order. Defaults to 1. Must be >= 1. |

**Response:** `201 Created`

---

## Admin

### PATCH /api/admin/requests/:id/status

Updates the status of a request (confirm, reject, or reset to pending).

**Request body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `status` | string | yes      | `"confirmed"`, `"rejected"`, or `"pending"`. |

**Response:** `200 OK` (returns the updated request) or `404 Not Found`

### PATCH /api/admin/requests/:id/items/:itemId/tracking

Adds or updates the tracking URL for a specific item. Sets the item's order status to `"ordered"` and triggers AI extraction of order details via Ollama.

**URL parameters:**

| Parameter | Description |
|-----------|-------------|
| `:id`     | Request ID. |
| `:itemId` | Item subdocument ID. |

**Request body:**

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `trackingUrl` | string | yes      | The order tracking URL. |

**Response:** `200 OK` (returns the full updated request)

If Ollama is unavailable or extraction fails, the tracking URL is still saved. The `extractedInfo` fields will remain unchanged and extraction can be retried later.

### PATCH /api/admin/requests/:id/items/:itemId/status

Manually updates the order status of a specific item.

**Request body:**

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `orderStatus` | string | yes      | One of: `not_ordered`, `ordered`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `returned`. |

**Response:** `200 OK` (returns the full updated request) or `404 Not Found`

### POST /api/admin/requests/:id/items/:itemId/extract

Re-runs AI extraction on an item that already has a tracking URL. Fetches the tracking page again and sends it to Ollama to extract updated order information.

**URL parameters:**

| Parameter | Description |
|-----------|-------------|
| `:id`     | Request ID. |
| `:itemId` | Item subdocument ID. |

**Request body:** None.

**Response:** `200 OK` (returns the full updated request), `400 Bad Request` (if no tracking URL is set), or `404 Not Found`
