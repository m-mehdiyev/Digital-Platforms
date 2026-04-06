/* ── RESET ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body { font-family: Arial, Helvetica, sans-serif; background: #f0f4ff; color: #1a1f36; overflow-x: hidden; line-height: 1.6; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #f0f4ff; }
::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 2px; }

/* ── GLASS CARD ── */
.glass-card {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1.5px solid rgba(255,255,255,0.9);
  border-radius: 20px;
  box-shadow: 0 4px 32px rgba(60,60,120,0.09), inset 0 1px 0 rgba(255,255,255,.55);
  position: relative;
  overflow: hidden;
}
.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.16) 0%, transparent 60%);
  pointer-events: none;
  border-radius: inherit;
}

/* ── ORBS ── */
.orbs { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .2; animation: orbDrift 14s ease-in-out infinite alternate; }
.o1 { width: 700px; height: 700px; background: radial-gradient(circle, #6366f1, transparent 70%); top: -200px; right: -150px; }
.o2 { width: 550px; height: 550px; background: radial-gradient(circle, #8b5cf6, transparent 70%); bottom: -150px; left: -100px; animation-delay: -5s; }
.o3 { width: 380px; height: 380px; background: radial-gradient(circle, #06b6d4, transparent 70%); top: 45%; left: 40%; animation-delay: -9s; opacity: .1; }
@keyframes orbDrift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(35px,50px) scale(1.1); } }

/* ── ADMIN LAYOUT ── */
.admin-layout { display: flex; min-height: 100vh; position: relative; z-index: 2; }

.admin-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(24px) saturate(200%);
  border-right: 1px solid rgba(99,102,241,0.1);
  box-shadow: 2px 0 20px rgba(60,60,120,0.07);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.admin-logo {
  padding: 0 20px 24px;
  border-bottom: 1px solid rgba(99,102,241,0.08);
  margin-bottom: 16px;
}
.admin-logo img { height: 32px; object-fit: contain; }
.admin-logo .logo-sub { font-size: 11px; color: #6b7280; margin-top: 6px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }

.admin-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 2px; }
.admin-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  font-size: 13px; font-weight: 600; color: #6b7280;
  cursor: pointer; transition: all .2s; text-decoration: none;
  border: none; background: none; width: 100%; text-align: left;
}
.admin-nav-item:hover { background: rgba(99,102,241,0.08); color: #6366f1; }
.admin-nav-item.active { background: rgba(99,102,241,0.12); color: #6366f1; }
.admin-nav-item svg { flex-shrink: 0; }

.admin-nav-section { font-size: 10px; font-weight: 700; color: #d1d5db; letter-spacing: .12em; text-transform: uppercase; padding: 16px 12px 4px; }

.admin-role-badge {
  margin: 16px 12px 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}
.admin-role-badge.super { background: rgba(99,102,241,0.1); color: #6366f1; }
.admin-role-badge.platform { background: rgba(16,185,129,0.1); color: #059669; }

.admin-main { flex: 1; padding: 32px; min-width: 0; }

.admin-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 28px;
}
.admin-page-title { font-size: 22px; font-weight: 700; color: #0f172a; }
.admin-page-sub { font-size: 13px; color: #6b7280; margin-top: 2px; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  border: none; transition: all .2s; font-family: Arial, sans-serif;
}
.btn-primary { background: #6366f1; color: #fff; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,.3); }
.btn-secondary { background: rgba(99,102,241,0.08); color: #6366f1; border: 1.5px solid rgba(99,102,241,.2); }
.btn-secondary:hover { background: rgba(99,102,241,0.14); }
.btn-danger { background: rgba(239,68,68,0.08); color: #dc2626; border: 1.5px solid rgba(239,68,68,.2); }
.btn-danger:hover { background: rgba(239,68,68,0.14); }
.btn-success { background: #059669; color: #fff; }
.btn-success:hover { background: #047857; }
.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }

/* ── FORM ELEMENTS ── */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-label { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: .04em; text-transform: uppercase; }
.form-input, .form-select, .form-textarea {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-family: Arial, sans-serif;
  color: #1a1f36;
  background: rgba(255,255,255,0.8);
  transition: border-color .2s, box-shadow .2s;
  outline: none;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.form-textarea { resize: vertical; min-height: 80px; }

/* ── CARDS ── */
.card {
  background: rgba(255,255,255,0.8);
  border: 1.5px solid rgba(255,255,255,0.9);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 2px 20px rgba(60,60,120,0.07);
}
.card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

/* ── STATUS BADGES ── */
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
.badge-green { background: rgba(16,185,129,0.1); color: #059669; }
.badge-yellow { background: rgba(245,158,11,0.1); color: #d97706; }
.badge-red { background: rgba(239,68,68,0.1); color: #dc2626; }
.badge-blue { background: rgba(99,102,241,0.1); color: #6366f1; }
.badge-gray { background: rgba(0,0,0,0.06); color: #6b7280; }

/* ── TABLE ── */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: .08em; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1.5px solid #f1f3f9; }
.data-table td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f8f9ff; }
.data-table tr:hover td { background: rgba(99,102,241,0.03); }

/* ── LOADING ── */
.spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,.2); border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 16px; }
.loading-screen p { font-size: 13px; color: #6b7280; }

/* ── DROPZONE ── */
.dropzone {
  border: 2px dashed #c4b5fd;
  border-radius: 14px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  background: rgba(99,102,241,0.03);
}
.dropzone:hover, .dropzone.active { border-color: #6366f1; background: rgba(99,102,241,0.06); }
.dropzone p { font-size: 13px; color: #6b7280; margin-top: 8px; }

/* ── LIST ITEMS ── */
.list-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.06); margin-bottom: 6px; }
.list-item-text { flex: 1; font-size: 13px; color: #374151; }
.list-item-actions { display: flex; gap: 4px; }

/* ── KPI BLOCK ── */
.kpi-input-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: end; margin-bottom: 8px; }

/* ── STAT OVERVIEW ── */
.stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px; }
.stat-box { padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.8); border: 1.5px solid rgba(255,255,255,0.9); box-shadow: 0 2px 16px rgba(60,60,120,0.07); }
.stat-box-num { font-size: 32px; font-weight: 700; color: #6366f1; line-height: 1; margin-bottom: 4px; }
.stat-box-label { font-size: 11px; color: #6b7280; }

/* ── PLATFORM GRID ── */
.platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
.platform-card-admin {
  padding: 20px; border-radius: 18px;
  background: rgba(255,255,255,0.8);
  border: 1.5px solid rgba(255,255,255,0.9);
  box-shadow: 0 2px 16px rgba(60,60,120,0.07);
  transition: all .25s;
}
.platform-card-admin:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(60,60,120,0.12); }
.platform-card-logo { height: 36px; margin-bottom: 12px; display: flex; align-items: center; }
.platform-card-logo img { max-height: 36px; max-width: 140px; object-fit: contain; object-position: left; }
.platform-card-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.platform-card-tag { font-size: 11px; color: #6b7280; margin-bottom: 12px; }
.platform-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.06); }

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,15,26,0.5); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal { background: #fff; border-radius: 24px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.2); }
.modal-header { padding: 24px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f3f9; }
.modal-title { font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { width: 32px; height: 32px; border-radius: 50%; background: #f4f6fb; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #6b7280; transition: all .2s; }
.modal-close:hover { background: #e8eaf6; color: #1a1f36; }
.modal-body { padding: 24px 28px; }
.modal-footer { padding: 16px 28px 24px; display: flex; gap: 10px; justify-content: flex-end; }

/* ── TOKEN CARD ── */
.token-card { padding: 16px; border-radius: 14px; border: 1.5px solid rgba(99,102,241,.15); background: rgba(99,102,241,0.04); margin-bottom: 10px; }
.token-url { font-size: 12px; font-family: monospace; color: #374151; background: rgba(0,0,0,0.04); padding: 8px 12px; border-radius: 8px; word-break: break-all; margin-top: 8px; }
.token-copy { cursor: pointer; color: #6366f1; font-size: 11px; font-weight: 700; margin-top: 6px; display: inline-block; }

/* ── TOASTS ── */
.toast-success { background: #059669 !important; }
.toast-error { background: #dc2626 !important; }

/* ── ACCESS DENIED ── */
.access-denied { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; text-align: center; padding: 40px; }
.access-denied h1 { font-size: 28px; font-weight: 700; color: #0f172a; }
.access-denied p { font-size: 15px; color: #6b7280; max-width: 400px; }
