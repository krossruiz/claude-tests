# Admin Guide

## Overview

The Admin page provides tools to manage order requests submitted by school clubs. Administrators can confirm or reject requests, attach order tracking URLs, manually update item statuses, and use AI-powered extraction to pull order details from tracking pages.

---

## Accessing the Admin Panel

Click **Admin** in the navigation bar. There is no authentication gate; access control should be handled at the network level or added as a future enhancement.

---

## Filtering Requests

The admin panel has two filter controls at the top:

- **Filter by Status** - Show only requests with a specific status. Defaults to "Pending" so new requests are visible immediately. Options: All, Pending, Confirmed, Rejected.
- **Filter by Club** - Show only requests from a specific club.

---

## Confirming and Rejecting Requests

Each request card has action buttons:

- **Confirm** - Approves the request. The status badge changes to "confirmed".
- **Reject** - Declines the request. The status badge changes to "rejected".
- **Reset to Pending** - Moves a confirmed or rejected request back to "pending".

These actions apply to the entire request, not individual items.

---

## Managing Item Order Status

Each item in a request has an **Order Status** dropdown in the admin view. Use this to manually set the status of an item to any of:

- Not Ordered
- Ordered
- Shipped
- Out for Delivery
- Delivered
- Cancelled
- Returned

Changes are saved immediately when a new status is selected.

---

## Adding Tracking URLs

When an Amazon order is placed for an item, the administrator can link the tracking URL:

1. Find the item row in the request card.
2. Enter the tracking URL in the input field under the "Tracking" column.
3. Click **Save**.

When a tracking URL is saved:

- The item's order status is automatically set to "ordered" (unless the AI extraction finds a more specific status).
- The system fetches the tracking page and sends its content to the locally-running Ollama AI model for analysis.
- Extracted information (item name, price, carrier, delivery estimate, and a status summary) is stored and displayed in the admin panel and on the public request list.

If Ollama is not running or the page cannot be fetched, the tracking URL is still saved. Extraction can be retried later.

---

## Re-extracting Order Information

Click the **Re-extract Info** button on any item that has a tracking URL to re-fetch the page and re-run AI extraction. This is useful for:

- Updating delivery estimates after the initial extraction.
- Getting fresh status information as an order progresses.
- Retrying after a previous extraction failure.

---

## Background Order Tracking

The server automatically re-checks all items that meet both of these conditions:

1. The item has a tracking URL.
2. The item's order status is one of: ordered, shipped, or out_for_delivery.

Items with a status of "delivered", "cancelled", "returned", or "not_ordered" are not checked.

The check interval is configured via the `ORDER_CHECK_INTERVAL_MS` environment variable in `.env` (default: 300000ms / 5 minutes). Each background check:

1. Fetches the tracking page.
2. Sends the page content to Ollama for extraction.
3. Updates the item's extracted info, delivery estimate, and order status in the database.

Background check activity is logged to the server console.

---

## Extracted Information Fields

When AI extraction succeeds, the following fields may be populated for each item:

| Field              | Description |
|--------------------|-------------|
| **Item Name**      | The name of the product as found on the tracking page. |
| **Price**          | The price of the item (e.g., "$29.99"). |
| **Carrier**        | The shipping carrier (e.g., "UPS", "USPS", "Amazon Logistics"). |
| **Delivery Est.**  | The estimated delivery date. |
| **Summary**        | A brief 1-2 sentence summary of the current order status. |
| **Last Checked**   | The date and time the extraction was last run for this item. |

All fields are set to null if not found on the tracking page. The AI model works on a best-effort basis; results depend on the content and structure of the tracking page.
