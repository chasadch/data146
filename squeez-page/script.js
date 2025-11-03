// ---------- CONFIG: replace these ----------
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
// -------------------------------------------

const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('signupForm');
const statusEl = document.getElementById('status');
const listWrap = document.getElementById('listWrap');
const submitBtn = document.getElementById('submitBtn');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff6b6b' : '#a7f3d0';
}

async function fetchAndRender() {
  setStatus('Loading list...');
  try {
    // fetch latest 100 rows
    const { data, error } = await supabase
      .from('early_access_signups')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    renderTable(data || []);
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus('Failed to load list', true);
  }
}

function renderTable(rows) {
  if (!rows.length) {
    listWrap.innerHTML = '<div class="muted">No signups yet.</div>';
    return;
  }

  let html = `<table><thead><tr><th>Name</th><th>Email</th><th class="muted">Signed up</th></tr></thead><tbody>`;
  rows.forEach(r => {
    const t = new Date(r.created_at).toLocaleString();
    // If you don't want to show full email publicly, mask it: r.email.replace(/(.{2})(.*)(@.*)/, (m,a,b,c)=> a+'***'+c)
    html += `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email)}</td><td class="muted">${t}</td></tr>`;
  });
  html += `</tbody></table>`;
  listWrap.innerHTML = html;
}

// Simple HTML escape
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!name || !email) {
    setStatus('Name and email are required', true);
    submitBtn.disabled = false;
    return;
  }

  setStatus('Submitting...');

  try {
    const { data, error } = await supabase
      .from('early_access_signups')
      .insert([{ name, email }]);

    if (error) throw error;

    setStatus('Thanks — you are on the list!');
    form.reset();
    // optionally re-fetch the list:
    await fetchAndRender();

  } catch (err) {
    console.error(err);
    setStatus('Submission failed', true);
  } finally {
    submitBtn.disabled = false;
  }
});

// Realtime: update the list as new rows arrive
function subscribeRealtime() {
  // Supabase Realtime via channel API
  supabase.channel('public:early_access_signups')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'early_access_signups' }, payload => {
      // Prepend the new record locally
      // For simplicity, re-fetch the list. That's simpler and reliable.
      fetchAndRender();
    })
    .subscribe();
}

// initial load
fetchAndRender();
subscribeRealtime();
