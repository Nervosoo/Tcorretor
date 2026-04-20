# Design da Extensao de Correcao pt-BR

## Objetivo

Criar uma extensao Chrome inspirada na experiencia do LanguageTool para uso proprio ou de equipe pequena, sem pagar por API de correcao. O produto deve usar um backend proprio com LanguageTool open source rodando em infraestrutura controlada pelo projeto.

## Escopo do MVP

- Extensao Chrome MV3
- Correcao de texto apenas em pt-BR
- Suporte inicial a `textarea`, `input` de texto e `contenteditable` comuns
- Popup com estado da extensao no site atual
- Pagina de opcoes com URL da API, API key, idioma e sites desativados
- Backend proprio com endpoint HTTP simples para a extensao
- LanguageTool open source rodando em Docker

## Fora do escopo do MVP

- Google Docs
- Gmail e editores complexos
- Reescrita por IA
- Conta de usuario, cobranca ou painel web
- Multi-idioma

## Arquitetura

### Extensao

- `content script` detecta campos editaveis e observa alteracoes
- `background service worker` centraliza chamadas para a API privada
- `popup` mostra estado no dominio atual e permite desligar por site
- `options` salva configuracoes locais via `chrome.storage.local`

### Backend

- API HTTP propria exposta em `POST /api/check`
- Middleware com autenticacao por `Bearer token`
- Cliente interno que chama `POST /v2/check` do LanguageTool self-hosted
- Normalizacao da resposta para um formato estavel para a extensao

## Fluxo principal

1. Usuario foca um campo suportado.
2. O `content script` cria uma sessao local para o campo.
3. Alteracoes de texto passam por debounce.
4. O `background` envia texto para a API privada.
5. O backend consulta o LanguageTool e devolve matches normalizados.
6. A extensao exibe um indicador visual e cards de sugestao.
7. Ao aplicar uma sugestao, a extensao substitui o trecho e dispara nova validacao.

## Decisoes importantes

- Usar TypeScript em toda a stack
- Usar React apenas em `popup` e `options`
- Rodar LanguageTool em Docker no servidor proprio
- Limitar checagem inicial a 4000 caracteres por requisicao
- Aplicar debounce inicial de 600 ms

## Riscos

- `contenteditable` e mais fragil que `textarea` e `input`
- Alguns sites manipulam DOM de forma agressiva e podem exigir exclusao por dominio
- A extensao precisa continuar usavel quando a API estiver fora do ar

## Testes previstos

- Testes unitarios para validacao do backend e utilitarios principais
- Testes da rota `POST /api/check`
- Build da extensao e da API como verificacao minima do MVP
