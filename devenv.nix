{ pkgs, config, ... }:
{
  packages = [ pkgs.git pkgs.curl pkgs.python3 pkgs.gnumake pkgs.gcc ];
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
  };

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

  tasks."mantis:install" = {
    exec = ''
      mkdir -p .devenv/state/mantis
      npm ci
    '';
    before = [ "devenv:processes:server" "devenv:processes:client" ];
  };

  # Startup applies the application's idempotent SQLite migrations before listening.
  processes.server = {
    exec = "npm run dev:server";
    process-compose = {
      readiness_probe = {
        http_get = { host = "127.0.0.1"; port = 3000; path = "/health/ready"; };
        initial_delay_seconds = 2;
        period_seconds = 2;
        timeout_seconds = 5;
        failure_threshold = 30;
      };
    };
  };
  processes.client = {
    exec = "npm run dev:client -- --host 0.0.0.0 --strictPort";
    process-compose = {
      depends_on.server.condition = "process_healthy";
      readiness_probe = {
        http_get = { host = "127.0.0.1"; port = 5173; path = "/"; };
        initial_delay_seconds = 2;
        period_seconds = 2;
        timeout_seconds = 5;
        failure_threshold = 30;
      };
    };
  };
}
