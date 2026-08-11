// Script clássico (não-module, sem defer/async) para ser incluído no <head>,
// antes de qualquer <link rel="stylesheet">. Aplica as variáveis de cor do
// tema salvo direto no elemento raiz ANTES da primeira pintura da página,
// evitando o "flash" do tema errado enquanto o restante do JS ainda carrega.
// Estilo definido via .style tem prioridade sobre qualquer regra de stylesheet,
// então isso vale mesmo que o <link> do CSS carregue depois.
//
// Uso: <script src="../api/temaPreload.js" data-paleta="app"></script>
// data-paleta: "app" (Tela_Inicia_Com_Login / Tela_Inicia_Sem_Login, padrão)
//              ou "login" (Login_Cadatro, paleta um pouco diferente)
(function () {
    var PALETAS = {
        app: {
            azul: {
                '--cor-fundo': '#DCEAF7', '--cor-painel': '#ffffff', '--cor-primaria': '#cccaf1',
                '--cor-primaria-hover': '#b4b1ef', '--cor-label': '#3d6987', '--cor-input-fundo': '#f0f0f0',
                '--cor-input-texto': '#6d6d6d', '--cor-texto-titulo': '#111', '--cor-texto-secundario': '#555',
                '--cor-texto-terciario': '#646464', '--cor-borda': '#ccc', '--cor-divisor': '#e0e0e0',
                '--sombra-painel': '6px 6px 20px rgba(0, 9, 169, 0.4)', '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.4)',
                '--cor-sombra-inicio': '#BFD7EE', '--cor-sombra-fim': '#DCEAF7',
                '--cor-top-bar': '#a0b8d4', '--cor-cta-dark': '#C2D4F0', '--cor-cta-dark-border': '#A5B8E0',
                '--cor-cta-light': '#88a8f1', '--cor-cta-light-border': '#A5B8E0',
            },
            rosa: {
                '--cor-fundo': '#F9EBEB', '--cor-painel': '#ffffff', '--cor-primaria': '#F1CECE',
                '--cor-primaria-hover': '#e3b8b8', '--cor-label': '#c8252a', '--cor-input-fundo': '#f0f0f0',
                '--cor-input-texto': '#6d6d6d', '--cor-texto-titulo': '#111', '--cor-texto-secundario': '#757575',
                '--cor-texto-terciario': '#646464', '--cor-borda': '#cbc3c3', '--cor-divisor': '#cbc3c3',
                '--sombra-painel': '6px 6px 20px rgba(243, 162, 162, 0.6)', '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.6)',
                '--cor-sombra-inicio': '#F1CECE', '--cor-sombra-fim': '#F9EBEB',
                '--cor-top-bar': '#d4a0a0', '--cor-cta-dark': '#FFC2C2', '--cor-cta-dark-border': '#FFA5A5',
                '--cor-cta-light': '#f18888', '--cor-cta-light-border': '#FFA5A5',
            },
        },
        login: {
            azul: {
                '--cor-fundo': '#DCEAF7', '--cor-painel': '#ffffff', '--cor-primaria': '#b0aed4',
                '--cor-primaria-hover': '#7b78b0', '--cor-label': '#3d6987', '--cor-input-fundo': '#f0f0f0',
                '--cor-input-texto': '#6d6d6d', '--cor-texto-titulo': '#111', '--cor-texto-secundario': '#555',
                '--cor-texto-terciario': '#646464', '--cor-borda': '#ccc', '--cor-divisor': '#e0e0e0',
                '--sombra-painel': '6px 6px 20px rgba(0, 9, 169, 0.4)', '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.4)',
                '--cor-sombra-inicio': '#BFD7EE', '--cor-sombra-fim': '#DCEAF7',
            },
            rosa: {
                '--cor-fundo': '#F9EBEB', '--cor-painel': '#ffffff', '--cor-primaria': '#F1CECE',
                '--cor-primaria-hover': '#d4b6b6', '--cor-label': '#c8252a', '--cor-input-fundo': '#f0f0f0',
                '--cor-input-texto': '#6d6d6d', '--cor-texto-titulo': '#111', '--cor-texto-secundario': '#757575',
                '--cor-texto-terciario': '#646464', '--cor-borda': '#444', '--cor-divisor': '#333',
                '--sombra-painel': '6px 6px 20px rgba(243, 162, 162, 0.6)', '--sombra-input': '0 2px 8px rgba(0, 0, 0, 0.6)',
                '--cor-sombra-inicio': '#F1CECE', '--cor-sombra-fim': '#F9EBEB',
            },
        },
    };

    var grupo  = (document.currentScript && document.currentScript.dataset.paleta) || 'app';
    var paleta = PALETAS[grupo] || PALETAS.app;

    function aplicar(nomeTema) {
        var cores = paleta[nomeTema] || paleta.azul;
        var root  = document.documentElement.style;

        for (var propriedade in cores) {
            root.setProperty(propriedade, cores[propriedade]);
        }

        localStorage.setItem('tema', nomeTema);
        return nomeTema;
    }

    aplicar(localStorage.getItem('tema') || 'azul');

    // Exposto para as telas alternarem o tema sem redeclarar a paleta inteira.
    // As páginas antigas ainda têm a própria cópia do objeto de temas; migrá-las
    // para esta API é tarefa do Bloco 2.
    window.TemaPopDreams = {
        aplicar: aplicar,
        temaAtual: function () {
            return localStorage.getItem('tema') || 'azul';
        },
        alternar: function () {
            var atual = localStorage.getItem('tema') || 'azul';
            return aplicar(atual === 'azul' ? 'rosa' : 'azul');
        },
    };
})();
