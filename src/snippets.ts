import type { SnippetMap } from "./types.js";

export const snippets: SnippetMap = {
  unit_skeleton: {
    producao_basica: `unit MeuModulo.Calculadora;

interface

type
  TCalculadora = class
  public
    function Somar(const A, B: Double): Double;
    function Dividir(const A, B: Double): Double;
  end;

implementation

uses
  System.SysUtils;

{ TCalculadora }

function TCalculadora.Somar(const A, B: Double): Double;
begin
  Result := A + B;
end;

function TCalculadora.Dividir(const A, B: Double): Double;
begin
  if B = 0 then
    raise EDivByZero.Create('Divisao por zero nao permitida.');
  Result := A / B;
end;

end.`,
    presenter_basico: `unit MeuModulo.Presenter.Cadastro;

interface

type
  // Sem "uses FMX.*"/"Vcl.*" aqui - e por isso que esta classe e 100%
  // coverivel por DUnitX normal, sem precisar simular UI nenhuma.
  ICadastroView = interface
    ['{B6B7A2B0-7B7B-4A3B-9C1A-0E7E7B7B7B7B}']
    procedure MostrarErro(const AMensagem: string);
    procedure MostrarSucesso;
  end;

  TCadastroPresenter = class
  private
    FView: ICadastroView;
  public
    constructor Create(const AView: ICadastroView);
    procedure Confirmar(const ANome: string; const AIdade: Integer);
  end;

implementation

{ TCadastroPresenter }

constructor TCadastroPresenter.Create(const AView: ICadastroView);
begin
  inherited Create;
  FView := AView;
end;

procedure TCadastroPresenter.Confirmar(const ANome: string; const AIdade: Integer);
begin
  if ANome.Trim.IsEmpty then
  begin
    FView.MostrarErro('Informe o nome.');
    Exit;
  end;

  if AIdade < 18 then
  begin
    FView.MostrarErro('Idade minima e 18 anos.');
    Exit;
  end;

  FView.MostrarSucesso;
end;

end.`,
  },

  dunitx_test_fixture: {
    fixture_basico: `unit MeuModulo.Tests.Calculadora;

interface

uses
  DUnitX.TestFramework,
  MeuModulo.Calculadora;

type
  [TestFixture]
  TCalculadoraTests = class
  private
    FSut: TCalculadora; // "system under test"
  public
    [Setup]
    procedure Setup;
    [TearDown]
    procedure TearDown;

    [Test]
    procedure Somar_DoisPositivos_RetornaSoma;
    [Test]
    [TestCase('Zero', '0,5,5')]
    [TestCase('Negativo', '-5,5,0')]
    procedure Somar_Casos(const A, B, Esperado: Double);
    [Test]
    procedure Dividir_PorZero_LevantaExcecao;
  end;

implementation

uses
  System.SysUtils;

{ TCalculadoraTests }

procedure TCalculadoraTests.Setup;
begin
  FSut := TCalculadora.Create;
end;

procedure TCalculadoraTests.TearDown;
begin
  FSut.Free;
end;

procedure TCalculadoraTests.Somar_DoisPositivos_RetornaSoma;
begin
  Assert.AreEqual(5.0, FSut.Somar(2, 3));
end;

procedure TCalculadoraTests.Somar_Casos(const A, B, Esperado: Double);
begin
  Assert.AreEqual(Esperado, FSut.Somar(A, B));
end;

procedure TCalculadoraTests.Dividir_PorZero_LevantaExcecao;
begin
  Assert.WillRaise(
    procedure
    begin
      FSut.Dividir(10, 0);
    end,
    EDivByZero);
end;

initialization
  TDUnitX.RegisterTestFixture(TCalculadoraTests);

end.`,
  },

  dunitx_console_dpr: {
    runner_basico: `program MeuTestRunner;

{$APPTYPE CONSOLE}

{$STRONGLINKTYPES ON}
uses
  System.SysUtils,
  {$IFDEF TESTINSIGHT}
  TestInsight.DUnitX,
  {$ELSE}
  DUnitX.Loggers.Console,
  DUnitX.Loggers.Xml.NUnit,
  {$ENDIF }
  DUnitX.TestFramework,
  // Units de PRODUCAO cobertas entram aqui (direto ou via as units de teste
  // abaixo, que ja fazem uses delas) - e ISSO que faz o compilador incluir
  // seu codigo no .exe/.map deste runner.
  MeuModulo.Calculadora in '..\\Source\\MeuModulo.Calculadora.pas',
  MeuModulo.Tests.Calculadora in 'MeuModulo.Tests.Calculadora.pas';

var
  runner: ITestRunner;
  results: IRunResults;
  logger: ITestLogger;
  nunitLogger: ITestLogger;

begin
  {$IFDEF TESTINSIGHT}
  TestInsight.DUnitX.RunRegisteredTests;
  {$ELSE}
  try
    // Nao usa TDUnitX.CheckCommandLine/UsesCommandLineOptions de proposito -
    // roda sempre nao-interativo, ideal pra CI e pra ser chamado direto pela
    // CodeCoverage.exe (-e/-m, ver topico "cli-usage").
    runner := TDUnitX.CreateRunner;
    runner.UseRTTI := True;
    runner.FailsOnNoAsserts := False;

    logger := TDUnitXConsoleLogger.Create(True);
    runner.AddLogger(logger);

    nunitLogger := TDUnitXXMLNUnitFileLogger.Create(TDUnitXXMLNUnitFileLogger.DefaultFileName);
    runner.AddLogger(nunitLogger);

    results := runner.Execute;

    // Repassa o exit code (combine com "-tec" da CodeCoverage.exe - ver
    // topico "cli-usage" - pra CI enxergar teste quebrado como falha real).
    if not results.AllPassed then
      System.ExitCode := EXIT_ERRORS;

    if System.FindCmdLineSwitch('NOPAUSE') then
      Exit;
    if IsConsole then
    begin
      System.Write('Pressione <Enter> para sair...');
      System.Readln;
    end;
  except
    on E: Exception do
      System.Writeln(E.ClassName, ': ', E.Message);
  end;
  {$ENDIF}
end.`,
  },

  dproj_coverage_settings: {
    mapa_detalhado: `<!-- Dentro do .dproj, no PropertyGroup da configuracao usada pra gerar o
     executavel de teste (tipicamente "Debug") - DCC_MapFile=3 equivale a
     "Map file = Detailed" no IDE (Project > Options > Building > Delphi
     Compiler > Linking). Ver topico "project-setup" para o porque. -->
<PropertyGroup Condition="'$(Base)'!=''">
  <DCC_MapFile>3</DCC_MapFile>
  <DCC_DebugInformation>true</DCC_DebugInformation>
  <DCC_RemoteDebug>true</DCC_RemoteDebug>
  <DCC_Optimize>false</DCC_Optimize>
</PropertyGroup>
<!--
  DCC_MapFile: 0 = Off, 1 = Segments, 2 = Publics, 3 = Detailed (obrigatorio).
  DCC_Optimize=false evita que o compilador elimine/funda linhas de um jeito
  que atrapalhe o mapeamento 1:1 entre linha-fonte e linha-executada.
-->`,
  },

  cli_invocation: {
    exemplo_completo: `:: Adaptado do run-code-coverage.bat oficial do repositorio
:: DelphiCodeCoverage/DelphiCodeCoverage. Ajuste os caminhos pro seu projeto.
:: Ver topico "cli-usage" para a tabela completa de parametros.

set PLATFORM=Win32
set BUILD=build\\%PLATFORM%
set REPORTS=reports

mkdir %REPORTS%\\coverage 2>nul

CodeCoverage.exe ^
  -e %BUILD%\\MeuTestRunner.exe ^
  -m %BUILD%\\MeuTestRunner.map ^
  -esm %CD%\\ThirdParty\\* ^
  -ife ^
  -xml -xmllines -xmlgenerics -html ^
  -uf coverage_units.lst ^
  -od %REPORTS%\\coverage ^
  -dproj MeuTestRunner.dproj ^
  -lt %REPORTS%\\CodeCoverage.log ^
  -tec`,
  },

  ci_script_windows: {
    pipeline_basico: `@ECHO OFF
:: Pipeline basico: build -> testes -> cobertura.
:: Mesmo padrao dos .bat oficiais do DelphiCodeCoverage (build-unit-test.bat +
:: run-unit-test.bat + run-code-coverage.bat), so que encadeados com
:: tratamento de erro entre os passos. Ver topico "ci-integration".

SETLOCAL

set PLATFORM=Win32
set PRJDIR=%~dp0
set PRJ=MeuTestRunner
set BUILD=%PRJDIR%build\\%PLATFORM%
set REPORTS=%PRJDIR%reports

ECHO === 1/3: Build (config Debug - Map file Detailed) ===
msbuild /p:Platform=%PLATFORM% /t:build /p:config=Debug /verbosity:quiet "%PRJDIR%%PRJ%.dproj"
IF ERRORLEVEL 1 (
  ECHO Build falhou.
  EXIT /B 1
)

ECHO === 2/3: Rodar os testes ===
"%BUILD%\\%PRJ%.exe" -nopause
IF ERRORLEVEL 1 (
  ECHO Testes falharam - abortando antes de gerar cobertura.
  EXIT /B 1
)

ECHO === 3/3: Gerar relatorio de cobertura ===
mkdir "%REPORTS%\\coverage" 2>nul
CodeCoverage.exe ^
  -e "%BUILD%\\%PRJ%.exe" ^
  -m "%BUILD%\\%PRJ%.map" ^
  -ife -xml -xmllines -html ^
  -uf "%PRJDIR%coverage_units.lst" ^
  -od "%REPORTS%\\coverage" ^
  -dproj "%PRJDIR%%PRJ%.dproj" ^
  -tec
IF ERRORLEVEL 1 (
  ECHO Geracao de cobertura reportou erro (testes provavelmente falharam).
  EXIT /B 1
)

ECHO Concluido. Relatorio em %REPORTS%\\coverage\\CodeCoverage_Summary.html
ENDLOCAL`,
  },
};
