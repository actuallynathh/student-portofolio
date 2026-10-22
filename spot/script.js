// SPOT - simulasi front-end (data disimpan di localStorage browser)
const K = { user: 'spot_user', ach: 'spot_ach', users: 'spot_users' };
const SKPI_RATES = { 'Internasional': 35, 'Nasional': 20, 'Provinsi': 15, 'Universitas': 10, 'Lainnya': 5 };

const SEED = {
  ach: [
    { id: 1, owner: 'demo', nama: 'Rina Putri', judul: 'Juara 1 Hackathon Nasional', kat: 'Lomba', tingkat: 'Nasional', poin: 20, catatan: 'Sertifikat terverifikasi, poin sesuai.', tgl: '2026-03-12', status: 'Disetujui' },
    { id: 2, owner: 'demo', nama: 'Rina Putri', judul: 'Sertifikat Cloud Practitioner', kat: 'Sertifikasi', tingkat: 'Internasional', poin: 35, catatan: '-', tgl: '2026-06-02', status: 'Menunggu' },
    { id: 3, owner: 'other', nama: 'Budi Santoso', judul: 'Publikasi Jurnal Sinta 3', kat: 'Publikasi', tingkat: 'Nasional', poin: 20, catatan: '-', tgl: '2026-08-20', status: 'Menunggu' },
    { id: 4, owner: 'other', nama: 'Sari Dewi', judul: 'Delegasi Pertukaran Pelajar', kat: 'Organisasi', tingkat: 'Internasional', poin: 35, catatan: 'Dokumen bukti tidak lengkap.', tgl: '2026-01-15', status: 'Ditolak' }
  ],
  users: [
    { nama: 'Rina Putri', id: '2021001', role: 'mahasiswa', email: 'rina@kampus.ac.id', prodi: 'Informatika' },
    { nama: 'Budi Santoso', id: '2021002', role: 'mahasiswa', email: 'budi@kampus.ac.id', prodi: 'Sistem Informasi' },
    { nama: 'Sari Dewi', id: '2021003', role: 'mahasiswa', email: 'sari@kampus.ac.id', prodi: 'Informatika' },
    { nama: 'Dr. Andi Wijaya', id: '198501', role: 'dosen', email: 'andi@kampus.ac.id' },
    { nama: 'Admin Akademik', id: '990011', role: 'staff', email: 'admin@kampus.ac.id' }
  ]
};

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = s => document.querySelector(s);
const showErr = m => { const e = $('#err'); if (e) { e.textContent = m; e.classList.remove('hidden'); } };

function toast(m) {
  const t = document.createElement('div');
  t.className = 'fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl transition-all';
  t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
}

// ---- Login & Register ----
const lf = $('#loginForm');
if (lf) lf.addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(lf));
  const found = load(K.users, SEED.users).find(u => u.email === f.email && u.role === f.role);
  save(K.user, { nama: found ? found.nama : f.email.split('@')[0], email: f.email, role: f.role });
  location.href = 'dashboard-' + f.role + '.html';
});

const rf = $('#registerForm');
if (rf) rf.addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(rf));
  if (f.password !== f.password2) return showErr('Kata sandi tidak sama. Periksa kembali.');
  const users = load(K.users, SEED.users);
  users.push({ nama: f.nama, id: f.id, role: f.role, email: f.email });
  save(K.users, users);
  location.href = 'login.html';
});

