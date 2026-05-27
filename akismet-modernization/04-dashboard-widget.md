# Akismet UI Exploration — Plan 4: Dashboard widget + Block

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read [README.md](./README.md) and [00-foundation.md](./00-foundation.md) first — Plan 0 must be merged before this one starts.

**Goal:** Two additive surfaces:
1. A new React-powered wp-admin Dashboard widget showing the **unified threat number** (comments + forms + logins + checkouts + bots + brute-force, summed across all six categories from Plan 2 — real-or-clearly-mocked) plus a deep-link into the experimental Akismet page. Tells the WordPress-trust-layer story on the wp-admin home, not just on the Akismet page. It **coexists** with the legacy `dashboard_stats()` / `rightnow_stats()` "At a Glance" contributions.
2. A **Gutenberg block** that does what `class.akismet-widget.php` does (public-facing spam-comment counter), but for the block editor. Narrow scope on purpose: this is a public counter, and stretching it to "threats blocked" would expose internal numbers that don't belong on a visitor's page. Closes [AKISMET-96](https://linear.app/a8c/issue/AKISMET-96). The classic widget keeps working unchanged.

**Architecture:**
- The Dashboard widget is registered from `class.akismet-experimental.php` (introduced by Plan 0) via `wp_add_dashboard_widget` on the `wp_dashboard_setup` action. Its callback prints a single mount point and enqueues a small React bundle (a separate wp-scripts entry from the main `index.tsx`).
- The block is registered from `class.akismet-experimental.php` via `register_block_type` against the source `block.json`. Server-side render callback emits the spam count number (no view-time JS for the public-facing markup).
- **No edits to `class.akismet-admin.php`, `class.akismet-widget.php`, or `akismet.php` core registration.** Both legacy classes stay untouched.
- Both surfaces gated by `Akismet_Experimental::is_enabled()` (reads `AKISMET_EXPERIMENTAL_UI`).

**Tech Stack:** `@wordpress/scripts` (additional entry), `@wordpress/blocks`, `@wordpress/block-editor`, `@wordpress/components`, `@wordpress/i18n`, `@automattic/charts` (small sparkline).

---

## File structure

```
src/
├── dashboard-widget/
│   ├── index.tsx                        # NEW — entry for the Dashboard widget mount
│   ├── widget.tsx                       # NEW — KPI + sparkline + deep link
│   └── styles.scss                      # NEW
└── block/
    ├── index.ts                         # NEW — entry; registers the block on editor load
    ├── edit.tsx                         # NEW — block editor UI
    ├── save.tsx                         # NEW — dynamic-block stub (returns null)
    ├── render.php                       # NEW — server-side render
    └── block.json                       # NEW — block metadata

class.akismet-experimental.php           # MODIFIED — Plan 4 extends the Plan 0 class to register the dashboard widget + block + widgets.php hint
package.json                             # MODIFIED — add two new wp-scripts entries
build/                                   # additional entry outputs from wp-scripts
```

---

## Tasks

### Task 1: Branch + scope

- [ ] **Step 1: Branch off trunk**

  ```bash
  cd ~/Code/akismet
  git checkout trunk
  git pull
  git checkout -b akismet/experimental-ui-widget-and-block
  ```

### Task 2: Add additional wp-scripts entries

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the `build` and `start` scripts to take multiple entries**

  ```json
  "scripts": {
    "build": "wp-scripts build src/index.tsx src/dashboard-widget/index.tsx src/block/index.ts --output-path=build",
    "start": "wp-scripts start src/index.tsx src/dashboard-widget/index.tsx src/block/index.ts --output-path=build",
    ...
  }
  ```

- [ ] **Step 2: Sanity build** — `npm run build`. Verify three `*.asset.php` files emitted:

  - `build/index.asset.php` (Plan 0)
  - `build/dashboard-widget.asset.php`
  - `build/block.asset.php`

- [ ] **Step 3: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "build: add dashboard-widget + block wp-scripts entries"
  ```

### Task 3: Dashboard widget — React mount (TDD)

**Files:**
- Create: `tests/js/dashboard-widget/widget.test.tsx`
- Create: `src/dashboard-widget/widget.tsx`
- Create: `src/dashboard-widget/index.tsx`

- [ ] **Step 1: Failing test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { DashboardWidget } from '@/dashboard-widget/widget';

  function renderWithClient() {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    render(
      <QueryClientProvider client={ client }>
        <DashboardWidget />
      </QueryClientProvider>
    );
  }

  it( 'renders the unified-threat headline', async () => {
    renderWithClient();
    expect( await screen.findByText( /threats handled/i ) ).toBeInTheDocument();
  } );

  it( 'breaks down by blocked / challenged / passed', async () => {
    renderWithClient();
    expect( await screen.findByText( /blocked/i ) ).toBeInTheDocument();
    expect( screen.getByText( /challenged/i ) ).toBeInTheDocument();
    expect( screen.getByText( /passed/i ) ).toBeInTheDocument();
  } );

  it( 'shows a deep link to the experimental page', async () => {
    renderWithClient();
    const link = await screen.findByRole( 'link', { name: /view details/i } );
    expect( link ).toHaveAttribute( 'href', expect.stringContaining( 'akismet-experimental' ) );
  } );
  ```

- [ ] **Step 2: Implement `<DashboardWidget>`**

  The widget reuses Plan 2's `useCategorySummary` hook to sum across all six categories — same data, same preview-data caveat, smaller surface.

  ```tsx
  import { __, sprintf, _n } from '@wordpress/i18n';
  import { Spinner } from '@wordpress/components';
  import { LineChart } from '@automattic/charts';
  import { useCategorySummary } from '@/hooks/use-category-summary';
  import { CATEGORIES } from '@/routes/overview/category-config';

  function getAkismetSettingsUrl(): string {
    if ( typeof window === 'undefined' ) return '#';
    const root = ( window as unknown as { ajaxurl?: string } ).ajaxurl ?? '/wp-admin/admin-ajax.php';
    const adminBase = root.replace( /\/admin-ajax\.php$/, '' );
    return `${ adminBase }/options-general.php?page=akismet-experimental&tab=overview`;
  }

  function formatNumber( value: number ): string {
    return new Intl.NumberFormat().format( value );
  }

  export function DashboardWidget(): JSX.Element {
    // Six independent hook calls — each one resolves through the same React Query cache,
    // so subsequent renders of the Overview tab hit warm cache (and vice versa).
    const summaries = CATEGORIES.map( ( def ) => useCategorySummary( def.id, '30-days' ) );

    const isLoading = summaries.some( ( s ) => s.isLoading );
    if ( isLoading ) {
      return <Spinner />;
    }

    let blocked = 0, challenged = 0, passed = 0, previewPortion = 0;
    summaries.forEach( ( s ) => {
      if ( ! s.data || s.data.not_active_here ) return;
      blocked    += s.data.blocked;
      challenged += s.data.challenged;
      passed     += s.data.passed;
      if ( s.data.preview ) {
        previewPortion += s.data.blocked + s.data.challenged + s.data.passed;
      }
    } );
    const total = blocked + challenged + passed;

    // For the sparkline, fall back to the comments time-series (only category with one today).
    // When other categories ship real series data, sum them here.
    const commentsSeries = summaries[ 0 ]?.data?.series ?? [];

    return (
      <div className="akismet-dashboard-widget">
        <p className="akismet-dashboard-widget__headline">
          <strong>{ formatNumber( total ) }</strong>
          <span>
            { _n( 'threat handled', 'threats handled', total, 'akismet' ) }{ ' ' }
            { __( 'in the last 30 days', 'akismet' ) }
          </span>
        </p>
        <p className="akismet-dashboard-widget__breakdown">
          { sprintf(
            /* translators: 1: blocked 2: challenged 3: passed-challenge */
            __( '%1$s blocked · %2$s challenged · %3$s passed', 'akismet' ),
            formatNumber( blocked ),
            formatNumber( challenged ),
            formatNumber( passed )
          ) }
        </p>
        { previewPortion > 0 && (
          <p className="akismet-dashboard-widget__caveat">
            { sprintf(
              /* translators: %s: count of preview-data threats. */
              __( '%s from preview-data categories.', 'akismet' ),
              formatNumber( previewPortion )
            ) }
          </p>
        ) }
        <div
          className="akismet-dashboard-widget__sparkline"
          role="img"
          aria-label={ __( 'Comments blocked over the last 30 days', 'akismet' ) }
        >
          <LineChart
            data={ [
              {
                label: __( 'Comments blocked', 'akismet' ),
                data: commentsSeries.map( ( p ) => ( { date: p.date, value: p.blocked } ) ),
              },
            ] }
            height={ 60 }
          />
        </div>
        <a
          className="akismet-dashboard-widget__cta"
          href={ getAkismetSettingsUrl() }
        >
          { __( 'View details →', 'akismet' ) }
        </a>
      </div>
    );
  }
  ```

- [ ] **Step 3: Mount entry**

  Create `src/dashboard-widget/index.tsx`:

  ```tsx
  import { createRoot } from '@wordpress/element';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { ThemeProvider } from '@wordpress/theme';
  import { createQueryClient } from '@/lib/query-client';
  import { DashboardWidget } from './widget';
  import './styles.scss';

  const root = document.getElementById( 'akismet-experimental-dashboard-widget' );
  if ( root ) {
    const queryClient = createQueryClient();
    createRoot( root ).render(
      <ThemeProvider>
        <QueryClientProvider client={ queryClient }>
          <DashboardWidget />
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  ```

- [ ] **Step 4: Styles**

  ```scss
  .akismet-dashboard-widget {
      display: grid;
      gap: var( --wp-components-spacing-3, 12px );
  }

  .akismet-dashboard-widget__headline {
      display: flex;
      align-items: baseline;
      gap: var( --wp-components-spacing-2, 8px );

      strong {
          font-size: 28px;
      }
  }

  .akismet-dashboard-widget__breakdown {
      color: var( --wp-admin-theme-color, #2271b1 );
      margin: 0;
      font-size: 13px;
  }

  .akismet-dashboard-widget__caveat {
      color: var( --wp-components-color-foreground-muted, #757575 );
      font-size: 11px;
      margin: 0;
  }

  .akismet-dashboard-widget__sparkline {
      min-height: 60px;
  }

  .akismet-dashboard-widget__cta {
      justify-self: end;
  }
  ```

- [ ] **Step 5: Run + commit**

### Task 4: PHP — register the dashboard widget from `Akismet_Experimental`

**Files:**
- Modify: `class.akismet-experimental.php` (extend the class introduced in Plan 0)

The legacy `dashboard_stats()` + `rightnow_stats()` contributions in `class.akismet-admin.php` stay exactly as they are. The new dashboard widget appears as a separate item on the WP admin dashboard — both render. Reviewers will compare them side-by-side.

- [ ] **Step 1: Extend `Akismet_Experimental::init()`**

  In `class.akismet-experimental.php`, add to the `init()` body (already gated on `is_enabled()` from Plan 0):

  ```php
  add_action( 'wp_dashboard_setup', array( __CLASS__, 'register_dashboard_widget' ) );
  ```

- [ ] **Step 2: Implement the registration + mount inline**

  Add to `Akismet_Experimental`:

  ```php
  public static function register_dashboard_widget() {
      wp_add_dashboard_widget(
          'akismet_experimental_dashboard_widget',
          __( 'Akismet — Experimental', 'akismet' ),
          array( __CLASS__, 'render_dashboard_widget' )
      );
  }

  public static function render_dashboard_widget() {
      $asset_file = AKISMET__PLUGIN_DIR . 'build/dashboard-widget.asset.php';
      if ( ! file_exists( $asset_file ) ) {
          echo esc_html__( 'Akismet experimental dashboard widget assets are missing — run `npm run build`.', 'akismet' );
          return;
      }
      $asset = include $asset_file;

      wp_enqueue_script(
          'akismet-experimental-dashboard-widget',
          plugins_url( 'build/dashboard-widget.js', __FILE__ ),
          $asset['dependencies'],
          $asset['version'],
          true
      );
      if ( file_exists( AKISMET__PLUGIN_DIR . 'build/dashboard-widget.css' ) ) {
          wp_enqueue_style(
              'akismet-experimental-dashboard-widget',
              plugins_url( 'build/dashboard-widget.css', __FILE__ ),
              array(),
              $asset['version']
          );
      }

      $blackbox = self::blackbox_client_config();

      wp_localize_script( 'akismet-experimental-dashboard-widget', 'akismetExperimental', array(
          'apiNonce'      => wp_create_nonce( 'wp_rest' ),
          'apiRoot'       => esc_url_raw( rest_url() ),
          'jetpackActive' => class_exists( 'Jetpack' ),
          'pageSlug'      => self::PAGE_SLUG,
          'blackbox'      => $blackbox,
      ) );

      echo '<div id="akismet-experimental-dashboard-widget"></div>';
  }
  ```

- [ ] **Step 3: Manual verify in sandbox**

  With `AKISMET_EXPERIMENTAL_UI` defined → visit `wp-admin/index.php` → "Akismet — Experimental" widget renders with KPI + sparkline + "View details" link. The legacy "At a Glance" + "Activity" contributions ALSO still render (intentional — they coexist for the exploration).

  Without the constant → the experimental widget is not registered; legacy contributions render exactly as before.

- [ ] **Step 4: Commit**

  ```bash
  git add wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php
  git commit -m "akismet: experimental wp-admin dashboard widget"
  ```

### Task 5: Block — define `block.json`

**Files:**
- Create: `src/block/block.json`

- [ ] **Step 1: Write metadata**

  ```json
  {
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "akismet/spam-counter",
    "title": "Spam Counter",
    "category": "widgets",
    "icon": "shield-alt",
    "description": "Show how many spam comments Akismet has blocked.",
    "keywords": [ "akismet", "spam", "counter" ],
    "version": "1.0.0",
    "supports": {
      "align": [ "left", "center", "right", "wide" ],
      "spacing": { "margin": true, "padding": true },
      "color": { "background": true, "text": true }
    },
    "attributes": {
      "label": {
        "type": "string",
        "default": "spam comments blocked by Akismet"
      },
      "showCount": {
        "type": "boolean",
        "default": true
      }
    },
    "textdomain": "akismet",
    "editorScript": "akismet-spam-counter-editor",
    "render": "file:./render.php"
  }
  ```

  > The `editorScript` value is a pre-registered handle (registered in Task 7 against the wp-scripts-built `build/block.js`). `render` is resolved against `block.json`'s own directory — i.e., `src/block/render.php` — at render time. No build-time file-copy plugin needed.

### Task 6: Block — editor UI (TDD-light)

**Files:**
- Create: `src/block/index.ts`
- Create: `src/block/edit.tsx`
- Create: `src/block/save.tsx`
- Create: `src/block/render.php`

- [ ] **Step 1: Implement `index.ts`**

  ```ts
  import { registerBlockType } from '@wordpress/blocks';
  import metadata from './block.json';
  import { Edit } from './edit';
  import { save } from './save';

  registerBlockType( metadata.name, {
    edit: Edit,
    save,
  } );
  ```

- [ ] **Step 2: Implement `edit.tsx`**

  ```tsx
  import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
  import { PanelBody, ToggleControl, TextControl } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';

  type Attributes = {
    label: string;
    showCount: boolean;
  };

  type Props = {
    attributes: Attributes;
    setAttributes: ( patch: Partial< Attributes > ) => void;
  };

  export function Edit( { attributes, setAttributes }: Props ): JSX.Element {
    const blockProps = useBlockProps();
    return (
      <>
        <InspectorControls>
          <PanelBody title={ __( 'Display options', 'akismet' ) }>
            <ToggleControl
              label={ __( 'Show count', 'akismet' ) }
              checked={ attributes.showCount }
              onChange={ ( checked ) => setAttributes( { showCount: checked } ) }
              __nextHasNoMarginBottom
            />
            <TextControl
              label={ __( 'Label', 'akismet' ) }
              value={ attributes.label }
              onChange={ ( value ) => setAttributes( { label: value } ) }
              __nextHasNoMarginBottom
              __next40pxDefaultSize
            />
          </PanelBody>
        </InspectorControls>
        <div { ...blockProps }>
          { attributes.showCount && <strong>{ '—' }</strong> }
          <span>{ ' ' }{ attributes.label }</span>
        </div>
      </>
    );
  }
  ```

- [ ] **Step 3: Implement `save.tsx` (dynamic block, returns null)**

  ```tsx
  export function save(): null {
    return null;
  }
  ```

- [ ] **Step 4: Implement `render.php` (server-side render)**

  ```php
  <?php
  /**
   * Server-side render for the akismet/spam-counter block.
   *
   * Variables provided by render_block_callback (via block.json): $attributes, $content, $block.
   *
   * @package Akismet
   */

  defined( 'ABSPATH' ) || exit;

  $label      = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
  $show_count = ! empty( $attributes['showCount'] );
  $count      = (int) get_option( 'akismet_spam_count', 0 );

  $wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
      ? get_block_wrapper_attributes()
      : '';
  ?>
  <div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — get_block_wrapper_attributes returns pre-escaped output. ?>>
      <?php if ( $show_count ) : ?>
          <strong><?php echo esc_html( number_format_i18n( $count ) ); ?></strong>
      <?php endif; ?>
      <span><?php echo esc_html( $label ); ?></span>
  </div>
  ```

### Task 7: Block — PHP registration from `Akismet_Experimental`

**Files:**
- Modify: `class.akismet-experimental.php` (extend the class introduced in Plan 0)
- Modify: `src/block/block.json` (point `editorScript` at the wp-scripts asset handle)

We register the block **from the source `block.json`** and point its asset references at the built bundle. This avoids any "did wp-scripts copy `block.json` + `render.php` into `build/`?" guesswork — the canonical path is the source dir, and only the script/style references resolve into `build/`. **`akismet.php` is not touched** — the registration lives in `Akismet_Experimental`.

- [ ] **Step 1: Update `block.json` to reference the built script handle**

  Replace the `editorScript` line in `src/block/block.json` with the wp-scripts-generated handle (we register the built script explicitly in step 2):

  ```json
  "editorScript": "akismet-spam-counter-editor",
  "render": "file:./render.php"
  ```

- [ ] **Step 2: Register the block from `Akismet_Experimental`**

  In `class.akismet-experimental.php`, add to `init()`:

  ```php
  add_action( 'init', array( __CLASS__, 'register_blocks' ) );
  ```

  And implement:

  ```php
  public static function register_blocks() {
      $asset_file = AKISMET__PLUGIN_DIR . 'build/block.asset.php';
      if ( file_exists( $asset_file ) ) {
          $asset = include $asset_file;
          wp_register_script(
              'akismet-spam-counter-editor',
              plugins_url( 'build/block.js', __FILE__ ),
              $asset['dependencies'],
              $asset['version'],
              true
          );
      }

      register_block_type( AKISMET__PLUGIN_DIR . 'src/block/block.json' );
  }
  ```

  > `register_block_type()` reads `block.json` from the source tree, resolves `file:./render.php` against that same directory (so `src/block/render.php` is what runs server-side), and looks up `editorScript` by its registered handle. The pre-registered handle points at the built file in `build/block.js`. Nothing has to be copied into `build/` beyond what wp-scripts emits. Since `Akismet_Experimental::init()` already early-returns when the constant is undefined, no extra gating is needed inside this method.

- [ ] **Step 3: Manual verification**

  - With `AKISMET_EXPERIMENTAL_UI` defined: open the block editor and search for "spam counter" → block appears in the inserter.
  - Insert it → editor preview shows label + dash placeholder.
  - Toggle "Show count" off and on, edit the label.
  - Publish a post containing it → front-end renders the formatted count.
  - Without the constant: block is not registered (search yields no result; previously inserted blocks render the fallback "block not found" placeholder — acceptable for an opt-in track).

- [ ] **Step 4: Commit**

  ```bash
  git add wp-content/mu-plugins/akismet-3.0/src/block \
          wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php
  git commit -m "akismet: experimental spam-counter block"
  ```

### Task 8: Deprecate-hint for the classic widget (optional, internal)

**Files:**
- Modify: `class.akismet-experimental.php`

The legacy classic widget (`class.akismet-widget.php`) keeps working. We don't touch it. Inside the exploration we add a soft admin notice on `widgets.php` suggesting the new block alternative — only when `AKISMET_EXPERIMENTAL_UI` is on, only for internal users testing the prototype.

- [ ] **Step 1: Add an admin notice from `Akismet_Experimental::init()`**

  Add to `init()`:

  ```php
  add_action( 'admin_notices', array( __CLASS__, 'maybe_show_widget_deprecation_notice' ) );
  ```

  And implement:

  ```php
  public static function maybe_show_widget_deprecation_notice() {
      $screen = get_current_screen();
      if ( ! $screen || $screen->id !== 'widgets' ) {
          return;
      }
      ?>
      <div class="notice notice-info is-dismissible">
          <p>
              <?php esc_html_e(
                  'An Akismet "Spam Counter" block is available in the block editor as part of the experimental UI.',
                  'akismet'
              ); ?>
          </p>
      </div>
      <?php
  }
  ```

  This is intentionally a soft nudge — no auto-migration. The classic widget keeps working unchanged.

- [ ] **Step 2: Commit**

  ```bash
  git add wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php
  git commit -m "akismet: widgets.php deprecation hint (experimental only)"
  ```

### Task 9: Manual + visual QA

- [ ] **Step 1: Dashboard widget visible at `wp-admin/index.php`**

  - With ≥30 days of data: unified threat numbers render with the breakdown (blocked / challenged / passed) and the preview-data caveat when applicable.
  - With a brand-new install (no spam, no Blackbox aggregates): the widget renders zeros plus the preview caveat (since five of six categories are mocked).
  - Without an API key: the widget renders a CTA to connect (extend `<DashboardWidget>` to short-circuit on `useApiKey()` if needed).
  - Legacy "At a Glance" + "Activity" contributions still render alongside.

- [ ] **Step 2: Block in the editor + on the frontend**

  - Insert, configure, publish, view: count formats correctly per locale.
  - Inspector controls: "Show count" toggle, label edit.
  - Spacing/color block-supports work (padding, background-color).

- [ ] **Step 3: Screenshot the four states (widget connected/disconnected, block editor, block frontend)**

### Task 10: PR

- [ ] **Step 1: Push + open**

  ```bash
  git push -u origin akismet/experimental-ui-widget-and-block
  gh pr create --title "akismet: experimental UI — unified dashboard widget + spam-counter block" --body "..."
  ```

  Body template:

  ```
  ## Summary

  - **Dashboard widget**: new React-powered "Akismet — Experimental" widget that surfaces the unified-threat headline (sum across all six Plan 2 categories) plus a comments sparkline and a deep-link into the experimental Akismet page. Coexists with the legacy "At a Glance" + "Activity" contributions; doesn't replace them.
  - **Block**: new `akismet/spam-counter` block. Narrowly scoped to public-facing spam-comment counts (not unified threat numbers — those are internal). Closes [AKISMET-96](https://linear.app/a8c/issue/AKISMET-96).
  - Both registered from `class.akismet-experimental.php`. No edits to `class.akismet-admin.php`, `class.akismet-widget.php`, or `akismet.php`.

  ## Test plan

  - [ ] Dashboard widget renders with and without an API key
  - [ ] Dashboard widget shows the preview-data caveat when any of the six categories is mocked
  - [ ] Block inserts, configures, and renders on the frontend
  - [ ] Legacy classic widget still functional in the legacy widgets screen
  - [ ] Spacing/color block-supports applied correctly
  ```

---

## Self-review checklist

- Does the dashboard widget gracefully handle "no API key" without throwing? (Extend `<DashboardWidget>` to render a connect CTA if `useApiKey().data?.valid === false`.)
- Is the block's render fallback safe when `akismet_spam_count` option is missing? (Yes — `(int) get_option(...)` defaults to 0.)
- Is the block's `apiVersion: 3` supported by the WP minimum version Akismet declares? (Check `Requires at least:` in `readme.txt`; bump if needed.)
- Does `register_block_type` resolve `file:./render.php` correctly when called with a source-tree path? (Yes — Block Editor Handbook: "`render` is a relative path resolved against the `block.json` directory.")
- Does the deprecation notice respect dismissal (`is-dismissible`)?
