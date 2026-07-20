import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// JS/produtos.js
// ─────────────────────────────────────────────────────────────────────────────
// Integração de produtos com backend REST + Supabase Storage para imagens.
// Fotos gerenciadas via endpoint próprio /api/produtos/{id}/fotos
// ─────────────────────────────────────────────────────────────────────────────

// const BASE_URL          = 'https://ecommerce-api-p2jw.onrender.com/api';
const BASE_URL          = 'http://localhost:2102/api';
const SUPABASE_URL      = 'https://aicybssjnwtbyaequbee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD';
const BUCKET            = 'produtos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

