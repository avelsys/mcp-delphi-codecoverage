export interface Topic {
  id: string;
  title: string;
  order: number;
  text: string;
}

export type SnippetCategory =
  | "unit_skeleton"
  | "dunitx_test_fixture"
  | "dunitx_console_dpr"
  | "dproj_coverage_settings"
  | "cli_invocation"
  | "ci_script_windows";

export type SnippetMap = Record<SnippetCategory, Record<string, string>>;
