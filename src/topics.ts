import type { Topic } from "./types.js";

export const topics: Topic[] = [
  {
    id: "project-setup",
    order: 1,
    title: "Configuração do projeto (.dproj) para gerar Map file",
    text: `# Configuração do projeto para code coverage

A DelphiCodeCoverage (https://github.com/DelphiCodeCoverage/DelphiCodeCoverage)
lê um arquivo .map do executável para saber quais linhas de código existem e
quais foram executadas. Sem o .map correto, ela não enxerga nada - por isso a
única pré-condição real da ferramenta é:

> "O projeto precisa ter uma configuração (tipicamente 'Debug') que gere um
> Map file DETALHADO."

## Onde configurar no Delphi IDE

Project > Options > Building > Delphi Compiler > Linking:
- **Map file**: mudar de "Off" (padrão) para **"Detailed"**.
- **Debug information**: deixar ligado (necessário para os nomes de unit/linha
  aparecerem corretamente no .map).

Isso gera, ao lado do .exe compilado, um arquivo .map com o mesmo nome-base
(ex.: MeuApp.exe -> MeuApp.map).

## Ligando via linha de comando (MSBuild)

Se o build roda via msbuild (CI, ou os .bat que a própria DelphiCodeCoverage
distribui - ver o tópico "ci-integration"), a config usada precisa já ter essa
opção marcada no .dproj (o .dproj grava isso por configuração de build -
"Debug"/"Release" - dentro da tag <DCC_MapFile>). Um trecho representativo (ver
o snippet dproj_coverage_settings/mapa_detalhado para o XML completo):

    <DCC_MapFile>3</DCC_MapFile>

(3 = Detailed. 0 = Off, 1 = Segments, 2 = Publics.)

## Um detalhe que já causou muita confusão

O .map que importa é o do EXECUTÁVEL QUE RODA OS TESTES (o DUnitX console
runner - ver "dunitx-runner"), não necessariamente o do app de produção
inteiro. Se as units que você quer cobrir são compiladas DENTRO do runner de
teste (o caminho mais comum: o .dpr do runner referencia as mesmas units .pas
do projeto principal), o .map do runner já contém tudo que precisa.

## DLLs/BPLs

Se seu app usa pacotes (BPL) ou DLLs externas, a DelphiCodeCoverage também
tenta carregar um .map correspondente para cada DLL/BPL carregada em tempo de
execução, desde que ele exista no MESMO diretório da DLL/BPL. Se você cobre
units que vivem num pacote separado, garanta Map file = Detailed também na
config de build desse pacote.

## Checklist rápido
1. Configuração de build usada para gerar o executável de teste tem
   Map file = Detailed.
2. Debug information ligado.
3. Se houver BPL/DLL com units a cobrir, elas também geram .map detalhado, no
   mesmo diretório do binário carregado.
4. Depois de compilar, confirme que o .map existe ao lado do .exe antes de
   rodar a CodeCoverage.exe (ver "cli-usage").`,
  },
  {
    id: "dunitx-runner",
    order: 2,
    title: "Projeto console runner do DUnitX para gerar o .map cobrível",
    text: `# Projeto DUnitX como console runner

A forma mais direta de gerar um executável+.map que a DelphiCodeCoverage
consegue processar é ter um projeto Delphi SEPARADO (um .dpr próprio, não o
app de produção) cujo único trabalho é: compilar as units de teste (DUnitX)
JUNTO com as units de produção que você quer cobrir, rodar os testes, e
terminar (idealmente devolvendo o exit code do resultado dos testes).

## Por que console, não GUI

Um runner CONSOLE (TDUnitX.Simple / ConsoleTestRunner) é mais fácil de
automatizar em CI (não trava esperando clique em botão) e produz um .exe
"limpo": a única GUI envolvida é a saída de texto no terminal. O runner
GUI do DUnitX (VCL/FMX) também funciona com a DelphiCodeCoverage, mas exige
fechar a janela manualmente ou automatizar isso - desnecessário se o objetivo
é cobertura + CI.

## Estrutura mínima

Um projeto de teste DUnitX típico tem:
- Um .dpr (ver snippet dunitx_console_dpr/runner_basico) que:
  1. Cria o runtime do DUnitX (\`TDUnitX.CreateRunner\`).
  2. Registra um logger de console (\`TDUnitXConsoleLogger\`).
  3. Roda os testes (\`Runner.Execute\`).
  4. Em CI, espera Enter só se NÃO estiver rodando sem interação
     (\`IsConsole and not System.SysUtils.FindCmdLineSwitch('NOPAUSE')\` - ver o
     próprio snippet).
- Uma ou mais units de teste (\`[TestFixture]\`, ver "dunitx_test_fixture") que
  fazem \`uses\` das units de PRODUÇÃO sendo testadas.
- No .dproj do runner, as units de produção entram na lista de \`uses\` do
  projeto (diretamente ou via as próprias units de teste) - é ISSO que faz
  elas serem compiladas dentro deste executável e aparecerem no .map dele.

## Ligando ao coverage_units.lst / parâmetro -u

Depois de compilado, você diz à CodeCoverage.exe quais das units compiladas
no runner você quer que ela meça (ver "cli-usage", parâmetro \`-u\`/\`-uf\`) -
tipicamente só as units de PRODUÇÃO, excluindo as próprias units de teste e
as units padrão da RTL/DUnitX (que também acabam compiladas no mesmo .exe,
mas não fazem sentido "cobrir").`,
  },
  {
    id: "cli-usage",
    order: 3,
    title: "Usando a CodeCoverage.exe (parâmetros reais, direto do README oficial)",
    text: `# CodeCoverage.exe - uso da linha de comando

Fonte: README oficial do projeto
(https://github.com/DelphiCodeCoverage/DelphiCodeCoverage), tabela de
switches. Uso básico documentado pelos próprios mantenedores:

    CodeCoverage -m TestApp.map -e TestApp.exe -u TestUnit TestUnit2 -xml -html

## Parâmetros essenciais

| Parâmetro | Para que serve |
|---|---|
| \`-m MapFile.map\` | O .map de entrada (do runner de teste, ver "dunitx-runner") |
| \`-e Executable.exe\` | O executável a rodar (o mesmo runner) |
| \`-u Unit1 Unit2 ...\` | Lista de units, direto na linha de comando, a medir |
| \`-uf arquivo.lst\` | Mesma coisa, mas lendo de um arquivo (1 unit por linha) - prefira isso quando a lista for grande; aceita prefixar \`!Unit\` pra EXCLUIR uma unit específica |
| \`-sd diretorio\` / \`-sp dir1 dir2\` | Onde encontrar o código-fonte (.pas) das units, para gerar o HTML com o código marcado |
| \`-dproj Projeto.dproj\` | Em vez de configurar \`-sd\`/executável/etc. manualmente, deixa a ferramenta ler isso direto do .dproj |
| \`-od diretorio\` | Pasta de SAÍDA dos relatórios - **precisa já existir**, a ferramenta não cria |
| \`-html\` | Gera \`CodeCoverage_Summary.html\` + um .html por unit (linhas verdes = cobertas, vermelhas = não cobertas) |
| \`-xml\` | Gera \`CodeCoverage_Summary.xml\` (formato compatível com EMMA - útil para CI/SonarQube) |
| \`-xmllines\` / \`-xmlgenerics\` | Detalha linha a linha no XML; \`-xmlgenerics\` agrupa ocorrências repetidas do mesmo arquivo (comum com generics) |
| \`-esm mascara1 mascara2\` | Exclui units cujo CAMINHO bate com a máscara (ex.: excluir tudo fora da pasta do seu projeto) |
| \`-ife\` / \`-efe\` | Incluir/excluir extensão de arquivo no nome da unit reportada (\`-efe\` é o padrão) |
| \`-a Param1 Param2\` | Argumentos repassados para o executável sendo medido |
| \`-tec\` | Repassa o exit code do app medido pra fora (crucial pra CI saber se os TESTES passaram, não só se a cobertura rodou) |

## Exemplo real (adaptado do próprio run-code-coverage.bat do projeto)

    CodeCoverage.exe ^
      -e build\\Win32\\MeuTestRunner.exe ^
      -m build\\Win32\\MeuTestRunner.map ^
      -esm C:\\MeuProjeto\\* ^
      -ife ^
      -xml -xmllines -html ^
      -uf coverage_units.lst ^
      -od reports\\coverage ^
      -dproj MeuTestRunner.dproj ^
      -tec

Ver o snippet cli_invocation/exemplo_completo para uma versão pronta pra
adaptar, e ci_script_windows/pipeline_basico para o encadeamento completo
build -> testes -> cobertura.

## Erro comum
Se \`-od\` apontar pra uma pasta que não existe, a ferramenta falha
silenciosamente ou não gera nada (dependendo da versão) - sempre crie a pasta
antes (\`mkdir\` no script, como o próprio .bat oficial faz).`,
  },
  {
    id: "ci-integration",
    order: 4,
    title: "Integração em CI: build -> testes -> cobertura",
    text: `# Pipeline de CI (build, testes, cobertura)

O fluxo recomendado, direto do padrão que o próprio repositório oficial usa
nos seus .bat (\`build-unit-test.bat\` + \`run-unit-test.bat\` +
\`run-code-coverage.bat\`), tem 3 passos sequenciais e independentes:

1. **Build** do projeto runner (DUnitX + units de produção) via \`msbuild\`:

       msbuild /p:Platform=Win32 /t:build /p:config=Debug /verbosity:detailed MeuTestRunner.dproj

   (Debug aqui é importante - é a config que tem Map file = Detailed, ver
   "project-setup". Não use a config Release num pipeline de cobertura.)

2. **Rodar os testes** (gera o .map de verdade, e falha o pipeline se algum
   teste quebrar):

       MeuTestRunner.exe -nopause --exitbehavior:Continue

   (flags exatas dependem de como o .dpr do runner foi montado - ver
   "dunitx-runner" - o importante é rodar de forma não-interativa.)

3. **Gerar o relatório de cobertura** com a CodeCoverage.exe, ver "cli-usage"
   pros parâmetros.

## Por que 3 passos e não 1 comando só

A DelphiCodeCoverage roda o executável de teste ELA MESMA internamente (você
passa \`-e\`, ela invoca) - então o passo "rodar os testes" (2) e "gerar
cobertura" (3) tecnicamente podem colapsar num só se você não precisa dos
resultados de teste separados dos de cobertura. Mas manter separado é útil em
CI: você quer que o pipeline falhe rápido e claro se um TESTE quebrar, antes
de gastar tempo gerando relatório de cobertura de um build que já está
quebrado - por isso os scripts oficiais rodam os testes primeiro,
isoladamente, e só depois chamam a CodeCoverage.exe (que vai rodar o mesmo
executável de novo).

## Sinalizando falha pro CI

Use \`-tec\` (ver "cli-usage") pra repassar o exit code do processo medido -
sem isso, o pipeline pode reportar sucesso mesmo com testes falhando, porque
o exit code que o CI vê é o da PRÓPRIA CodeCoverage.exe, não o do seu app.

Ver ci_script_windows/pipeline_basico para um .bat/PowerShell completo
encadeando os 3 passos com tratamento de erro entre eles.`,
  },
  {
    id: "form-mvp-pattern",
    order: 5,
    title: "Mantendo Forms cobríveis (separação Form/lógica)",
    text: `# Forms e code coverage: o problema real

A DelphiCodeCoverage mede LINHA executada, não "funcionalidade testada". Um
\`TForm\` cheio de lógica de negócio dentro de \`OnClick\`/\`OnCreate\` é, na
prática, quase impossível de cobrir de forma significativa: rodar testes
automatizados que instanciam a Form, disparam eventos de UI e verificam o
resultado é lento, frágil, e em muitos casos exige um ambiente gráfico (nem
sempre disponível num runner de CI headless).

## A solução não é "testar a Form" - é não colocar lógica nela

Isto já está na sua própria diretriz de arquitetura (MVC/MVP para FireMonkey/
VCL): a View (Form/Frame) só deve conter UI - bind de dados, mostrar/ocultar,
disparar evento que chama o Presenter/Controller. Toda a lógica de negócio
real vai para uma classe SEM \`uses FMX.*\`/\`Vcl.*\` - essa classe, sim, é
100% cobrível por DUnitX normal, sem precisar simular UI nenhuma.

## Prática concreta

1. Para cada Form com alguma decisão de negócio não-trivial (validação,
   cálculo, orquestração de chamada a Service/Repository), extraia essa
   lógica para uma classe Presenter/Controller separada (ver
   unit_skeleton/presenter_basico).
2. A Form recebe esse Presenter (via construtor ou propriedade) e só chama
   métodos nele a partir dos handlers de evento - o handler em si vira uma
   linha (\`FPresenter.Confirmar;\`), sem \`if\`/\`case\`/cálculo direto.
3. O teste DUnitX cobre o Presenter direto, sem nunca instanciar a Form.
4. Quando quiser reportar "esta tela está coberta", meça a cobertura do
   PRESENTER (que carrega a lógica) - a própria Form pode ficar de fora da
   lista \`-u\`/\`-uf\` (ver "cli-usage") sem perda real de sinal, já que ela não
   tem lógica pra cobrir.

## Quando a Form REALMENTE precisa de teste de UI

Casos raros (fluxo de navegação entre telas, algum componente visual
customizado com lógica própria de desenho) podem justificar teste de UI
(TestComplete, ferramentas de automação FMX) - isso é uma categoria
DIFERENTE de teste, fora do escopo da DelphiCodeCoverage (que mede linha
executada de código Pascal, não interação de UI).`,
  },
];
