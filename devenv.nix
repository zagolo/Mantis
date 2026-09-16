{ pkgs, config, ... }:
{
  packages = [ pkgs.nodejs_22 pkgs.python3 pkgs.gnumake pkgs.gcc pkgs.sqlite ];

  env = {
    NODE_ENV = "development";
    HOST = "0.0.0.0";
    PORT = "3000";
    DATABASE_PATH = "${config.devenv.root}/.devenv/state/mantis/ledger.sqlite";
    SHEETS_BACKEND = "google";
    SHEETS_CONFIG_PATH = "./config/sheets.example.yaml";
    CAMPAIGNS_DIR = "./config/campaigns";
    PLAYBOOK_PATH = "./config/playbooks/cold-calling.yaml";
    npm_config_cache = "${config.devenv.root}/.devenv/state/npm";
  };

  tasks."mantis:dependencies" = {
    exec = "npm ci --no-audit --no-fund";
  };
  tasks."mantis:migrate" = {
    after = [ "mantis:dependencies" ];
    exec = ''
      mkdir -p .devenv/state/mantis
      node --import tsx --input-type=module -e 'import { openDatabase, migrate } from "./src/server/db/index.ts"; const db = openDatabase(process.env.DATABASE_PATH); try { migrate(db, "migrations"); } finally { db.close(); }'
    '';
  };

  processes.server = {
    exec = "npm run dev:server";
    after = [ "mantis:migrate" ];
    ready.http.get = { port = 3000; path = "/health/ready"; };
  };
  processes.client = {
    exec = ''
      node --input-type=module -e 'import { createServer } from "vite"; const server = await createServer({ cacheDir: ".devenv/state/vite", server: { host: "0.0.0.0", strictPort: true } }); await server.listen(); server.printUrls();'
    '';
    after = [ "devenv:processes:server" ];
    ready.http.get = { port = 5173; path = "/"; };
  };
}
