# User Guide

## Overview

This application allows members of school clubs to submit requests for Amazon orders. An administrator can then review, confirm, and track those orders. The system uses a locally-run AI model (via Ollama) to automatically extract order details from tracking URLs.

There are three pages accessible from the navigation bar at the top of every page:

- **All Requests** - View all submitted order requests.
- **New Request** - Submit a new order request.
- **Admin** - Manage requests and track orders (intended for administrators).

---

## Viewing Requests

The main page (`All Requests`) displays all order requests as a list of cards, with the most recently submitted requests shown first.

### Filtering

Use the **Filter by Club** dropdown to show only requests from a specific club. Select "All Clubs" to remove the filter. The dropdown is populated from all club names that have been used in past requests.

### Sorting

Use the **Sort by** dropdown to change the order of results:

- **Date Requested (newest first)** - Default. Sorts by the time the request was submitted.
- **Expected Delivery Date** - Sorts by the delivery estimate of the items in each request. Useful for seeing which orders are arriving soonest.

### Request Cards

Each request card displays:

- **Club name** and **urgency/status badges** in the header.
- **Submitted by**, **request date**, and **desired delivery date** (if provided).
- **Message** containing the details the requester provided.
- **Items table** showing each item in the request with:
  - Item name (if extracted by AI) and the Amazon URL.
  - Quantity.
  - Current order status (Not Ordered, Ordered, Shipped, Out for Delivery, Delivered, Cancelled, or Returned).
  - Estimated delivery date (if known).
  - Additional details: price, shipping carrier, tracking link, and a summary (all populated by AI extraction when a tracking URL is available).

---

## Submitting a Request

Navigate to the **New Request** page to submit an order request.

### Required Fields

| Field        | Description |
|--------------|-------------|
| **Club Name** | Select an existing club from the dropdown, or type a new club name in the text field below it. If a new name is entered, it is automatically added to the club database. |
| **Your Name** | The name of the person submitting the request (teacher or student). |
| **Urgency** | Select either "Not Urgent" or "Urgent". |
| **Desired Delivery Date** | Only appears and is required when urgency is set to "Urgent". Pick the date by which the order should be delivered. |
| **Message / Details** | A text area for any relevant information: why the order is being made, physical handling instructions, how to deliver the items to the club, etc. |
| **Items** | At least one Amazon item URL is required. |

### Adding Items

Each request can contain one or more items. For each item, provide:

- **Amazon item URL** - A link to the product on Amazon.
- **Quantity** - How many of that item to order (defaults to 1).

Click **+ Add Another Item** to add additional items to the same request. Click **Remove** to delete an item row (the last remaining row cannot be removed).

### Submitting

Click **Submit Request** to create the request. If successful, you will be redirected to the main request list. If there are validation errors (missing fields, invalid urgency, etc.), a notification will appear describing the issue.

---

## Request Lifecycle

A request goes through the following stages:

1. **Pending** - The request has been submitted and is awaiting administrator review.
2. **Confirmed** - An administrator has approved the request.
3. **Rejected** - An administrator has declined the request.

Individual items within a confirmed request are tracked separately through these order statuses:

1. **Not Ordered** - The item has not been purchased yet.
2. **Ordered** - The item has been purchased on Amazon.
3. **Shipped** - The item is in transit.
4. **Out for Delivery** - The item is out for delivery.
5. **Delivered** - The item has arrived.
6. **Cancelled** - The order was cancelled.
7. **Returned** - The item was returned.
