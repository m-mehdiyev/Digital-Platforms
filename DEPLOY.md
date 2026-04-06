# 🚀 Rəqəmsal Platformalar — Deploy Təlimatı

## Addım 1: Supabase Qurulumu (10 dəq)

1. **https://supabase.com** → "Start your project" → Google ilə giriş
2. "New project" → Ad: `reqemsal-platformalar` → Region: Frankfurt → Create
3. Gözlə (1-2 dəq)
4. Sol menyu → **SQL Editor** → "New query"
5. `supabase_schema.sql` faylını açıb içindəkini kopyala → **Run**
6. Sol menyu → **Storage** → "New bucket"
   - Name: `platform-assets`
   - Public: ✅ (işarələ)
   - Create
7. Sol menyu → **Project Settings** → **API**
   - `Project URL` kopyala
   - `anon public` key kopyala

---

## Addım 2: .env faylı yarat

Layihə qovluğunda `.env` adlı fayl yarat:

```
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxx...
```

---

## Addım 3: İlk Super Admin Tokeni yarat

Supabase → SQL Editor → Run:

```sql
INSERT INTO admin_tokens (token, role, label)
VALUES ('menim-super-sifrəm-2026', 'super_admin', 'Super Admin');
```

Admin panelinə giriş linkin: `https://sənin-sayt.netlify.app/admin?token=menim-super-sifrəm-2026`

---

## Addım 4: Build et

```bash
# ZIP-i açdıqdan sonra:
cd reqemsal-app
npm install
npm run build
```

---

## Addım 5: Netlify Deploy

**Variant A — Drag & Drop (Ən asan):**
1. https://app.netlify.com → "Add new site" → "Deploy manually"
2. `dist/` qovluğunu drag & drop et
3. Hazır! 🎉

**Variant B — GitHub ilə (Tövsiyə):**
1. GitHub-da yeni repo yarat
2. Kodu push et
3. Netlify → "Import from Git" → repo seç
4. Build command: `npm run build`
5. Publish directory: `dist`
6. **Environment variables** əlavə et:
   - `VITE_SUPABASE_URL` = ...
   - `VITE_SUPABASE_ANON_KEY` = ...
7. Deploy!

---

## Addım 6: Platform Admin Linkləri yarat

Admin panelə gir → **Link İdarəetmə** → **Yeni Link**:
- Rol: Platform Admin
- Platforma: seç
- Yarat → Linki kopyala → əməkdaşa göndər

---

## İş Axını (Hər ay)

```
1. Platformlar məlumat doldurur  →  öz linklərindən admin panelə girir
2. Super Admin yoxlayır         →  Dashboard-da vəziyyəti görür
3. Super Admin yayımlayır       →  "Hesabat Yayımla" → Yayımla
4. İctimai səhifə yenilənir     →  reqemsal-platformalar.netlify.app
```

---

## Qovluq Strukturu

```
reqemsal-app/
├── src/
│   ├── components/
│   │   └── admin/
│   │       ├── AdminLayout.jsx     # Sidebar + routing
│   │       ├── Dashboard.jsx       # Ümumi vəziyyət
│   │       ├── Platforms.jsx       # Platforma idarəsi
│   │       ├── ReportInput.jsx     # Məlumat daxiletmə
│   │       ├── PublishReport.jsx   # Yayımlama
│   │       ├── ArchivePage.jsx     # Arxiv
│   │       └── TokenManager.jsx    # Link idarəsi
│   ├── pages/
│   │   ├── AdminGate.jsx          # Token yoxlama qapısı
│   │   └── PublicReport.jsx       # İctimai hesabat
│   ├── hooks/
│   │   └── useAuth.js             # Token auth hook
│   ├── lib/
│   │   └── supabase.js            # Supabase client
│   └── styles/
│       └── global.css             # Qlobal stillər
├── supabase_schema.sql            # DB strukturu
├── netlify.toml                   # Netlify konfiq
└── .env.example                   # Env nümunəsi
```
