import { SettingsDialogHeader } from "@/components/settings/settings-dialog-header"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Link } from "react-router"

function PrivacySettings({
  functional,
  analytics,
  strictRegion,
  onFunctionalChange,
  onAnalyticsChange,
  onBack,
  onReject,
  onSave,
}: {
  functional: boolean
  analytics: boolean
  strictRegion: boolean
  onFunctionalChange: (enabled: boolean) => void
  onAnalyticsChange: (enabled: boolean) => void
  onBack: () => void
  onReject: () => void
  onSave: () => void
}) {
  return (
    <>
      <SettingsDialogHeader title="Privacy settings" onBack={onBack} />
      <ScrollArea
        className="h-full min-h-0"
        thumbClassName="bg-[color-mix(in_oklch,var(--muted-foreground)_55%,transparent)]"
      >
        <div className="px-6 pt-[1.35rem] pb-6">
          <DialogDescription className="mt-0 mb-5">
            Control saved preferences and browser-level analytics. Anonymous
            aggregate visit totals do not use a persistent browser identifier.
          </DialogDescription>
          <FieldGroup className="gap-0">
            <Field
              className="items-start justify-between gap-6 py-4"
              orientation="horizontal"
            >
              <FieldContent>
                <FieldTitle className="mb-1 text-[.82rem]">
                  Anonymous aggregate measurement
                </FieldTitle>
                <FieldDescription className="m-0 max-w-[38rem] text-[.76rem] leading-[1.5]">
                  Cloudflare Web Analytics counts pageviews and visits without
                  cookies, localStorage, fingerprinting, or a persistent visitor
                  identifier. These totals cannot identify a person.
                </FieldDescription>
              </FieldContent>
              <Switch
                checked
                disabled
                aria-label="Anonymous aggregate measurement is always enabled"
              />
            </Field>
            <Field
              className="items-start justify-between gap-6 border-t py-4"
              orientation="horizontal"
            >
              <FieldContent>
                <FieldTitle className="mb-1 text-[.82rem]">
                  Remember progress and preferences
                </FieldTitle>
                <FieldDescription className="m-0 max-w-[38rem] text-[.76rem] leading-[1.5]">
                  Remembers your last player search, manually checked
                  progression, activity and efficiency checklists, color theme,
                  sidebar state, and background-video choice. When disabled,
                  those features still work for the current visit but are not
                  saved.
                </FieldDescription>
              </FieldContent>
              <Switch
                className="mt-[.15rem]"
                checked={functional}
                onCheckedChange={onFunctionalChange}
                aria-label="Remember guide progress and preferences"
              />
            </Field>
            <Field
              className="items-start justify-between gap-6 border-t py-4"
              orientation="horizontal"
            >
              <FieldContent>
                <FieldTitle className="mb-1 text-[.82rem]">
                  Analytics
                </FieldTitle>
                <FieldDescription className="m-0 max-w-[38rem] text-[.76rem] leading-[1.5]">
                  Rybbit measures daily unique browsers, page navigation,
                  referrers, device types, and approximate location. It uses a
                  random browser identifier, but never receives player names or
                  form values. Turning this off deletes its identifier from this
                  browser. {strictRegion
                    ? "It remains off until you allow it."
                    : "It is enabled by default in your region and can be disabled anytime."}
                </FieldDescription>
              </FieldContent>
              <Switch
                className="mt-[.15rem]"
                checked={analytics}
                onCheckedChange={onAnalyticsChange}
                aria-label="Allow analytics"
              />
            </Field>
          </FieldGroup>
          <p className="mt-5 mb-0 text-[.72rem] leading-[1.5] text-muted-foreground">
            Read the full <Link className="font-bold text-primary underline underline-offset-2" to="/privacy" onClick={() => onSave()}>privacy notice</Link>.
          </p>
        </div>
      </ScrollArea>
      <DialogFooter className="justify-stretch [&>button]:flex-1 max-[521px]:flex-col-reverse max-[521px]:[&>button]:w-full">
        <Button variant="outline" onClick={onReject}>
          Disable optional
        </Button>
        <Button onClick={() => onSave()}>Save choices</Button>
      </DialogFooter>
    </>
  )
}

export { PrivacySettings }
