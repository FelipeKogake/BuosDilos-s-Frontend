// api/cep.js
// ─────────────────────────────────────────────────────────────────────────────
// Integração com o ViaCEP — API pública dos Correios para consulta de endereço
// a partir do CEP. Usada no checkout para preencher rua, bairro, cidade e UF
// sem o usuário digitar.
//
// Documentação: https://viacep.com.br/
// ─────────────────────────────────────────────────────────────────────────────

const VIACEP_URL = 'https://viacep.com.br/ws';

/** Remove tudo que não for dígito. */
export function limparCep(cep) {
    return String(cep ?? '').replace(/\D/g, '');
}

/** Formata 8 dígitos como 00000-000. */
export function formatarCep(cep) {
    const limpo = limparCep(cep);
    return limpo.length === 8 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo;
}

/**
 * Consulta um CEP no ViaCEP.
 *
 * O ViaCEP responde 200 com { erro: true } quando o CEP tem formato válido mas
 * não existe — por isso a checagem do corpo além do status.
 *
 * @returns {Promise<{cep, logradouro, bairro, cidade, estado}>}
 */
export async function buscarEnderecoPorCep(cep) {
    const limpo = limparCep(cep);

    if (limpo.length !== 8) {
        throw new Error('O CEP precisa ter 8 dígitos.');
    }

    let resposta;
    try {
        resposta = await fetch(`${VIACEP_URL}/${limpo}/json/`);
    } catch {
        throw new Error('Não foi possível consultar o CEP. Verifique sua conexão.');
    }

    if (!resposta.ok) {
        throw new Error('O serviço de CEP está indisponível no momento.');
    }

    const dados = await resposta.json();

    if (dados.erro) {
        throw new Error('CEP não encontrado.');
    }

    return {
        cep:        formatarCep(dados.cep),
        logradouro: dados.logradouro || '',
        bairro:     dados.bairro     || '',
        cidade:     dados.localidade || '',
        estado:     dados.uf         || '',
    };
}
