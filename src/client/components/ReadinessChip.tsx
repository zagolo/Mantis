import { Link } from "react-router-dom";
import { Link as HeroLink } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { BootstrapResponse } from "../../shared/contracts";
import type { DeviceStatus } from "../state/calls";

export type ReadinessKind = "ready" | "twilio" | "sheet";

export function readinessState(input: {
  sheet: BootstrapResponse["sheet"];
  twilioConfigured: boolean;
  deviceStatus: DeviceStatus;
}): { kind: ReadinessKind; label: string; tone: "ok" | "bad" } {
  if (input.sheet.status === "error" || input.sheet.status === "unconfigured") {
    return { kind: "sheet", label: "Sheet needs a fix", tone: "bad" };
  }
  if (!input.twilioConfigured) {
    return { kind: "twilio", label: "Voice setup required", tone: "bad" };
  }
  if (input.deviceStatus !== "registered") {
    const label = input.deviceStatus === "registering" ? "Connecting voice…"
      : input.deviceStatus === "error" ? "Voice connection issue — see Settings" : "Reconnecting voice…";
    return { kind: "twilio", label, tone: "bad" };
  }
  return { kind: "ready", label: "Ready to call", tone: "ok" };
}

export function ReadinessChip({
  sheet,
  twilioConfigured,
  deviceStatus
}: {
  sheet: BootstrapResponse["sheet"];
  twilioConfigured: boolean;
  deviceStatus: DeviceStatus;
}) {
  const state = readinessState({ sheet, twilioConfigured, deviceStatus });
  const blocking = state.kind === "sheet";

  return (
    <div
      className="flex min-w-0 items-center gap-3 text-sm"
      aria-label={state.label}
    >
      {state.kind !== "ready" ? (
        blocking ? (
          <HeroLink className="truncate" render={(props) => <Link {...(props as ComponentPropsWithRef<typeof Link>)} to="/notifications#queue" />}>
            {state.label}
          </HeroLink>
        ) : (
          <HeroLink className="truncate" render={(props) => <Link {...(props as ComponentPropsWithRef<typeof Link>)} to="/settings" />}>
            {state.label}
          </HeroLink>
        )
      ) : null}
      {twilioConfigured ? (
        <span className="sr-only" aria-label={`Twilio device ${deviceStatus}`}>
          Twilio device {deviceStatus}
        </span>
      ) : null}
    </div>
  );
}
