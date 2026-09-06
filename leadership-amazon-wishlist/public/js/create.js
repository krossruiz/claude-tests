const clubSelect = document.getElementById('club-select');
const newClubInput = document.getElementById('new-club');
const urgencySelect = document.getElementById('urgency');
const deliveryDateGroup = document.getElementById('delivery-date-group');
const deliveryDateInput = document.getElementById('desired-delivery');
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item');
const form = document.getElementById('request-form');

// Load existing clubs
async function loadClubs() {
  try {
    const res = await fetch('/api/clubs');
    const clubs = await res.json();
    clubs.forEach(club => {
      const opt = document.createElement('option');
      opt.value = club.name;
      opt.textContent = club.name;
      clubSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load clubs:', err);
  }
}

// Clear new club input when selecting existing, and vice versa
clubSelect.addEventListener('change', () => {
  if (clubSelect.value) newClubInput.value = '';
});
newClubInput.addEventListener('input', () => {
  if (newClubInput.value.trim()) clubSelect.value = '';
});

// Show/hide delivery date based on urgency
urgencySelect.addEventListener('change', () => {
  const isUrgent = urgencySelect.value === 'urgent';
  deliveryDateGroup.style.display = isUrgent ? '' : 'none';
  deliveryDateInput.required = isUrgent;
  if (!isUrgent) deliveryDateInput.value = '';
});

// Add item row
addItemBtn.addEventListener('click', () => {
  addItemRow();
  updateRemoveButtons();
});

function addItemRow() {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <div>
      <input type="url" class="item-url" placeholder="Amazon item URL" required>
    </div>
    <div>
      <input type="number" class="item-qty" value="1" min="1" placeholder="Qty">
    </div>
    <div>
      <button type="button" class="btn btn-danger btn-sm remove-item">Remove</button>
    </div>
  `;
  itemsContainer.appendChild(row);
}

// Remove item row
itemsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-item')) {
    e.target.closest('.item-row').remove();
    updateRemoveButtons();
  }
});

function updateRemoveButtons() {
  const rows = itemsContainer.querySelectorAll('.item-row');
  rows.forEach((row, i) => {
    const btn = row.querySelector('.remove-item');
    btn.disabled = rows.length === 1;
  });
}

// Submit form
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clubName = newClubInput.value.trim() || clubSelect.value;
  if (!clubName) {
    showToast('Please select or enter a club name.', 'error');
    return;
  }

  const personName = document.getElementById('person-name').value.trim();
  const urgency = urgencySelect.value;
  const message = document.getElementById('message').value.trim();
  const desiredDeliveryDate = deliveryDateInput.value || null;

  if (!personName || !urgency || !message) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (urgency === 'urgent' && !desiredDeliveryDate) {
    showToast('Desired delivery date is required for urgent requests.', 'error');
    return;
  }

  const urlInputs = itemsContainer.querySelectorAll('.item-url');
  const qtyInputs = itemsContainer.querySelectorAll('.item-qty');
  const items = [];

  for (let i = 0; i < urlInputs.length; i++) {
    const url = urlInputs[i].value.trim();
    const qty = parseInt(qtyInputs[i].value) || 1;
    if (!url) {
      showToast('All items must have an Amazon URL.', 'error');
      return;
    }
    items.push({ amazonUrl: url, quantity: qty });
  }

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clubName,
        personName,
        message,
        urgency,
        desiredDeliveryDate,
        items
      })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Failed to submit request.', 'error');
      return;
    }

    showToast('Request submitted successfully!', 'success');
    setTimeout(() => { window.location.href = '/'; }, 1200);
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  }
});

function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

loadClubs();
