#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { topics } from "./topics.js";
import { snippets } from "./snippets.js";
import type { Topic, SnippetCategory } from "./types.js";

function getTopic(id: string): Topic | undefined {
  return topics.find((t) => t.id.toLowerCase() === id.toLowerCase());
}

function trecho(texto: string, termo: string, ctx = 120): string {
  const idx = texto.toLowerCase().indexOf(termo.toLowerCase());
  if (idx === -1) return "";
  const start = Math.max(0, idx - ctx);
  const end = Math.min(texto.length, idx + termo.length + ctx);
  const prefixo = start > 0 ? "..." : "";
  const sufixo = end < texto.length ? "..." : "";
  return prefixo + texto.slice(start, end).replace(/\s+/g, " ").trim() + sufixo;
}

function contarOcorrencias(texto: string, termo: string): number {
  if (!termo) return 0;
  return texto.toLowerCase().split(termo.toLowerCase()).length - 1;
}

const server = new Server(
  { name: "delphi-codecoverage", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_topics",
      description:
        "Lista os topicos do guia de configuracao de projetos Delphi/DUnitX para uso com a DelphiCodeCoverage",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_topic",
      description: "Retorna o texto completo de um topico do guia",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Id do topico, ex.: project-setup, dunitx-runner, cli-usage, ci-integration, form-mvp-pattern",
          },
        },
        required: ["id"],
      },
    },
    {
      name: "search_guide",
      description: "Busca um termo em todos os topicos do guia, retornando trechos de contexto",
      inputSchema: {
        type: "object",
        properties: {
          termo: { type: "string", description: "Termo de busca" },
        },
        required: ["termo"],
      },
    },
    {
      name: "get_snippet",
      description:
        "Retorna um snippet de codigo Delphi/DUnitX/CLI pronto para uso, de uma categoria especifica",
      inputSchema: {
        type: "object",
        properties: {
          categoria: {
            type: "string",
            description: "Categoria do snippet",
            enum: Object.keys(snippets),
          },
          nome: { type: "string", description: "Nome do snippet dentro da categoria" },
        },
        required: ["categoria", "nome"],
      },
    },
    {
      name: "list_snippets",
      description: "Lista todos os snippets disponiveis, por categoria",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "search_snippets",
      description: "Busca snippets por palavra-chave (nome ou conteudo do codigo)",
      inputSchema: {
        type: "object",
        properties: {
          termo: { type: "string", description: "Termo de busca" },
        },
        required: ["termo"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name } = request.params;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    if (name === "list_topics") {
      const ordenados = [...topics].sort((a, b) => a.order - b.order);
      let texto = "Topicos do guia DelphiCodeCoverage:\n\n";
      for (const t of ordenados) {
        texto += `${t.order}. [${t.id}] ${t.title}\n`;
      }
      return { content: [{ type: "text", text: texto }] };
    }

    if (name === "get_topic") {
      const id = args.id as string;
      const t = getTopic(id);
      if (!t) {
        const disponiveis = topics.map((x) => x.id).join(", ");
        return {
          content: [
            { type: "text", text: `Topico nao encontrado: ${id}\n\nDisponiveis: ${disponiveis}` },
          ],
        };
      }
      return { content: [{ type: "text", text: `${t.title}\n\n${t.text}` }] };
    }

    if (name === "search_guide") {
      const termo = args.termo as string;
      const resultados: Array<{ id: string; titulo: string; ocorrencias: number; trecho: string }> = [];

      for (const t of topics) {
        const ocorrencias = contarOcorrencias(t.text, termo);
        if (ocorrencias > 0) {
          resultados.push({
            id: t.id,
            titulo: t.title,
            ocorrencias,
            trecho: trecho(t.text, termo),
          });
        }
      }

      if (resultados.length === 0) {
        return { content: [{ type: "text", text: `Nenhuma ocorrencia encontrada para: ${termo}` }] };
      }

      resultados.sort((a, b) => b.ocorrencias - a.ocorrencias);
      let texto = `Encontradas ocorrencias de "${termo}" em ${resultados.length} topico(s):\n\n`;
      for (const r of resultados) {
        texto += `[${r.id}] ${r.titulo} (${r.ocorrencias} ocorrencia(s))\n  "${r.trecho}"\n\n`;
      }
      return { content: [{ type: "text", text: texto }] };
    }

    if (name === "get_snippet") {
      const categoria = args.categoria as SnippetCategory;
      const nome = args.nome as string;
      const snippet = snippets[categoria]?.[nome];
      if (!snippet) {
        const disponiveis = Object.keys(snippets[categoria] || {}).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Snippet nao encontrado: ${categoria}/${nome}\n\nDisponiveis nesta categoria: ${disponiveis}`,
            },
          ],
        };
      }
      return {
        content: [
          { type: "text", text: `Snippet: ${categoria}/${nome}\n\n\`\`\`pascal\n${snippet}\n\`\`\`` },
        ],
      };
    }

    if (name === "list_snippets") {
      let texto = "Snippets disponiveis:\n\n";
      for (const [cat, lista] of Object.entries(snippets)) {
        texto += `${cat}:\n`;
        for (const nomeSnippet of Object.keys(lista)) {
          texto += `  - ${nomeSnippet}\n`;
        }
        texto += "\n";
      }
      return { content: [{ type: "text", text: texto }] };
    }

    if (name === "search_snippets") {
      const termo = args.termo as string;
      const resultados: Array<{ cat: string; nome: string }> = [];
      for (const [cat, lista] of Object.entries(snippets)) {
        for (const [nomeSnippet, codigo] of Object.entries(lista)) {
          if (
            nomeSnippet.toLowerCase().includes(termo.toLowerCase()) ||
            codigo.toLowerCase().includes(termo.toLowerCase())
          ) {
            resultados.push({ cat, nome: nomeSnippet });
          }
        }
      }
      if (resultados.length === 0) {
        return { content: [{ type: "text", text: `Nenhum snippet encontrado com: ${termo}` }] };
      }
      let texto = `Encontrados ${resultados.length} snippet(s):\n\n`;
      for (const { cat, nome: nomeSnippet } of resultados) {
        texto += `- ${cat}/${nomeSnippet}\n`;
      }
      return { content: [{ type: "text", text: texto }] };
    }

    throw new Error("Ferramenta desconhecida");
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Erro: ${error instanceof Error ? error.message : String(error)}` },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Delphi CodeCoverage rodando...");
}

main().catch(console.error);
