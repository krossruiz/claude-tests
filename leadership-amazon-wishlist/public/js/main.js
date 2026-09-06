const clubFilter = document.getElementById('club-filter');
const sortSelect = document.getElementById('sort-select');
const requestsList = document.getElementById('requests-list');

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
    if (sortSelect.value === 'delivery') params.set('sort', 'delivery');

    const res = await fetch(`/api/requests?${params}`);
    const requests = await res.json();
    renderRequests(requests);
  } catch (err) {
    requestsList.innerHTML = '<div class="empty-state"><h2>Failed to load requests</h2></div>';
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

function truncateUrl(url, maxLen = 50) {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '...';
}

function renderRequests(requests) {
  if (requests.length === 0) {
    requestsList.innerHTML = `
      <div class="empty-state">
        <h2>No requests found</h2>
        <p>No order requests match the current filters.</p>
      </div>`;
    return;
  }

  requestsList.innerHTML = requests.map(req => `
    <div class="card">
      <div class="card-header">
        <h3>${escapeHtml(req.clubName)}</h3>
        <div>
          <span class="badge badge-${req.urgency}">${req.urgency}</span>
          <span class="badge badge-${req.status}">${req.status}</span>
        </div>
      </div>
      <div class="card-meta">
        <span>By: ${escapeHtml(req.personName)}</span>
        <span>Requested: ${formatDateTime(req.createdAt)}</span>
        ${req.desiredDeliveryDate ? `<span>Desired by: ${formatDate(req.desiredDeliveryDate)}</span>` : ''}
      </div>
      <div class="card-body">
        <p>${escapeHtml(req.message)}</p>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Delivery Est.</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${req.items.map(item => `
            <tr>
              <td>
                ${item.extractedInfo?.itemName
                  ? `<strong>${escapeHtml(item.extractedInfo.itemName)}</strong><br>`
                  : ''}
                <a href="${escapeHtml(item.amazonUrl)}" target="_blank" rel="noopener">${escapeHtml(truncateUrl(item.amazonUrl))}</a>
              </td>
              <td>${item.quantity}</td>
              <td><span class="badge badge-${item.orderStatus}">${statusLabel(item.orderStatus)}</span></td>
              <td>${formatDate(item.deliveryEstimate)}</td>
              <td>
                ${item.extractedInfo?.price ? `Price: ${escapeHtml(item.extractedInfo.price)}` : ''}
                ${item.extractedInfo?.carrier ? `<br>Carrier: ${escapeHtml(item.extractedInfo.carrier)}` : ''}
                ${item.trackingUrl ? `<br><a href="${escapeHtml(item.trackingUrl)}" target="_blank" rel="noopener">Track</a>` : ''}
                ${item.extractedInfo?.rawSummary ? `<br><em>${escapeHtml(item.extractedInfo.rawSummary)}</em>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

clubFilter.addEventListener('change', loadRequests);
sortSelect.addEventListener('change', loadRequests);

loadClubs();
loadRequests();
