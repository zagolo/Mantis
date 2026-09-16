{ pkgs, lib, config, ... }:
let
  default = value: lib.mkDefault value;
in {
  packages = [ pkgs.nodejs_22 pkgs.python3 pkgs.gnumake pkgs.gcc pkgs.pkg-config pkgs.git pkgs.curl ];

  # Public local configuration; Factory injects protected inputs separately.
  env.NODE_ENV = default "development";
  env.HOST = default "0.0.0.0";
  env.PORT = default "3000";
  env.APP_BASE_URL = default "http://127.0.0.1:3000";
  env.DATABASE_PATH = default "${config.devenv.root}/.devenv/state/mantis/ledger.sqlite";
  env.SHEETS_CONFIG_PATH = default "./config/sheets.example.yaml";
  env.CAMPAIGNS_DIR = default "./config/campaigns";
  env.PLAYBOOK_PATH = default "./config/playbooks/cold-calling.yaml";
  env.SHEETS_BACKEND = default "memory";
  env.TWILIO_ALLOWED_COUNTRIES = default "US,CA";
  env.TWILIO_TRACK_CALLER = default "inbound";
  env.TWILIO_TRACK_CONTACT = default "outbound";
  env.RECORDING_NOTICE = default "Recording and transcription may be active. Give any required notice before substantive conversation. This app does not guarantee legal compliance.";
  env.DEEPGRAM_MODEL = default "nova-3";
  env.DEEPGRAM_LANGUAGE = default "en";
  env.DEEPGRAM_RECONNECT_DELAY_MS = default "1000";
  env.DEEPGRAM_FLUSH_MS = default "5000";
  env.LLM_API_MODE = default "chat_completions";
  env.LLM_TIMEOUT_MS = default "4000";
  env.AI_GENERATION_TIMEOUT_MS = default "90000";
  env.RESEARCH_TIMEOUT_MS = default "60000";
  env.RESEARCH_CACHE_TTL_MS = default "604800000";
  env.COACH_RATE_LIMIT_MS = default "3000";
  env.DRAIN_TIMEOUT_MS = default "30000";
  env.BASE_URL = default "http://127.0.0.1:3000";
  env.AI_ENV_FILE = default ".env";
  env.TWILIO_ENV_FILE = default ".env";
  env.SALES_LITELLM_PORT = default "4001";
  env.VITE_E2E = default "false";
  env.NVM_DIR = default "";

  # Inventory also reports these script-local variables. The scripts overwrite
  # them before use; empty public defaults do not configure or run deployment.
  env.APP = default "";
  env.BASE = default "";
  env.CONTROL = default "";
  env.HEALTH_PORT = default "";
  env.HOST_GUESS = default "";
  env.KEEP_RELEASES = default "";
  env.KEY = default "";
  env.PUB = default "";
  env.RELEASE = default "";
  env.RELEASES = default "";
  env.SHARED = default "";
  env.SUDOERS_FILE = default "";
  env.SUDOERS_LINE = default "";
  env.USER_NAME = default "";

  tasks."mantis:prepare" = {
    exec = ''
      npm ci --include=dev
      npm run build
      mkdir -p .devenv/state/mantis
    '';
    before = [ "devenv:processes:app" ];
  };
  # The app applies its transaction-backed, idempotent SQLite migrations before
  # listening. Readiness verifies those migrations and authentication setup.
  processes.app = {
    exec = "npm start";
    ready.exec = "curl --fail --silent --output /dev/null http://127.0.0.1:$PORT/health/ready";
  };
}
