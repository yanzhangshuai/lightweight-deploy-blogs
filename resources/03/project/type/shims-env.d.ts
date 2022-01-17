interface ImportMetaEnv extends Readonly<Record<string, string | boolean | undefined>> {
  readonly GLOBAL_FILE_PATH: string;
  readonly GLOBAL_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
