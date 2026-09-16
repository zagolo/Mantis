{ pkgs, config, ... }:
{
  packages = [ pkgs.nodejs_22 pkgs.python3 pkgs.gnumake pkgs.gcc pkgs.pkg-config pkgs.curl ];

  env = {
    NODE_ENV = "development";
    HOST = "0.0.0.0";
    PORT = "3000";
    APP_BASE_URL = "http://127.0.0.1:5173";
    DATABASE_PATH = "${config.devenv.root}/.devenv/state/mantis/ledger.sqlite";
    SHEETS_BACKEND = "memory";
    SHEETS_CONFIG_PATH = "./config/sheets.example.yaml";
    CAMPAIGNS_DIR = "./config/campaigns";
    PLAYBOOK_PATH = "./config/playbooks/cold-calling.yaml";
    npm_config_cache = "${config.devenv.root}/.devenv/state/npm";
  };

  tasks."mantis:dependencies" = {
    exec = "npm ci --no-audit --no-fund";
    before = [ "devenv:enterShell" ];
  };
  tasks."mantis:migrate" = {
    after = [ "mantis:dependencies" ];
    before = [ "devenv:processes:api" "devenv:processes:client" ];
    exec = ''
      node --import tsx --input-type=module -e 'import { openDatabase, migrate } from "./src/server/db/index.ts"; const db = openDatabase(process.env.DATABASE_PATH); try { migrate(db, "migrations"); } finally { db.close(); }'
    '';
  };

  processes.api = {
    exec = "npm run dev:server";
    process-compose.readiness_probe = {
      http_get = { host = "127.0.0.1"; port = 3000; path = "/health/ready"; };
      initial_delay_seconds = 2;
      period_seconds = 2;
      timeout_seconds = 5;
      failure_threshold = 60;
    };
  };
  processes.client = {
    exec = "npm run dev:client -- --host 0.0.0.0 --strictPort";
    process-compose.readiness_probe = {
      http_get = { host = "127.0.0.1"; port = 5173; path = "/"; };
      initial_delay_seconds = 2;
      period_seconds = 2;
      timeout_seconds = 5;
      failure_threshold = 60;
    };
  };
}
