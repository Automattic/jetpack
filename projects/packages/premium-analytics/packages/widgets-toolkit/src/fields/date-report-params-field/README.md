# ReportParamsField

Form control for editing a widget's date-range parameters
(preset, from/to, comparison range).

## Data coupling

This field depends on two external data providers:

| Provider             | Package                               | Purpose                                               |
| -------------------- | ------------------------------------- | ----------------------------------------------------- |
| `getStoreInfo()`     | `helpers/store-info` (local stand-in) | Reads `launchedDate` from the store profile           |
| `getDefaultPreset()` | `@jetpack-premium-analytics/data`     | Resolves a smart date-range preset based on store age |

### Why the coupling exists

The field renders inside a `@wordpress/components` Modal, which is a
**sibling** of the widget render tree — not a child. That means it has
no access to `WidgetRootContext` or any provider that lives inside
`WidgetRoot`.

Without this coupling, fresh widgets (no saved `reportParams`) would
always fall back to `last-30-days`, even when the widget itself uses a
dynamic preset like `today` or `last-7-days`. The settings modal would
show dates that don't match the widget's actual data range.

### Alternatives considered

| Approach                  | Why we didn't use it                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| WidgetRoot context        | Modal renders outside the widget tree — context not accessible       |
| Prop via attribute config | `@ciab/dataviews` `DataFormControlProps` doesn't support extra props |
| Global/singleton          | Adds indirection for a problem scoped to one component               |
| Attribute initialization  | Side-effect on render, risk of re-render loops                       |
