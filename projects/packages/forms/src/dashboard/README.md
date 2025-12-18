# Jetpack Forms Dashboard

This is the React-app implementation for the new Jetpack Forms dashboard.

## Directory structure

```
.
├── components/                     - Reusable components without any state dependencies.
│   ├── layout/                     - Layout wrapper with surface styling
│   ├── page/                       - Page component for dashboard structure
│   └── inspector/                  - Response inspector/detail view
├── inbox/                          - Inbox view implementation.
│   └── stage/                      - Main stage component (response list)
├── integrations/                   - Integrations view implementation.
├── hooks/                          - Custom React hooks.
├── store/                          - Redux store for app state.
├── index.tsx                       - App entrypoint.
├── class-dashboard.php             - Jetpack Forms WP Admin setup.
└── class-dashboard-view-switch.php - Feedback view toggle implementation (deprecated, unused).
```

## Usage

The dashboard runs in WordPress admin with its own surface wrappers:
- Entry: `index.tsx` → `Layout` → `Outlet` (renders `Inbox`)
- Stage component includes `jp-forms-layout__surface is-stage` wrapper with margins/borders
- Inspector component includes `jp-forms-layout__surface is-inspector` wrapper

*\**: All views get their own dedicated directory while reusable components go into `components/`.
*\*\**: Styles usually live next to the components they're used in.
