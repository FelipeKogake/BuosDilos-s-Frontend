import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://aicybssjnwtbyaequbee.supabase.co',
  'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD' // anon key (ou service_role key se for só backend, nunca expor no front)
)

const BUCKET = 'produtos'

async function testar() {
  // 1. Upload
  const file = fs.readFileSync('./teste.jpg')
  const { data: up, error: errUp } = await supabase.storage
    .from(BUCKET)
    .upload('teste.jpg', file, { contentType: 'image/jpeg' })
  console.log('Upload:', up, errUp)

  // 2. URL pública
  const { data: url } = supabase.storage.from(BUCKET).getPublicUrl('teste.jpg')
  console.log('URL:', url.publicUrl)

  // 3. Update (substitui o arquivo)
  const novoFile = fs.readFileSync('./teste-novo.jpg')
  const { error: errUpdate } = await supabase.storage
    .from(BUCKET)
    .update('teste.jpg', novoFile, { contentType: 'image/jpeg' })
  console.log('Update erro?', errUpdate)

  4. Delete
  const { error: errDel } = await supabase.storage.from(BUCKET).remove(['teste.jpg'])
  console.log('Delete erro?', errDel)
}

testar()