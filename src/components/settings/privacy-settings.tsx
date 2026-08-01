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

function PrivacySettings({
  functional,
  analytics,
  sessionReplay,
  onFunctionalChange,
  onAnalyticsChange,
  onSessionReplayChange,
  onBack,
  onReject,
  onAcceptMinimum,
  onAcceptAll,
}: {
  functional: boolean
  analytics: boolean
  sessionReplay: boolean
  onFunctionalChange: (enabled: boolean) => void
  onAnalyticsChange: (enabled: boolean) => void
  onSessionReplayChange: (enabled: boolean) => void
  onBack: () => void
  onReject: () => void
  onAcceptMinimum: () => void
  onAcceptAll: () => void
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
            Choose what this guide may remember and whether optional analytics
            may run. Changes save when you go back or close this dialog.
          </DialogDescription>
          <FieldGroup className="gap-0">
            <Field
              className="items-start justify-between gap-6 py-4"
              orientation="horizontal"
            >
              <FieldContent>
                <FieldTitle className="mb-1 text-[.82rem]">
                  Required consent record
                </FieldTitle>
                <FieldDescription className="m-0 max-w-[38rem] text-[.76rem] leading-[1.5]">
                  Stores this privacy choice for 180 days so the banner does not
                  reappear on every page. It is not used for analytics or
                  advertising.
                </FieldDescription>
              </FieldContent>
              <Switch
                checked
                disabled
                aria-label="The consent record is always enabled"
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
                  Rybbit measures visits, navigation, device types, and general
                  usage patterns so we can improve the guide. This does not
                  enable session recording.
                </FieldDescription>
              </FieldContent>
              <Switch
                className="mt-[.15rem]"
                checked={analytics}
                onCheckedChange={onAnalyticsChange}
                aria-label="Allow analytics"
              />
            </Field>
            <Field
              className="items-start justify-between gap-6 border-t py-4"
              orientation="horizontal"
            >
              <FieldContent>
                <FieldTitle className="mb-1 text-[.82rem]">
                  Session recording
                </FieldTitle>
                <FieldDescription className="m-0 max-w-[38rem] text-[.76rem] leading-[1.5]">
                  Rybbit records clicks, scrolling, navigation, and page
                  interactions so we can find usability problems. Form input
                  values and player names are masked by the recorder. This
                  requires analytics and remains off unless you enable it.
                </FieldDescription>
              </FieldContent>
              <Switch
                className="mt-[.15rem]"
                checked={sessionReplay}
                onCheckedChange={onSessionReplayChange}
                aria-label="Allow session recording"
              />
            </Field>
          </FieldGroup>
        </div>
      </ScrollArea>
      <DialogFooter className="justify-stretch [&>button]:flex-1 max-[521px]:flex-col-reverse max-[521px]:[&>button]:w-full">
        <Button variant="outline" onClick={onReject}>
          Reject optional
        </Button>
        <Button
          variant="secondary"
          onClick={onAcceptMinimum}
          aria-label="Accept minimum: allow only the required consent record"
          title="Allow only the required consent record"
        >
          Accept minimum
        </Button>
        <Button onClick={onAcceptAll}>Accept all</Button>
      </DialogFooter>
    </>
  )
}

export { PrivacySettings }
