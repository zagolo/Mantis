import { Label, ListBox, Select } from "@heroui/react";
import type { PublicCampaign } from "../../shared/contracts";

const ALL = "__all__";

export function CampaignSelect({
  campaigns,
  value,
  onChange,
  ariaLabel,
  isDisabled,
  appearance = "field",
  includeAll = false,
  className,
  id,
  title
}: {
  campaigns: Array<Pick<PublicCampaign, "id" | "name">>;
  value: string;
  onChange: (campaignId: string) => void;
  ariaLabel: string;
  isDisabled?: boolean;
  appearance?: "header" | "field";
  includeAll?: boolean;
  className?: string;
  id?: string;
  title?: string;
}) {
  const selected = includeAll ? value || ALL : value;
  const header = appearance === "header";
  const triggerId = id ?? "campaign-select";
  const selectedName =
    selected === ALL ? "All campaigns" : campaigns.find((item) => item.id === selected)?.name;

  return (
    <div
      className={["min-w-0", header ? "max-w-[min(20rem,100%)]" : "w-full", className].filter(Boolean).join(" ")}
      title={title ?? selectedName}
    >
      <label htmlFor={triggerId} className="sr-only">{ariaLabel}</label>
      <Select
        fullWidth={!header}
        isDisabled={isDisabled}
        placeholder={includeAll ? "All campaigns" : "Campaign"}
        value={selected || null}
        variant="secondary"
        onChange={(next) => {
          if (typeof next !== "string") return;
          onChange(next === ALL ? "" : next);
        }}
      >
        <Label className="sr-only">{ariaLabel}</Label>
        <Select.Trigger
          id={triggerId}
          className="min-w-0 max-w-full overflow-hidden"
        >
          <Select.Value className="min-w-0 flex-1 truncate text-left" />
          <Select.Indicator className="shrink-0 text-muted" />
        </Select.Trigger>
        <Select.Popover
          className="z-[80] max-h-80 w-max min-w-64 max-w-[min(28rem,calc(100vw-2rem))]"
          placement="bottom start"
        >
          <ListBox>
            {includeAll ? (
              <ListBox.Item id={ALL} textValue="All campaigns">
                <span className="min-w-0 flex-1 truncate" title="All campaigns">All campaigns</span>
                <ListBox.ItemIndicator className="shrink-0" />
              </ListBox.Item>
            ) : null}
            {campaigns.map((item) => (
              <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
                <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
                <ListBox.ItemIndicator className="shrink-0" />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
