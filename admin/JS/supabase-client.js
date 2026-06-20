// JS/supabase-client.js
// Cliente Supabase centralizado — importado pelos outros módulos do admin

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ Trocar pelos valores reais do seu projeto Supabase
const SUPABASE_URL = 'https://aicybssjnwtbyaequbee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const TABELA_PRODUTOS = 'produtos';
export const BUCKET_PRODUTOS = 'produtos';
