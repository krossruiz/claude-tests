const statusFilter = document.getElementById('status-filter');
const clubFilter = document.getElementById('club-filter');
const adminList = document.getElementById('admin-list');

async function loadClubs() {
  try {
    const res = await fetch('/api/clubs');
    const clubs = await res.json();
    clubs.forEach(club => {
      const opt = document.createElement('option');
      opt.value = club.name;
      opt.textContent = club.name;
      clubFilter.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load clubs:', err);
  }
}

async function loadRequests() {
  try {
    const params = new URLSearchParams();
    if (clubFilter.value) params.set('club', clubFilter.value);

    const res = await fetch(`/api/requests?${params}`);
    let requests = await res.json();

    // Client-side status filter (server doesn't filter by request status)
    if (statusFilter.value) {
      requests = requests.filter(r => r.status === statusFilter.value);
    }

    renderAdmin(requests);
  } catch (err) {
    adminList.innerHTML = '<div class="empty-state"><h2>Failed to load requests</h2></div>';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function statusLabel(status) {
  const labels = {
    not_ordered: 'Not Ordered',
    ordered: 'Ordered',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned'
  };
  return labels[status] || status;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncateUrl(url, maxLen = 45) {
  if (!url || url.length <= maxLen) return url || '';
  return url.substring(0, maxLen) + '...';
}

function renderAdmin(requests) {
  if (requests.length === 0) {
    adminList.innerHTML = `
      <div class="empty-state">
        <h2>No requests found</h2>
        <p>No requests match the current filters.</p>
      </div>`;
    return;
  }

  adminList.innerHTML = requests.map(req => `
    <div class="card" data-id="${req._id}">
      <div class="card-header">
        <h3>${escapeHtml(req.clubName)} &mdash; ${escapeHtml(req.personName)}</h3>
        <div>
          <span class="badge badge-${req.urgency}">${req.urgency}</span>
          <span class="badge badge-${req.status}">${req.status}</span>
        </div>
      </div>
      <div class="card-meta">
        <span>Requested: ${formatDateTime(req.createdAt)}</span>
        ${req.desiredDeliveryDate ? `<span>Desired by: ${formatDate(req.desiredDeliveryDate)}</span>` : ''}
      </div>
      <div class="card-body">
        <p>${escapeHtml(req.message)}</p>
      </div>

      <div style="margin: 12px 0; display: flex; gap: 8px;">
        ${req.status !== 'confirmed' ? `<button class="btn btn-success btn-sm" onclick="setStatus('${req._id}', 'confirmed')">Confirm</button>` : ''}
        ${req.status !== 'rejected' ? `<button class="btn btn-danger btn-sm" onclick="setStatus('${req._id}', 'rejected')">Reject</button>` : ''}
        ${req.status !== 'pending' ? `<button class="btn btn-outline btn-sm" onclick="setStatus('${req._id}', 'pending')">Reset to Pending</button>` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Amazon URL</th>
            <th>Qty</th>
            <th>Order Status</th>
            <th>Tracking</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${req.items.map(item => `
            <tr>
              <td><a href="${escapeHtml(item.amazonUrl)}" target="_blank" rel="noopener">${escapeHtml(truncateUrl(item.amazonUrl))}</a></td>
              <td>${item.quantity}</td>
              <td>
                <select class="item-status-select" data-req="${req._id}" data-item="${item._id}" onchange="setItemStatus(this)">
                  ${['not_ordered','ordered','shipped','out_for_delivery','delivered','cancelled','returned'].map(s =>
                    `<option value="${s}" ${item.orderStatus === s ? 'selected' : ''}>${statusLabel(s)}</option>`
                  ).join('')}
                </select>
              </td>
              <td>
                ${item.trackingUrl
                  ? `<a href="${escapeHtml(item.trackingUrl)}" target="_blank" rel="noopener">${escapeHtml(truncateUrl(item.trackingUrl))}</a>`
                  : '<em>None</em>'
                }
                <div class="tracking-input">
                  <input type="url" placeholder="Tracking URL" id="track-${item._id}" value="${escapeHtml(item.trackingUrl || '')}">
                  <button class="btn btn-primary btn-sm" onclick="setTracking('${req._id}', '${item._id}')">Save</button>
                </div>
                ${item.extractedInfo?.lastChecked ? `
                  <div class="extracted-info" style="margin-top:8px;">
                    <dl>
                      ${item.extractedInfo.itemName ? `<dt>Item:</dt><dd>${escapeHtml(item.extractedInfo.itemName)}</dd>` : ''}
                      ${item.extractedInfo.price ? `<dt>Price:</dt><dd>${escapeHtml(item.extractedInfo.price)}</dd>` : ''}
                      ${item.extractedInfo.carrier ? `<dt>Carrier:</dt><dd>${escapeHtml(item.extractedInfo.carrier)}</dd>` : ''}
                      ${item.deliveryEstimate ? `<dt>Delivery:</dt><dd>${formatDate(item.deliveryEstimate)}</dd>` : ''}
                      ${item.extractedInfo.rawSummary ? `<dt>Summary:</dt><dd>${escapeHtml(item.extractedInfo.rawSummary)}</dd>` : ''}
                      <dt>Last checked:</dt><dd>${formatDateTime(item.extractedInfo.lastChecked)}</dd>
                    </dl>
                  </div>
                ` : ''}
              </td>
              <td>
                ${item.trackingUrl ? `<button class="btn btn-outline btn-sm" onclick="reExtract('${req._id}', '${item._id}')">Re-extract Info</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

async function setStatus(reqId, status) {
  try {
    const res = await fetch(`/api/admin/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed');
    showToast(`Request ${status}.`, 'success');
    loadRequests();
  } catch (err) {
    showToast('Failed to update status.', 'error');
  }
}

async function setItemStatus(selectEl) {
  const reqId = selectEl.dataset.req;
  const itemId = selectEl.dataset.item;
  const orderStatus = selectEl.value;
  try {
    const res = await fetch(`/api/admin/requests/${reqId}/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus })
    });
    if (!res.ok) throw new Error('Failed');
    showToast('Item status updated.', 'success');
  } catch (err) {
    showToast('Failed to update item status.', 'error');
  }
}

async function setTracking(reqId, itemId) {
  const input = document.getElementById(`track-${itemId}`);
  const trackingUrl = input.value.trim();
  if (!trackingUrl) {
    showToast('Enter a tracking URL.', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/admin/requests/${reqId}/items/${itemId}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingUrl })
    });
    if (!res.ok) throw new Error('Failed');
    showToast('Tracking URL saved. Extracting info...', 'success');
    loadRequests();
  } catch (err) {
    showToast('Failed to save tracking URL.', 'error');
  }
}

async function reExtract(reqId, itemId) {
  try {
    showToast('Re-extracting order info...', 'success');
    const res = await fetch(`/api/admin/requests/${reqId}/items/${itemId}/extract`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed');
    showToast('Info re-extracted.', 'success');
    loadRequests();
  } catch (err) {
    showToast('Extraction failed. Is Ollama running?', 'error');
  }
}

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

statusFilter.addEventListener('change', loadRequests);
clubFilter.addEventListener('change', loadRequests);

loadClubs();
loadRequests();
