# VELA — Motor de carruseles

App para crear carruseles de Instagram (nicho trading/finanzas) a partir de un **objetivo**, un **estilo (tipo)**, tu **guión** y tus **fotos**. Editor tipo Canva por capas + exportación PNG/PDF/ZIP.

- **Frontend:** `index.html` (autocontenido; Tailwind/Lucide/Google Fonts + html2canvas/JSZip/jsPDF por CDN).
- **IA (opcional):** `supabase/functions/vela-ai` (Supabase Edge Function, guarda la llave del modelo; el navegador nunca la ve).
- **Objetivos:** Educar / Vender / Personal / Motivacional.
- **Tipos (2 familias):** Ángulos → Personal Orgánico · Orgánico Gráficos · Recurso · Hook IA. Marca Personal → Hook texto · Hook foto personal.

---

## 1) Subir a GitHub
```bash
cd vela
git init
git add .
git commit -m "VELA v1"
# crea el repo en github.com (vacío) y luego:
git remote add origin https://github.com/TU_USUARIO/vela.git
git branch -M main
git push -u origin main
```

## 2) Desplegar el frontend en Vercel
1. En **vercel.com** → *Add New… → Project* → importa el repo `vela`.
2. Framework preset: **Other** (es estático). Root: la carpeta con `index.html`.
3. **Deploy**. Te da una URL pública (ej. `https://vela.vercel.app`). Ese es el link para compartir.

*(No requiere build; Vercel sirve `index.html` directo.)*

## 3) Conectar la IA (Supabase Edge Function) — opcional pero recomendado
Necesitas una cuenta en **supabase.com** y tu **API key de Gemini** (aistudio.google.com, capa gratis).
```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase secrets set GEMINI_API_KEY=TU_LLAVE_GEMINI
supabase functions deploy vela-ai --no-verify-jwt
```
Esto te da una URL como `https://TU_PROJECT_REF.functions.supabase.co/vela-ai`.
En VELA (abierta en el navegador) haz clic en el pill **“IA: sin conectar”** del header y pega esa URL. Listo: “Pídeselo a VELA”, el caption y (a futuro) la división del guión usan la IA real. Sin URL, VELA funciona en modo demo.

> ⚠️ La API key vive SOLO en Supabase (secret). Nunca en el frontend ni en GitHub.

## 4) Banco de fotos (Google Drive) — fase siguiente
Hoy el banco se llena subiendo una carpeta en el Paso 1 (pruebas locales). Para leer directo de tu carpeta de Drive
(`https://drive.google.com/drive/folders/1mIM9aeEG7m7XdJThVu_Phxfrv6OwNiOV`) se añadirá una función que use la Google Drive API (OAuth) y devuelva las imágenes al banco.

---

## Contrato de la función `vela-ai`
`POST` JSON:
- `{ accion:"editor", mensaje, tipo, objetivo, slideTitulo, slideCuerpo }` → `{ reply, ops:[{t,v}] }`
- `{ accion:"caption", tipo, objetivo, titulos:[] }` → `{ caption }`
- `{ accion:"dividir", guion, tipo, objetivo }` → `{ bloques:[{title,body}] }`

## Estado
Ciclo completo funcionando: objetivo → estilo → guión real → fotos → editor por capas (mover/rotar/redimensionar, efectos, fondo, capas) → vista previa → export PNG/PDF/ZIP. Persistencia en localStorage. IA lista para conectar. Pendiente: Drive API, render headless para export de alta fidelidad, multi-selección/agrupar.