// ---- Dashboard UI & Logic ----
const role = document.body.dataset.role;
if (role) {
  const me = load(K.user, null);
  if (!me || me.role !== role) location.href = 'login.html';
  document.querySelectorAll('[data-me]').forEach(el => el.textContent = me ? me.nama : '');

  const sidebar = $('#sidebar');
  $('#menuBtn').onclick = () => sidebar.classList.toggle('-translate-x-full');
  
  function showTab(id) {
    document.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== id));
    document.querySelectorAll('[data-tab]').forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('bg-slate-800', on); b.classList.toggle('text-white', on);
      b.classList.toggle('text-slate-300', !on);
    });
    $('#title').textContent = document.querySelector('[data-tab="' + id + '"]').textContent.trim();
    if(window.innerWidth < 768) sidebar.classList.add('-translate-x-full');
  }
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  $('[data-logout]').onclick = () => { localStorage.removeItem(K.user); location.href = 'login.html'; };

  const badge = s => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
    s === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
    s === 'Menunggu' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
  }">${s}</span>`;
  
  const actBtn = (st, id, cls, label) => `<button data-act="${st}" data-id="${id}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 active:scale-95 ${cls}">${label}</button>`;

  function render() {
    const A = load(K.ach, SEED.ach), U = load(K.users, SEED.users);
    const mine = A.filter(a => a.owner === me.email || a.owner === 'demo');
    
    const rows = {
      // Mahasiswa melihat catatan, poin, tingkat
      mine: mine.map(a => [
        `<div class="font-medium text-slate-900">${esc(a.judul)}</div><div class="text-xs text-slate-500">${esc(a.kat)}</div>`,
        esc(a.tingkat),
        `<span class="font-bold text-blue-600">${a.poin}</span>`,
        `<div class="max-w-[200px] truncate text-xs text-slate-500" title="${esc(a.catatan || '-')}">${esc(a.catatan || '-')}</div>`,
        esc(a.tgl), 
        badge(a.status)
      ]),
      // Dosen bisa edit poin dan tambah catatan sebelum setujui/tolak
      review: A.filter(a => a.status === 'Menunggu').map(a => [
        `<div class="font-medium text-slate-900">${esc(a.nama)}</div><div class="text-xs text-slate-500">${esc(a.judul)} (${esc(a.tingkat)})</div>`,
        `<input type="number" id="poin_${a.id}" value="${a.poin}" class="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none">`,
        `<input type="text" id="catatan_${a.id}" placeholder="Tambahkan catatan (opsional)..." class="w-full min-w-[150px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none">`,
        esc(a.tgl),
        `<div class="flex gap-2">${actBtn('Disetujui', a.id, 'bg-emerald-500 hover:bg-emerald-600', 'Setujui')} ${actBtn('Ditolak', a.id, 'bg-rose-500 hover:bg-rose-600', 'Tolak')}</div>`
      ]),
      // Staff hanya melihat poin, TANPA catatan (privasi mahasiswa-dosen)
      ach: A.map(a => [
        esc(a.nama), 
        `<div class="font-medium text-slate-900">${esc(a.judul)}</div><div class="text-xs text-slate-500">${esc(a.tingkat)}</div>`,
        `<span class="font-bold text-indigo-600">${a.poin}</span>`,
        esc(a.tgl), 
        badge(a.status)
      ]),
      mhs: U.filter(u => u.role === 'mahasiswa').map(u => [esc(u.nama), esc(u.id), esc(u.prodi || '-'), esc(u.email)]),
      users: U.map(u => [esc(u.nama), esc(u.id), esc(u.role), esc(u.email)])
    };

    document.querySelectorAll('[data-render]').forEach(tb => {
      const r = rows[tb.dataset.render];
      tb.innerHTML = r.length ? r.map(c => `<tr class="transition-colors hover:bg-slate-50/50">${c.map(x => `<td class="whitespace-nowrap px-6 py-4">${x}</td>`).join('')}</tr>`).join('')
        : '<tr><td colspan="9" class="px-6 py-8 text-center text-sm text-slate-400">Belum ada data tersedia.</td></tr>';
    });

    const scope = role === 'mahasiswa' ? mine : A;
    const n = s => scope.filter(a => a.status === s).length;
    
    // Kalkulasi Total SKPI khusus mahasiswa
    const totalSKPI = role === 'mahasiswa' 
        ? mine.filter(a => a.status === 'Disetujui').reduce((sum, a) => sum + (parseInt(a.poin) || 0), 0) 
        : scope.length;

    const stat = { total: scope.length, skpi: totalSKPI, Menunggu: n('Menunggu'), Disetujui: n('Disetujui'), Ditolak: n('Ditolak') };
    document.querySelectorAll('[data-stat]').forEach(el => {
        if(stat[el.dataset.stat] !== undefined) el.textContent = stat[el.dataset.stat];
    });
  }

  // Handle Dosen Actions
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const A = load(K.ach, SEED.ach), a = A.find(x => x.id == b.dataset.id);
    
    if (role === 'dosen') {
      const pIn = document.getElementById('poin_' + a.id);
      const cIn = document.getElementById('catatan_' + a.id);
      if (pIn) a.poin = parseInt(pIn.value) || 0;
      if (cIn && cIn.value.trim() !== '') a.catatan = cIn.value.trim();
    }
    
    a.status = b.dataset.act; 
    save(K.ach, A); 
    render(); 
    toast('Pengajuan berhasil ' + a.status.toLowerCase());
  });

  // Upload Form
  const af = $('#achForm');
  if (af) af.addEventListener('submit', e => {
    e.preventDefault(); 
    const f = Object.fromEntries(new FormData(af));
    const A = load(K.ach, SEED.ach);
    const autoPoin = SKPI_RATES[f.tingkat] || 5; // Auto grading based on tingkat
    
    A.push({ 
        id: Date.now(), owner: me.email, nama: me.nama, 
        judul: f.judul, kat: f.kat, tingkat: f.tingkat, 
        poin: autoPoin, catatan: '-', tgl: f.tgl, status: 'Menunggu' 
    });
    
    save(K.ach, A); af.reset(); render(); 
    toast('Prestasi dikirim (Auto-grade SKPI: ' + autoPoin + ' poin)'); 
    showTab('history');
  });

  // User Form (Staff)
  const uf = $('#userForm');
  if (uf) uf.addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(uf));
    const U = load(K.users, SEED.users); U.push(f); save(K.users, U);
    uf.reset(); render(); toast('Pengguna baru ditambahkan'); showTab('users');
  });

  // Init
  // Update SKPI info text dynamically on upload select
  const tkSelect = $('select[name="tingkat"]');
  const skpiHint = $('#skpiHint');
  if(tkSelect && skpiHint) {
      tkSelect.addEventListener('change', (e) => {
          skpiHint.textContent = `Estimasi: +${SKPI_RATES[e.target.value] || 5} Poin SKPI`;
      });
  }

  render(); showTab('home');
}
