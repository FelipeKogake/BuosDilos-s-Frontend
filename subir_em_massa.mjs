import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  'https://aicybssjnwtbyaequbee.supabase.co',
  'sb_publishable_uyPVsR2YGr6RpY2wz27Ixg_en3bQ8HD' // anon key (ou service_role key se for só backend, nunca expor no front)
)

const BUCKET = 'produtos'
const PASTA = './imagens' // pasta local com as imagens

async function uploadEmMassa() {
  const arquivos = fs.readdirSync(PASTA)

  for (const nomeArquivo of arquivos) {
    const caminho = path.join(PASTA, nomeArquivo)
    const file = fs.readFileSync(caminho)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(nomeArquivo, file, { upsert: true })

    if (error) {
      console.error(`Erro em ${nomeArquivo}:`, error.message)
    } else {
      console.log(`OK: ${nomeArquivo}`)
    }
  }

  console.log('Upload em massa concluído!')
}

uploadEmMassa()