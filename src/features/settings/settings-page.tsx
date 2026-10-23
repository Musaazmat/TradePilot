import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeading } from '@/components/shared/page-heading'
import { Panel } from '@/components/shared/panel'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
// import { Switch } from '@/components/ui/switch'
import { useAppState } from '@/state/app-state'

import { settingsSchema, type SettingsFormValues } from './settings-schema'

export function SettingsPage() {
  const { state, dispatch } = useAppState()
  const { preferences } = state
  const [confirmReset, setConfirmReset] = useState(false)
  const { register, handleSubmit, reset, control, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: preferences.displayName,
      email: preferences.email,
      notifyOrders: preferences.notifyOrders,
      notifyAlerts: preferences.notifyAlerts,
      confirmOrders: preferences.confirmOrders,
    },
  })

  const onSubmit = (values: SettingsFormValues) => {
    dispatch({ type: 'preferences_updated', changes: values })
    reset(values)
    toast.success('Preferences saved')
  }

  return (
    <>
      <PageHeading title="Settings" description="Preferences are stored in this browser only." />
      <div className="grid max-w-3xl gap-3">


        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-3">
          <Panel title="Profile & notifications">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.displayName}>
                  <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                  <Input id="displayName" aria-invalid={!!errors.displayName} {...register('displayName')} />
                  {errors.displayName && <FieldError>{errors.displayName.message}</FieldError>}
                </Field>
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
                  {errors.email && <FieldError>{errors.email.message}</FieldError>}
                </Field>
              </div>
              <Separator />
              <Controller control={control} name="notifyOrders" render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox id="notifyOrders" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  <FieldLabel htmlFor="notifyOrders" className="font-normal">Notify me about order executions and cancellations</FieldLabel>
                </Field>
              )} />
              <Controller control={control} name="notifyAlerts" render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox id="notifyAlerts" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  <FieldLabel htmlFor="notifyAlerts" className="font-normal">Notify me when price alerts trigger</FieldLabel>
                </Field>
              )} />
              <div><Button type="submit" disabled={!isDirty}>Save changes</Button></div>
            </FieldGroup>
          </Panel>

          {/* <Panel title="Security">
            <Controller control={control} name="confirmOrders" render={({ field }) => (
              <Field orientation="horizontal">
                <Switch id="confirmOrders" checked={field.value} onCheckedChange={field.onChange} />
                <FieldLabel htmlFor="confirmOrders" className="font-normal">Ask me to confirm each order before it is submitted</FieldLabel>
              </Field>
            )} />
            <p className="text-muted-foreground mt-3 text-xs">Password and two-factor settings are not offered: this demo has no accounts, sign-in or backend. Saved with the profile above.</p>
          </Panel> */}
        </form>
        <Panel title="Appearance">
          <SegmentedControl
            ariaLabel="Theme"
            value={preferences.theme}
            onChange={(theme) => dispatch({ type: 'preferences_updated', changes: { theme } })}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
          />
        </Panel>

        <Panel title="Demo data">
          <p className="text-muted-foreground mb-3 text-sm">Restore the seeded portfolio, orders, watchlist and preferences.</p>
          <div><Button variant="sell" onClick={() => setConfirmReset(true)}>Reset demo</Button></div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="All orders, transactions, alerts and preference changes will be replaced with the initial demo state."
        confirmLabel="Reset demo"
        onConfirm={() => {
          dispatch({ type: 'demo_reset' })
          reset({ displayName: 'Musaazmat Musani', email: 'musaniazmat@gmai.com', notifyOrders: true, notifyAlerts: true, confirmOrders: false })
          toast.success('Demo data reset')
        }}
      />
    </>
  )
}
