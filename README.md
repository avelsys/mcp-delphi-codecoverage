# mcp-delphi-codecoverage

Servidor MCP (Model Context Protocol) com um guia prático + snippets de
código prontos para configurar projetos Delphi, testes DUnitX e scripts de
CI de forma que funcionem corretamente com a
[DelphiCodeCoverage](https://github.com/DelphiCodeCoverage/DelphiCodeCoverage) —
indexado e pesquisável por ferramentas como Claude Code, Claude Desktop ou
qualquer outro cliente MCP.

O guia foi escrito a partir da documentação e do código-fonte públicos do
projeto `DelphiCodeCoverage/DelphiCodeCoverage` (README oficial, scripts
`.bat` de exemplo) — cobre configuração de `.dproj`/Map file, estrutura de
projeto runner DUnitX, uso da CLI `CodeCoverage.exe`, integração em CI e o
padrão de separação Form/lógica (MVP) que torna Forms de fato cobríveis.

> **Sobre licenciamento**: a DelphiCodeCoverage (a ferramenta em si) é
> licenciada em Mozilla Public License 2.0. O DUnitX é licenciado em Apache
> License 2.0. O conteúdo deste repositório (guia e snippets) é uma obra
> **original**, escrita pelo autor deste pacote a partir da documentação
> pública desses projetos — veja [LICENSE](./LICENSE) para detalhes.

## O que este servidor oferece

| Ferramenta | Para que serve |
|---|---|
| `list_topics` | Lista os tópicos do guia |
| `get_topic` | Retorna o texto completo de um tópico |
| `search_guide` | Busca um termo em todos os tópicos, com trechos de contexto |
| `get_snippet` | Retorna um snippet pronto de uma categoria |
| `list_snippets` | Lista todos os snippets disponíveis, por categoria |
| `search_snippets` | Busca snippets por palavra-chave (nome ou código) |

### Tópicos disponíveis

`project-setup` (Map file/.dproj), `dunitx-runner` (projeto console runner),
`cli-usage` (parâmetros da `CodeCoverage.exe`), `ci-integration` (pipeline
build → testes → cobertura), `form-mvp-pattern` (como manter Forms
cobríveis via separação MVP).

### Categorias de snippets disponíveis

`unit_skeleton`, `dunitx_test_fixture`, `dunitx_console_dpr`,
`dproj_coverage_settings`, `cli_invocation`, `ci_script_windows`.

## Instalação

### Opção 1 — via `npx` (recomendado, sem instalar nada globalmente)

```bash
claude mcp add delphi-codecoverage -- npx -y mcp-delphi-codecoverage
```

### Opção 2 — instalar global via npm

```bash
npm install -g mcp-delphi-codecoverage
claude mcp add delphi-codecoverage -- mcp-delphi-codecoverage
```

### Opção 3 — a partir do código-fonte

```bash
git clone https://github.com/avelsys/mcp-delphi-codecoverage.git
cd mcp-delphi-codecoverage
npm install
npm run build
claude mcp add delphi-codecoverage -- node "$(pwd)/build/index.js"
```

Depois de registrado, o servidor fica disponível em qualquer projeto (escopo
`user`) ou só no projeto atual (`--scope local`, se preferir isolar).

### Configuração manual (`claude_desktop_config.json` ou `.mcp.json`)

```json
{
  "mcpServers": {
    "delphi-codecoverage": {
      "command": "npx",
      "args": ["-y", "mcp-delphi-codecoverage"]
    }
  }
}
```

## Desenvolvimento

```bash
npm install
npm run watch   # tsc --watch
```

Conteúdo do guia e dos snippets vive direto em `src/topics.ts` e
`src/snippets.ts` (TypeScript puro, sem etapa de ingest/build de dados) —
para atualizar, edite esses arquivos e rode `npm run build`.

O servidor usa stdio (`StdioServerTransport`) — para testar localmente sem um
cliente MCP completo, use o [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Contribuindo

Issues e PRs são bem-vindos — principalmente correções de conteúdo (algum
parâmetro de CLI desatualizado em relação a uma versão nova da
DelphiCodeCoverage) ou novos snippets. Abra uma issue descrevendo o que
mudou antes de um PR grande.

## Licença

MIT — veja [LICENSE](./LICENSE).
