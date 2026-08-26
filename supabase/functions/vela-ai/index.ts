// VELA · Edge Function "vela-ai" (Supabase / Deno)
// Cerebro de IA de VELA. Guarda aquí la llave; el navegador NUNCA la ve.
// Despliegue:  supabase functions deploy vela-ai --no-verify-jwt
// Secret:      supabase secrets set GEMINI_API_KEY=xxxxx
// La URL pública resultante se pega en VELA (botón "IA" del header).
//
// Contrato (POST JSON):
//   { accion:"editor",  mensaje, tipo, objetivo, slideTitulo, slideCuerpo } -> { reply, ops:[{t:"title"|"body"|"accent"|"mayus"|"arrow", v?}] }
//   { accion:"caption", tipo, objetivo, titulos:[...] }                     -> { caption }
//   { accion:"dividir", guion, tipo, objetivo }                            -> { bloques:[{title,body}] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MODEL = "gemini-1.5-flash";

async function gemini(prompt: string) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Falta GEMINI_API_KEY (supabase secrets set GEMINI_API_KEY=...)");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  });
  const j = await r.json();
  const txt = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try { return JSON.parse(txt); } catch { return { _raw: txt }; }
}

const REGLAS =
  "Eres VELA, asistente de carruseles de Instagram para un nicho de TRADING/finanzas en español (LatAm). " +
  "Tono cercano y directo. NUNCA inventes cifras ni promesas de rentabilidad. Español siempre. Responde SOLO en JSON válido.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const { accion } = body;
    let out: unknown = {};

    if (accion === "editor") {
      const p = `${REGLAS}
El usuario edita un slide (tipo ${body.tipo}, objetivo ${body.objetivo}).
Título actual: "${body.slideTitulo}"
Cuerpo actual: "${body.slideCuerpo}"
Instrucción del usuario: "${body.mensaje}"
Devuelve JSON: { "reply": "confirmación breve", "ops": [ {"t":"title","v":"..."} | {"t":"body","v":"..."} | {"t":"accent","v":"#hex"} | {"t":"mayus"} | {"t":"arrow"} ] }
Incluye en ops SOLO los cambios que pida la instrucción.`;
      out = await gemini(p);
    } else if (accion === "caption") {
      const p = `${REGLAS}
Escribe el caption de Instagram para un carrusel (tipo ${body.tipo}, objetivo ${body.objetivo}).
Títulos de los slides: ${JSON.stringify(body.titulos || [])}.
Incluye gancho + 1-2 líneas de valor + un CTA acorde al objetivo + 5 hashtags del nicho.
Devuelve JSON: { "caption": "texto completo con saltos de línea \\n" }`;
      out = await gemini(p);
    } else if (accion === "dividir") {
      const p = `${REGLAS}
Divide este guión en slides para un carrusel (tipo ${body.tipo}, objetivo ${body.objetivo}).
El primer bloque es el HOOK/portada y el último es el CTA. 1 idea por bloque, texto breve.
Guión: """${body.guion}"""
Devuelve JSON: { "bloques": [ {"title":"...","body":"..."} ] }`;
      out = await gemini(p);
    } else {
      out = { error: "accion no reconocida" };
    }

    return new Response(JSON.stringify(out), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
