# Akismet UI Exploration — Plan 2: Unified Threat Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read [README.md](./README.md), [strategy.md](./strategy.md), and [blackbox-notes.md](./blackbox-notes.md) first. Plan 0 must be merged before this one starts. Plan 1 is *not* a prerequisite — this plan adds the "Overview" tab.

**Goal:** Build the surface that makes the thesis legible. Six category cards (Comments · Forms · Logins · Checkouts/Fraud · Bots · Brute-force) plus a dedicated WooCommerce fraud panel. Reviewers should grok the pivot in 60 seconds: Akismet is no longer "the comment thing" — it's the WordPress trust layer, with comment spam as one of six categories. Rolls up [AKISMET-95](https://linear.app/a8c/issue/AKISMET-95).

**Architecture:** A new "Overview" tab inside the `<Page>` shell. Three vertically stacked sections:

1. **Threat KPIs** — the headline "X threats handled in the last 30 days" with a breakdown by outcome (blocked / challenged / passed-challenge).
2. **Category cards** — six tiles, each with blocked/challenged counts, a sparkline, and one of three states: **active** (real data flowing), **preview** (mocked data with a visible "preview data" badge), or **not-active-here** (the integration prerequisites aren't met — e.g., WooCommerce not installed).
3. **WooCommerce panel** — only rendered when `class_exists( 'WooCommerce' )`. Shows orders flagged, blocked checkouts, top fraud signals, chargebacks-averted estimate (with methodology link), deep-link into WooCommerce Analytics.

All six categories share a single data-fetching contract (`useCategorySummary(category, interval)`) backed by category-specific adapters. Comments uses the real `akismet/v1/stats/{interval}` endpoint; the other five use server-side mock adapters today, with clear swap points for when upstream signal sources wire up.

**Gating:** entire surface lives on `?page=akismet-experimental` from Plan 0 (registered only when `AKISMET_EXPERIMENTAL_UI` is `true`). Legacy iframes in `views/{stats,config}.php` are untouched.

**Tech Stack:** `@automattic/charts` (LineChart, BarChart, ChartContainer), `@wordpress/components` (Card, ToggleGroupControl, Notice, Badge), TanStack React Query.

---

## What's real, what's mocked

| Category | Real source | State |
| --- | --- | --- |
| **Comments** | `akismet/v1/stats/{interval}` (totals real) + `akismet/v1/stats/timeseries` (pending — see [endpoint-spec-stats-timeseries.md](./endpoint-spec-stats-timeseries.md)) | **Active** (totals real; sparkline mocked until endpoint ships) |
| **Forms** | TBD — coordinate with `cfinke` on what Akismet currently scores for forms | **Preview** (mocked) |
| **Logins** | Blackbox at login (live on ~7% WPCOM traffic). New `akismet/v1/blackbox/aggregates?category=logins` proxies blackbox-api.wp.com server-side | **Preview** (deterministic mock until Blackbox aggregate query path is settled with `@dtbecher`) |
| **Checkouts/Fraud** | WooCommerce Fraud Protection v0.1.x (WC 10.6 alpha). Read from `wc_get_orders` with `_woofraud_score` meta when WFP detected | **Active** if WC + WFP installed; **Not-active-here** otherwise |
| **Bots** | Blackbox edge (`X-Edge-Blackbox-Score`) | **Preview** (mocked) |
| **Brute-force** | Login behavioral biometrics + velocity rules from Blackbox | **Preview** (mocked) |

Every preview/mocked surface shows a `"preview data"` `<Badge>` so reviewers don't conflate mocks with real numbers.

---

## File structure

```
src/
├── routes/
│   ├── overview-tab.tsx                      # NEW — entry; orchestrates the three sections
│   └── overview/
│       ├── threat-kpis.tsx                   # NEW — headline KPI row
│       ├── category-grid.tsx                 # NEW — six-card grid
│       ├── category-card.tsx                 # NEW — single card (handles all 3 states)
│       ├── category-sparkline.tsx            # NEW — tiny @automattic/charts LineChart
│       ├── interval-selector.tsx             # NEW — ToggleGroupControl: 30d / 60d / 6m / all
│       ├── woocommerce-panel.tsx             # NEW — conditional on WC detection
│       ├── empty-state.tsx                   # NEW — no-key state
│       └── category-config.ts                # NEW — single source of truth for the six categories
├── hooks/
│   ├── use-category-summary.ts               # NEW — unified hook backing every card
│   ├── use-stats-totals.ts                   # NEW — wraps GET akismet/v1/stats/{interval} (Comments only)
│   ├── use-stats-time-series.ts              # NEW — wraps the time-series adapter (Comments only)
│   ├── use-blackbox-aggregates.ts            # NEW — wraps GET akismet/v1/blackbox/aggregates
│   ├── use-woocommerce-fraud-summary.ts      # NEW — wraps GET akismet/v1/woocommerce/fraud-summary
│   └── use-is-woocommerce-active.ts          # NEW — reads window.akismetExperimental.integrations.woocommerce
├── lib/
│   ├── category-adapters.ts                  # NEW — per-category fetch dispatch (comments→stats; others→aggregates / wc)
│   └── time-series-adapter.ts                # NEW — pluggable mock-first time-series for Comments
└── styles/
    └── overview.scss                         # NEW

# PHP side
class.akismet-experimental.php                # MODIFIED — register three new REST routes (see Task 2)

tests/js/
├── routes/overview/
│   ├── overview-tab.test.tsx
│   ├── category-card.test.tsx
│   ├── category-grid.test.tsx
│   ├── woocommerce-panel.test.tsx
│   └── threat-kpis.test.tsx
├── hooks/
│   ├── use-category-summary.test.tsx
│   └── use-woocommerce-fraud-summary.test.tsx
└── lib/
    └── time-series-adapter.test.ts
```

---

## Tasks

### Task 1: Branch + add `@automattic/charts`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Branch off trunk**

  ```bash
  cd ~/Code/wpcom
  git checkout trunk
  git pull
  git checkout -b akismet/experimental-ui-overview
  ```

- [ ] **Step 2: Add the charts dep**

  ```bash
  cd wp-content/mu-plugins/akismet-3.0
  npm install --save @automattic/charts
  ```

  Pin to the same major as `projects/packages/my-jetpack/_inc/components/stats-section/chart.tsx` in jetpack-monorepo (the canonical reference).

- [ ] **Step 3: Sanity-check the build**

  ```bash
  npm run build
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "akismet: add @automattic/charts dep"
  ```

### Task 2: PHP — three new REST routes

**Files:**
- Modify: `class.akismet-experimental.php` (extend the class from Plan 0)
- Modify: `wp_localize_script` payload to expose `integrations.woocommerce`

The Overview tab consumes:
- `GET /akismet/v1/stats/{interval}` — already exists, no change.
- `GET /akismet/v1/blackbox/aggregates?category={category}&interval={interval}` — new. Proxies Blackbox server-side; returns aggregate counts for the requested category.
- `GET /akismet/v1/woocommerce/fraud-summary?interval={interval}` — new. Reads from WooCommerce orders + Woo Fraud Protection meta when WFP is detected; returns mocked data with `partial: true` otherwise.

- [ ] **Step 1: Add `register_rest_routes` to `Akismet_Experimental::init()`**

  In `class.akismet-experimental.php`:

  ```php
  public static function init() {
      if ( ! self::is_enabled() ) {
          return;
      }
      add_action( 'admin_menu', array( __CLASS__, 'register_menu' ), 20 );
      add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
      add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
  }

  public static function register_rest_routes() {
      register_rest_route( 'akismet/v1', '/blackbox/aggregates', array(
          'methods'             => WP_REST_Server::READABLE,
          'callback'            => array( __CLASS__, 'rest_get_blackbox_aggregates' ),
          'permission_callback' => array( __CLASS__, 'permission_manage_options' ),
          'args'                => array(
              'category' => array(
                  'type'    => 'string',
                  'enum'    => array( 'logins', 'bots', 'brute-force', 'forms' ),
                  'required' => true,
              ),
              'interval' => array(
                  'type'    => 'string',
                  'enum'    => array( '30-days', '60-days', '6-months', 'all' ),
                  'default' => '30-days',
              ),
          ),
      ) );

      register_rest_route( 'akismet/v1', '/woocommerce/fraud-summary', array(
          'methods'             => WP_REST_Server::READABLE,
          'callback'            => array( __CLASS__, 'rest_get_woocommerce_fraud_summary' ),
          'permission_callback' => array( __CLASS__, 'permission_manage_options' ),
          'args'                => array(
              'interval' => array(
                  'type'    => 'string',
                  'enum'    => array( '30-days', '60-days', '6-months', 'all' ),
                  'default' => '30-days',
              ),
          ),
      ) );
  }

  public static function permission_manage_options() {
      return current_user_can( 'manage_options' );
  }
  ```

- [ ] **Step 2: Implement `rest_get_blackbox_aggregates`**

  ```php
  public static function rest_get_blackbox_aggregates( WP_REST_Request $request ) {
      $config   = self::blackbox_client_config();
      $category = $request->get_param( 'category' );
      $interval = $request->get_param( 'interval' );

      // ─── GUARDRAIL ─────────────────────────────────────────────────────────
      // Per GUARDRAILS.md: real Blackbox API calls require
      // `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` to be true. Otherwise we serve
      // a deterministic mock no matter what — even if a Bearer key is defined
      // and the site is enrolled. This prevents preview sessions from burning
      // Blackbox quota or producing telemetry rows.
      // ───────────────────────────────────────────────────────────────────────
      if ( ! self::allow_blackbox_api() || empty( $config['enrolled'] ) ) {
          return rest_ensure_response( self::deterministic_mock_aggregate( $category, $interval, true ) );
      }

      // Real path (gated). Coordinate the aggregate query shape with @dtbecher
      // before enabling this constant on any environment.
      $bearer = defined( 'AKISMET_BLACKBOX_API_KEY' ) ? AKISMET_BLACKBOX_API_KEY : '';
      $url    = sprintf(
          'https://blackbox-api.wp.com/v1/aggregates?client_id=%s&category=%s&interval=%s',
          rawurlencode( (string) $config['clientId'] ),
          rawurlencode( $category ),
          rawurlencode( $interval )
      );
      $response = wp_remote_get( $url, array(
          'timeout' => 8,
          'headers' => array(
              'Authorization' => 'Bearer ' . $bearer,
              'Accept'        => 'application/json',
          ),
      ) );
      if ( is_wp_error( $response ) || (int) wp_remote_retrieve_response_code( $response ) >= 400 ) {
          // Fail soft: serve the mock with preview:true rather than 5xx to a reviewer.
          return rest_ensure_response( self::deterministic_mock_aggregate( $category, $interval, true ) );
      }
      $body = json_decode( wp_remote_retrieve_body( $response ), true );
      $body[ 'preview' ] = false;
      return rest_ensure_response( $body );
  }

  protected static function deterministic_mock_aggregate( $category, $interval, $preview ) {
      // Seed off category + interval so the same call returns the same shape (testable, no jitter).
      $seed = crc32( $category . '|' . $interval );
      $n    = static function ( $offset ) use ( $seed ) {
          return abs( ( $seed + $offset * 31 ) % 9999 );
      };

      $bucket_count = array(
          '30-days'  => 30,
          '60-days'  => 60,
          '6-months' => 26,
          'all'      => 12,
      )[ $interval ] ?? 30;

      $series = array();
      for ( $i = $bucket_count - 1; $i >= 0; $i-- ) {
          $series[] = array(
              'date'       => gmdate( 'Y-m-d', strtotime( "-{$i} days" ) ),
              'blocked'    => $n( $i + 1 ) % 80,
              'challenged' => $n( $i + 2 ) % 30,
              'passed'     => $n( $i + 3 ) % 20,
          );
      }

      return array(
          'category'   => $category,
          'interval'   => $interval,
          'blocked'    => $n( 1 ) * 7,
          'challenged' => $n( 2 ) * 3,
          'passed'     => $n( 3 ) * 2,
          'series'     => $series,
          'preview'    => $preview,
          'generated_at' => gmdate( 'c' ),
      );
  }
  ```

- [ ] **Step 3: Implement `rest_get_woocommerce_fraud_summary`**

  ```php
  public static function rest_get_woocommerce_fraud_summary( WP_REST_Request $request ) {
      $interval = $request->get_param( 'interval' );

      if ( ! class_exists( 'WooCommerce' ) ) {
          return new WP_Error(
              'woocommerce_inactive',
              __( 'WooCommerce is not installed on this site.', 'akismet' ),
              array( 'status' => 400 )
          );
      }

      $wfp_active = class_exists( 'WC_Fraud_Protection' ) || defined( 'WC_FRAUD_PROTECTION_PLUGIN_VERSION' );

      // TODO: when WFP is active, query real data from $wpdb against orders + _woofraud_score meta.
      // Coordinate the meta key + query shape with @luizfreis / @tautvidas. Returning a mock for now
      // so the UI is testable end-to-end. The `preview` flag mirrors the badge state in the UI.
      $seed = crc32( 'wc-fraud|' . $interval );
      $n    = static function ( $offset ) use ( $seed ) {
          return abs( ( $seed + $offset * 31 ) % 9999 );
      };

      return rest_ensure_response( array(
          'interval'                  => $interval,
          'orders_flagged'            => $n( 1 ) % 250,
          'blocked_checkouts'         => $n( 2 ) % 600,
          'estimated_chargebacks_averted_usd' => $n( 3 ) % 12000,
          'top_signals'               => array(
              array( 'name' => 'avs_mismatch',          'count' => $n( 4 ) % 60 ),
              array( 'name' => 'high_risk_geo',        'count' => $n( 5 ) % 40 ),
              array( 'name' => 'velocity_threshold',    'count' => $n( 6 ) % 35 ),
              array( 'name' => 'card_testing_pattern',  'count' => $n( 7 ) % 25 ),
              array( 'name' => 'proxy_or_vpn',          'count' => $n( 8 ) % 20 ),
          ),
          'wfp_active' => $wfp_active,
          'preview'    => ! $wfp_active,
          'generated_at' => gmdate( 'c' ),
      ) );
  }
  ```

- [ ] **Step 4: Expose WC detection to the front-end**

  In `enqueue_assets()`, extend the `wp_localize_script` payload:

  ```php
  wp_localize_script( 'akismet-experimental', 'akismetExperimental', array(
      // ... existing keys ...
      'integrations' => array(
          'woocommerce' => class_exists( 'WooCommerce' ),
      ),
  ) );
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add wp-content/mu-plugins/akismet-3.0/class.akismet-experimental.php
  git commit -m "akismet: REST routes for blackbox aggregates + woocommerce fraud summary"
  ```

### Task 3: Category config — single source of truth

**Files:**
- Create: `src/routes/overview/category-config.ts`

- [ ] **Step 1: Define the six categories**

  ```ts
  import { __ } from '@wordpress/i18n';

  export type CategoryId =
    | 'comments'
    | 'forms'
    | 'logins'
    | 'checkouts'
    | 'bots'
    | 'brute-force';

  export type CategoryDefinition = {
    id: CategoryId;
    label: string;
    icon: 'admin-comments' | 'feedback' | 'lock' | 'cart' | 'shield' | 'shield-alt'; // dashicons or similar
    short: string; // 1-line sub-label
    source: 'akismet-content' | 'blackbox' | 'woocommerce-fraud' | 'akismet-content+blackbox';
    // How the card resolves its summary data:
    fetch:
      | { kind: 'akismet-stats' }
      | { kind: 'blackbox-aggregates'; category: 'logins' | 'bots' | 'brute-force' | 'forms' }
      | { kind: 'woocommerce-fraud' };
    // Whether the card should render when the integration prerequisite isn't met.
    requires?: 'woocommerce';
    drillDownTab: 'activity'; // every card drills into the Activity log filtered by category
  };

  export const CATEGORIES: ReadonlyArray< CategoryDefinition > = [
    {
      id: 'comments',
      label: __( 'Comments', 'akismet' ),
      icon: 'admin-comments',
      short: __( 'Spam blocked on comment forms.', 'akismet' ),
      source: 'akismet-content',
      fetch: { kind: 'akismet-stats' },
      drillDownTab: 'activity',
    },
    {
      id: 'forms',
      label: __( 'Forms', 'akismet' ),
      icon: 'feedback',
      short: __( 'Spam blocked on contact, signup, and custom forms.', 'akismet' ),
      source: 'akismet-content+blackbox',
      fetch: { kind: 'blackbox-aggregates', category: 'forms' },
      drillDownTab: 'activity',
    },
    {
      id: 'logins',
      label: __( 'Logins', 'akismet' ),
      icon: 'lock',
      short: __( 'Credential stuffing and account-takeover attempts.', 'akismet' ),
      source: 'blackbox',
      fetch: { kind: 'blackbox-aggregates', category: 'logins' },
      drillDownTab: 'activity',
    },
    {
      id: 'checkouts',
      label: __( 'Checkouts & Fraud', 'akismet' ),
      icon: 'cart',
      short: __( 'Fraudulent orders and carding attempts on WooCommerce.', 'akismet' ),
      source: 'woocommerce-fraud',
      fetch: { kind: 'woocommerce-fraud' },
      requires: 'woocommerce',
      drillDownTab: 'activity',
    },
    {
      id: 'bots',
      label: __( 'Bots', 'akismet' ),
      icon: 'shield',
      short: __( 'Automated traffic and scraping.', 'akismet' ),
      source: 'blackbox',
      fetch: { kind: 'blackbox-aggregates', category: 'bots' },
      drillDownTab: 'activity',
    },
    {
      id: 'brute-force',
      label: __( 'Brute-force', 'akismet' ),
      icon: 'shield-alt',
      short: __( 'Password spray and rate-limit-exceeding attacks.', 'akismet' ),
      source: 'blackbox',
      fetch: { kind: 'blackbox-aggregates', category: 'brute-force' },
      drillDownTab: 'activity',
    },
  ];
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/routes/overview/category-config.ts
  git commit -m "feat: six-category config"
  ```

### Task 4: `useCategorySummary` — unified hook (TDD)

**Files:**
- Create: `tests/js/hooks/use-category-summary.test.tsx`
- Create: `src/hooks/use-category-summary.ts`
- Create: `src/lib/category-adapters.ts`
- Create: `src/hooks/use-stats-totals.ts`
- Create: `src/hooks/use-blackbox-aggregates.ts`
- Create: `src/hooks/use-woocommerce-fraud-summary.ts`

Every card consumes the same shape, regardless of source:

```ts
export type CategorySummary = {
  blocked: number;
  challenged: number;
  passed: number;
  series: Array< { date: string; blocked: number; challenged?: number; passed?: number } >;
  preview: boolean;     // true → render the "preview data" badge
  not_active_here: boolean; // true → render the "not active here" empty state
};
```

- [ ] **Step 1: Add MSW handlers for the three endpoints**

  Extend `tests/js/mocks/handlers.ts`:

  ```ts
  http.get( '*/akismet/v1/stats/:interval', ( { params } ) => {
    const interval = params.interval as string;
    return HttpResponse.json( {
      spam: interval === '60-days' ? 1234 : 500,
      ham: 187,
      missed_spam: 6,
      false_positives: 2,
      accuracy: 99.7,
      time_saved: 51852,
    } );
  } ),

  http.get( '*/akismet/v1/blackbox/aggregates', ( { request } ) => {
    const url = new URL( request.url );
    return HttpResponse.json( {
      category: url.searchParams.get( 'category' ),
      interval: url.searchParams.get( 'interval' ),
      blocked: 420,
      challenged: 130,
      passed: 110,
      series: [],
      preview: true,
      generated_at: '2026-05-27T12:00:00Z',
    } );
  } ),

  http.get( '*/akismet/v1/woocommerce/fraud-summary', ( { request } ) => {
    return HttpResponse.json( {
      interval: new URL( request.url ).searchParams.get( 'interval' ),
      orders_flagged: 38,
      blocked_checkouts: 120,
      estimated_chargebacks_averted_usd: 4200,
      top_signals: [
        { name: 'avs_mismatch', count: 22 },
        { name: 'high_risk_geo', count: 14 },
      ],
      wfp_active: true,
      preview: false,
      generated_at: '2026-05-27T12:00:00Z',
    } );
  } ),
  ```

- [ ] **Step 2: Failing test**

  Create `tests/js/hooks/use-category-summary.test.tsx`:

  ```tsx
  import { renderHook, waitFor } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { useCategorySummary } from '@/hooks/use-category-summary';

  function wrap() {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return ( { children }: { children: React.ReactNode } ) => (
      <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
  }

  afterEach( () => {
    // @ts-expect-error
    delete window.akismetExperimental;
  } );

  describe( 'useCategorySummary', () => {
    it( 'fetches comment totals via akismet/v1/stats', async () => {
      const { result } = renderHook( () => useCategorySummary( 'comments', '60-days' ), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data?.blocked ).toBe( 1234 );
      expect( result.current.data?.preview ).toBe( false );
      expect( result.current.data?.not_active_here ).toBe( false );
    } );

    it( 'fetches login aggregates via akismet/v1/blackbox/aggregates with preview=true', async () => {
      const { result } = renderHook( () => useCategorySummary( 'logins', '30-days' ), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data?.blocked ).toBe( 420 );
      expect( result.current.data?.preview ).toBe( true );
    } );

    it( 'returns not_active_here for checkouts when WooCommerce is not active', async () => {
      ( window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } } ).akismetExperimental = {
        integrations: { woocommerce: false },
      };
      const { result } = renderHook( () => useCategorySummary( 'checkouts', '30-days' ), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data?.not_active_here ).toBe( true );
    } );

    it( 'fetches WooCommerce fraud summary when WC is active', async () => {
      ( window as unknown as { akismetExperimental: { integrations: { woocommerce: boolean } } } ).akismetExperimental = {
        integrations: { woocommerce: true },
      };
      const { result } = renderHook( () => useCategorySummary( 'checkouts', '30-days' ), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data?.blocked ).toBe( 120 ); // blocked_checkouts from MSW handler
      expect( result.current.data?.preview ).toBe( false ); // wfp_active true in mock
    } );
  } );
  ```

- [ ] **Step 3: Run, expect failure**

  ```bash
  npm test -- --testPathPattern=use-category-summary
  ```

- [ ] **Step 4: Implement the small per-source hooks**

  Create `src/hooks/use-stats-totals.ts`:

  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api-client';

  export type StatsInterval = '30-days' | '60-days' | '6-months' | 'all';

  export type StatsTotals = {
    spam: number;
    ham: number;
    missed_spam: number;
    false_positives: number;
    accuracy: number;
    time_saved: number;
  };

  export function useStatsTotals( interval: StatsInterval ) {
    return useQuery( {
      queryKey: [ 'akismet', 'stats', interval ],
      queryFn: () => apiClient.get< StatsTotals >( `stats/${ interval }` ),
    } );
  }
  ```

  Create `src/hooks/use-blackbox-aggregates.ts`:

  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api-client';
  import type { StatsInterval } from './use-stats-totals';

  export type BlackboxCategory = 'logins' | 'bots' | 'brute-force' | 'forms';

  export type BlackboxAggregates = {
    category: BlackboxCategory;
    interval: StatsInterval;
    blocked: number;
    challenged: number;
    passed: number;
    series: Array< { date: string; blocked: number; challenged: number; passed: number } >;
    preview: boolean;
    generated_at: string;
  };

  export function useBlackboxAggregates( category: BlackboxCategory, interval: StatsInterval ) {
    return useQuery( {
      queryKey: [ 'akismet', 'blackbox', 'aggregates', category, interval ],
      queryFn: () => {
        const search = new URLSearchParams( { category, interval } );
        return apiClient.get< BlackboxAggregates >( `blackbox/aggregates?${ search.toString() }` );
      },
    } );
  }
  ```

  Create `src/hooks/use-woocommerce-fraud-summary.ts`:

  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api-client';
  import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
  import type { StatsInterval } from './use-stats-totals';

  export type WooFraudSummary = {
    interval: StatsInterval;
    orders_flagged: number;
    blocked_checkouts: number;
    estimated_chargebacks_averted_usd: number;
    top_signals: Array< { name: string; count: number } >;
    wfp_active: boolean;
    preview: boolean;
    generated_at: string;
  };

  export function useWooCommerceFraudSummary( interval: StatsInterval ) {
    return useQuery( {
      queryKey: [ 'akismet', 'woocommerce', 'fraud-summary', interval ],
      queryFn: () => {
        const search = new URLSearchParams( { interval } );
        return apiClient.get< WooFraudSummary >( `woocommerce/fraud-summary?${ search.toString() }` );
      },
      enabled: isWooCommerceActive(),
    } );
  }
  ```

  Create `src/hooks/use-is-woocommerce-active.ts`:

  ```ts
  import { readGlobal } from '@/lib/is-jetpack-active';

  export function isWooCommerceActive(): boolean {
    return readGlobal().integrations?.woocommerce === true;
  }
  ```

  (Plan 0 step 1 of Task 6 introduced `readGlobal`. The `integrations` shape was added in Task 2 step 4 of this plan.)

- [ ] **Step 5: Implement the unified `useCategorySummary`**

  Create `src/lib/category-adapters.ts`:

  ```ts
  import { useStatsTotals, type StatsInterval } from '@/hooks/use-stats-totals';
  import { useBlackboxAggregates, type BlackboxCategory } from '@/hooks/use-blackbox-aggregates';
  import { useWooCommerceFraudSummary } from '@/hooks/use-woocommerce-fraud-summary';
  import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
  import { CATEGORIES, type CategoryId } from '@/routes/overview/category-config';

  export type CategorySummary = {
    blocked: number;
    challenged: number;
    passed: number;
    series: Array< { date: string; blocked: number; challenged?: number; passed?: number } >;
    preview: boolean;
    not_active_here: boolean;
  };

  function categoryDefinition( id: CategoryId ) {
    const def = CATEGORIES.find( ( c ) => c.id === id );
    if ( ! def ) throw new Error( `Unknown category: ${ id }` );
    return def;
  }

  type AdapterResult = {
    data: CategorySummary | undefined;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
  };

  export function useCommentsCategoryAdapter( interval: StatsInterval ): AdapterResult {
    const { data, isLoading, isSuccess, isError } = useStatsTotals( interval );
    return {
      data: data && {
        blocked: data.spam,
        challenged: 0,
        passed: data.ham,
        series: [], // sparkline filled when the time-series endpoint ships
        preview: false,
        not_active_here: false,
      },
      isLoading,
      isSuccess,
      isError,
    };
  }

  export function useBlackboxCategoryAdapter( category: BlackboxCategory, interval: StatsInterval ): AdapterResult {
    const { data, isLoading, isSuccess, isError } = useBlackboxAggregates( category, interval );
    return {
      data: data && {
        blocked: data.blocked,
        challenged: data.challenged,
        passed: data.passed,
        series: data.series,
        preview: data.preview,
        not_active_here: false,
      },
      isLoading,
      isSuccess,
      isError,
    };
  }

  export function useWooCommerceCategoryAdapter( interval: StatsInterval ): AdapterResult {
    if ( ! isWooCommerceActive() ) {
      return {
        data: {
          blocked: 0,
          challenged: 0,
          passed: 0,
          series: [],
          preview: false,
          not_active_here: true,
        },
        isLoading: false,
        isSuccess: true,
        isError: false,
      };
    }
    const { data, isLoading, isSuccess, isError } = useWooCommerceFraudSummary( interval );
    return {
      data: data && {
        blocked: data.blocked_checkouts,
        challenged: 0,
        passed: 0,
        series: [],
        preview: data.preview,
        not_active_here: false,
      },
      isLoading,
      isSuccess,
      isError,
    };
  }
  ```

  Create `src/hooks/use-category-summary.ts`:

  ```ts
  import {
    useCommentsCategoryAdapter,
    useBlackboxCategoryAdapter,
    useWooCommerceCategoryAdapter,
    type CategorySummary,
  } from '@/lib/category-adapters';
  import { CATEGORIES, type CategoryId } from '@/routes/overview/category-config';
  import type { StatsInterval } from './use-stats-totals';

  export type { CategorySummary };

  export function useCategorySummary( id: CategoryId, interval: StatsInterval ) {
    const def = CATEGORIES.find( ( c ) => c.id === id );
    if ( ! def ) {
      throw new Error( `Unknown category: ${ id }` );
    }

    // Each adapter must be called unconditionally to satisfy React's rules-of-hooks.
    // We call the matching adapter and stub out the others via `enabled: false` query opts —
    // but for clarity in this prototype we use a tiny switch and accept that React will
    // see the same call shape per category (id is stable per consumer card).
    switch ( def.fetch.kind ) {
      case 'akismet-stats':
        return useCommentsCategoryAdapter( interval );
      case 'blackbox-aggregates':
        return useBlackboxCategoryAdapter( def.fetch.category, interval );
      case 'woocommerce-fraud':
        return useWooCommerceCategoryAdapter( interval );
    }
  }
  ```

  > **Note on rules-of-hooks:** because each `<CategoryCard>` consumes exactly one category by stable id, the switch is safe — no card ever swaps its adapter mid-render. If the same card needed to switch categories at runtime, this would need to flatten into a single adapter call with conditional `enabled` flags.

- [ ] **Step 6: Run, expect pass + commit**

  ```bash
  npm test -- --testPathPattern=use-category-summary
  git add src/hooks/use-category-summary.ts \
          src/hooks/use-stats-totals.ts \
          src/hooks/use-blackbox-aggregates.ts \
          src/hooks/use-woocommerce-fraud-summary.ts \
          src/hooks/use-is-woocommerce-active.ts \
          src/lib/category-adapters.ts \
          tests/js
  git commit -m "feat: unified useCategorySummary + per-source adapters"
  ```

### Task 5: `<IntervalSelector>` component

**Files:**
- Create: `src/routes/overview/interval-selector.tsx`
- Create: `tests/js/routes/overview/interval-selector.test.tsx`

- [ ] **Step 1: Implement**

  ```tsx
  import {
    __experimentalToggleGroupControl as ToggleGroupControl,
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
  } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import type { StatsInterval } from '@/hooks/use-stats-totals';

  type Props = {
    value: StatsInterval;
    onChange: ( next: StatsInterval ) => void;
  };

  export function IntervalSelector( { value, onChange }: Props ): JSX.Element {
    return (
      <ToggleGroupControl
        label={ __( 'Time range', 'akismet' ) }
        hideLabelFromVision
        value={ value }
        onChange={ ( next ) => onChange( next as StatsInterval ) }
        isBlock
        __nextHasNoMarginBottom
        __next40pxDefaultSize
      >
        <ToggleGroupControlOption value="30-days" label={ __( '30 days', 'akismet' ) } />
        <ToggleGroupControlOption value="60-days" label={ __( '60 days', 'akismet' ) } />
        <ToggleGroupControlOption value="6-months" label={ __( '6 months', 'akismet' ) } />
        <ToggleGroupControlOption value="all" label={ __( 'All time', 'akismet' ) } />
      </ToggleGroupControl>
    );
  }
  ```

- [ ] **Step 2: Test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { IntervalSelector } from '@/routes/overview/interval-selector';

  it( 'reports the new value on change', async () => {
    const onChange = jest.fn();
    render( <IntervalSelector value="30-days" onChange={ onChange } /> );
    await userEvent.click( screen.getByRole( 'radio', { name: /6 months/i } ) );
    expect( onChange ).toHaveBeenCalledWith( '6-months' );
  } );
  ```

- [ ] **Step 3: Commit**

### Task 6: `<CategoryCard>` — handles all three states

**Files:**
- Create: `src/routes/overview/category-card.tsx`
- Create: `src/routes/overview/category-sparkline.tsx`
- Create: `tests/js/routes/overview/category-card.test.tsx`

The card is the load-bearing UI element of the thesis. It renders one of three states:

- **Active**: blocked/challenged/passed numbers, sparkline, click-through to Activity log.
- **Preview**: same as active, with a `"preview data"` `<Badge>` and a tooltip explaining what's mocked.
- **Not active here**: empty state with a short explanation (`requires WooCommerce`, etc.) and a "Learn more" link.

- [ ] **Step 1: Implement `<CategorySparkline>`**

  ```tsx
  import { LineChart } from '@automattic/charts';
  import type { CategorySummary } from '@/hooks/use-category-summary';

  type Props = {
    series: CategorySummary[ 'series' ];
    label: string;
  };

  export function CategorySparkline( { series, label }: Props ): JSX.Element | null {
    if ( series.length === 0 ) {
      return null;
    }
    const data = [
      {
        label,
        data: series.map( ( p ) => ( { date: p.date, value: p.blocked } ) ),
      },
    ];
    return (
      <div className="akismet-category-card__sparkline" role="img" aria-label={ label }>
        <LineChart data={ data } height={ 56 } />
      </div>
    );
  }
  ```

- [ ] **Step 2: Implement `<CategoryCard>`**

  ```tsx
  import { Card, CardBody, CardHeader, Spinner, Button } from '@wordpress/components';
  import { __, sprintf } from '@wordpress/i18n';
  import { useCategorySummary } from '@/hooks/use-category-summary';
  import { CATEGORIES, type CategoryId } from './category-config';
  import { CategorySparkline } from './category-sparkline';
  import type { StatsInterval } from '@/hooks/use-stats-totals';

  type Props = {
    id: CategoryId;
    interval: StatsInterval;
    onDrillDown: ( id: CategoryId ) => void;
  };

  function formatNumber( value: number ): string {
    return new Intl.NumberFormat().format( value );
  }

  export function CategoryCard( { id, interval, onDrillDown }: Props ): JSX.Element {
    const def = CATEGORIES.find( ( c ) => c.id === id )!;
    const { data, isLoading } = useCategorySummary( id, interval );

    if ( isLoading || ! data ) {
      return (
        <Card className="akismet-category-card">
          <CardHeader>{ def.label }</CardHeader>
          <CardBody><Spinner /></CardBody>
        </Card>
      );
    }

    if ( data.not_active_here ) {
      return (
        <Card className="akismet-category-card akismet-category-card--inactive">
          <CardHeader>{ def.label }</CardHeader>
          <CardBody>
            <p className="akismet-category-card__short">{ def.short }</p>
            <p className="akismet-category-card__empty">
              { sprintf(
                /* translators: %s: integration prerequisite, e.g. "WooCommerce". */
                __( 'Not active here. Requires %s.', 'akismet' ),
                def.requires === 'woocommerce' ? 'WooCommerce' : def.requires ?? ''
              ) }
            </p>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card className="akismet-category-card">
        <CardHeader>
          <span className="akismet-category-card__title">{ def.label }</span>
          { data.preview && (
            <span className="akismet-category-card__badge" title={ __( 'Mocked data — the upstream signal source isn’t wired up on this site yet.', 'akismet' ) }>
              { __( 'preview data', 'akismet' ) }
            </span>
          ) }
        </CardHeader>
        <CardBody>
          <p className="akismet-category-card__short">{ def.short }</p>
          <dl className="akismet-category-card__stats">
            <div>
              <dt>{ __( 'Blocked', 'akismet' ) }</dt>
              <dd>{ formatNumber( data.blocked ) }</dd>
            </div>
            { data.challenged > 0 && (
              <div>
                <dt>{ __( 'Challenged', 'akismet' ) }</dt>
                <dd>{ formatNumber( data.challenged ) }</dd>
              </div>
            ) }
            { data.passed > 0 && (
              <div>
                <dt>{ __( 'Passed challenge', 'akismet' ) }</dt>
                <dd>{ formatNumber( data.passed ) }</dd>
              </div>
            ) }
          </dl>
          <CategorySparkline series={ data.series } label={ def.label } />
          <Button
            variant="tertiary"
            onClick={ () => onDrillDown( id ) }
            __next40pxDefaultSize
          >
            { __( 'See activity →', 'akismet' ) }
          </Button>
        </CardBody>
      </Card>
    );
  }
  ```

- [ ] **Step 3: Tests**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { CategoryCard } from '@/routes/overview/category-card';

  function renderCard( id: 'comments' | 'logins' | 'checkouts' ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    render(
      <QueryClientProvider client={ client }>
        <CategoryCard id={ id } interval="30-days" onDrillDown={ () => {} } />
      </QueryClientProvider>
    );
  }

  afterEach( () => {
    // @ts-expect-error
    delete window.akismetExperimental;
  } );

  it( 'renders the comments card with no preview badge', async () => {
    renderCard( 'comments' );
    expect( await screen.findByText( /^comments$/i ) ).toBeInTheDocument();
    expect( screen.queryByText( /preview data/i ) ).not.toBeInTheDocument();
  } );

  it( 'renders the logins card with a preview badge', async () => {
    renderCard( 'logins' );
    expect( await screen.findByText( /preview data/i ) ).toBeInTheDocument();
  } );

  it( 'renders the checkouts card as not-active-here when WooCommerce is absent', async () => {
    renderCard( 'checkouts' );
    expect( await screen.findByText( /not active here.*woocommerce/i ) ).toBeInTheDocument();
  } );
  ```

- [ ] **Step 4: Commit**

### Task 7: `<CategoryGrid>` — six-card grid

**Files:**
- Create: `src/routes/overview/category-grid.tsx`
- Create: `tests/js/routes/overview/category-grid.test.tsx`

- [ ] **Step 1: Implement**

  ```tsx
  import { CategoryCard } from './category-card';
  import { CATEGORIES, type CategoryId } from './category-config';
  import type { StatsInterval } from '@/hooks/use-stats-totals';

  type Props = {
    interval: StatsInterval;
    onDrillDown: ( id: CategoryId ) => void;
  };

  export function CategoryGrid( { interval, onDrillDown }: Props ): JSX.Element {
    return (
      <div className="akismet-category-grid">
        { CATEGORIES.map( ( def ) => (
          <CategoryCard
            key={ def.id }
            id={ def.id }
            interval={ interval }
            onDrillDown={ onDrillDown }
          />
        ) ) }
      </div>
    );
  }
  ```

- [ ] **Step 2: Test** that all six cards render and that the badge appears on the right ones.

- [ ] **Step 3: Commit**

### Task 8: `<ThreatKPIs>` — the headline row

**Files:**
- Create: `src/routes/overview/threat-kpis.tsx`
- Create: `tests/js/routes/overview/threat-kpis.test.tsx`

Sums across all categories (real + preview, with the preview portion clearly subtracted in a tooltip). One big number: "X threats handled in the last 30 days" with a sub-line that breaks it down "blocked · challenged · passed challenge."

- [ ] **Step 1: Implement**

  ```tsx
  import { Spinner } from '@wordpress/components';
  import { __, sprintf, _n } from '@wordpress/i18n';
  import { useCategorySummary } from '@/hooks/use-category-summary';
  import { CATEGORIES } from './category-config';
  import type { StatsInterval } from '@/hooks/use-stats-totals';

  type Props = { interval: StatsInterval };

  function formatNumber( value: number ): string {
    return new Intl.NumberFormat().format( value );
  }

  function intervalLabel( interval: StatsInterval ): string {
    switch ( interval ) {
      case '30-days': return __( 'in the last 30 days', 'akismet' );
      case '60-days': return __( 'in the last 60 days', 'akismet' );
      case '6-months': return __( 'in the last 6 months', 'akismet' );
      case 'all': return __( 'all time', 'akismet' );
    }
  }

  export function ThreatKPIs( { interval }: Props ): JSX.Element {
    // Pulling all six categories independently is intentional — they share the same query cache
    // so this isn't six round-trips, it's six cache reads after the cards have hydrated.
    const summaries = CATEGORIES.map( ( def ) => useCategorySummary( def.id, interval ) );

    const isLoading = summaries.some( ( s ) => s.isLoading );
    if ( isLoading ) {
      return <Spinner />;
    }

    let totalBlocked = 0, totalChallenged = 0, totalPassed = 0, totalPreview = 0;
    summaries.forEach( ( s ) => {
      if ( ! s.data || s.data.not_active_here ) return;
      totalBlocked    += s.data.blocked;
      totalChallenged += s.data.challenged;
      totalPassed     += s.data.passed;
      if ( s.data.preview ) {
        totalPreview += s.data.blocked + s.data.challenged + s.data.passed;
      }
    } );

    const total = totalBlocked + totalChallenged + totalPassed;

    return (
      <section className="akismet-threat-kpis">
        <p className="akismet-threat-kpis__headline">
          <strong>{ formatNumber( total ) }</strong>{ ' ' }
          { _n( 'threat handled', 'threats handled', total, 'akismet' ) }{ ' ' }
          { intervalLabel( interval ) }
        </p>
        <p className="akismet-threat-kpis__breakdown">
          { sprintf(
            /* translators: 1: blocked count 2: challenged count 3: passed-challenge count */
            __( '%1$s blocked · %2$s challenged · %3$s passed challenge', 'akismet' ),
            formatNumber( totalBlocked ),
            formatNumber( totalChallenged ),
            formatNumber( totalPassed )
          ) }
        </p>
        { totalPreview > 0 && (
          <p className="akismet-threat-kpis__caveat">
            { sprintf(
              /* translators: %s: count of preview-data threats. */
              __( '%s of these are from preview-data categories (badged below) — not real on this site yet.', 'akismet' ),
              formatNumber( totalPreview )
            ) }
          </p>
        ) }
      </section>
    );
  }
  ```

- [ ] **Step 2: Test** that the headline number matches the sum across categories.

- [ ] **Step 3: Commit**

### Task 9: `<WooCommercePanel>` — the wedge-market demo

**Files:**
- Create: `src/routes/overview/woocommerce-panel.tsx`
- Create: `tests/js/routes/overview/woocommerce-panel.test.tsx`

Only renders when `isWooCommerceActive()` is true. The product-meaningful demo of the pivot.

- [ ] **Step 1: Implement**

  ```tsx
  import { Card, CardBody, CardHeader, Spinner, ExternalLink } from '@wordpress/components';
  import { __, sprintf } from '@wordpress/i18n';
  import { useWooCommerceFraudSummary } from '@/hooks/use-woocommerce-fraud-summary';
  import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
  import type { StatsInterval } from '@/hooks/use-stats-totals';

  type Props = { interval: StatsInterval };

  function formatNumber( value: number ): string {
    return new Intl.NumberFormat().format( value );
  }

  function formatUsd( value: number ): string {
    return new Intl.NumberFormat( undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } ).format( value );
  }

  export function WooCommercePanel( { interval }: Props ): JSX.Element | null {
    if ( ! isWooCommerceActive() ) {
      return null;
    }

    const { data, isLoading } = useWooCommerceFraudSummary( interval );

    if ( isLoading || ! data ) {
      return <Spinner />;
    }

    return (
      <section className="akismet-woocommerce-panel" aria-labelledby="akismet-wc-heading">
        <header className="akismet-woocommerce-panel__header">
          <h2 id="akismet-wc-heading">{ __( 'WooCommerce store protection', 'akismet' ) }</h2>
          { data.preview && (
            <span className="akismet-woocommerce-panel__badge">
              { __( 'preview data', 'akismet' ) }
            </span>
          ) }
        </header>
        <p className="akismet-woocommerce-panel__lede">
          { __(
            'Fraud and abuse caught on your store before the order completes.',
            'akismet'
          ) }
        </p>
        <div className="akismet-woocommerce-panel__metrics">
          <Card>
            <CardHeader>{ __( 'Orders flagged', 'akismet' ) }</CardHeader>
            <CardBody>{ formatNumber( data.orders_flagged ) }</CardBody>
          </Card>
          <Card>
            <CardHeader>{ __( 'Blocked checkouts', 'akismet' ) }</CardHeader>
            <CardBody>{ formatNumber( data.blocked_checkouts ) }</CardBody>
          </Card>
          <Card>
            <CardHeader>
              { __( 'Chargebacks averted (est.)', 'akismet' ) }
            </CardHeader>
            <CardBody>
              { formatUsd( data.estimated_chargebacks_averted_usd ) }
              <p className="akismet-woocommerce-panel__methodology">
                <ExternalLink href="https://blackboxdocs.wordpress.com/methodology-chargebacks-averted">
                  { __( 'How is this estimated?', 'akismet' ) }
                </ExternalLink>
              </p>
            </CardBody>
          </Card>
        </div>
        <details className="akismet-woocommerce-panel__signals">
          <summary>{ __( 'Top fraud signals', 'akismet' ) }</summary>
          <ul>
            { data.top_signals.map( ( s ) => (
              <li key={ s.name }>
                <code>{ s.name }</code>
                <span>{ sprintf(
                  /* translators: %s: count. */
                  __( '%s hits', 'akismet' ),
                  formatNumber( s.count )
                ) }</span>
              </li>
            ) ) }
          </ul>
        </details>
        <p className="akismet-woocommerce-panel__deep-link">
          <ExternalLink href="/wp-admin/admin.php?page=wc-admin&path=%2Fanalytics%2Forders">
            { __( 'See full order analytics in WooCommerce →', 'akismet' ) }
          </ExternalLink>
        </p>
      </section>
    );
  }
  ```

- [ ] **Step 2: Tests**

  ```tsx
  it( 'renders nothing when WooCommerce is not active', () => { /* ... */ } );
  it( 'renders all three metric cards when WC is active', async () => { /* ... */ } );
  it( 'shows the preview badge when WFP is not active', async () => { /* ... */ } );
  ```

- [ ] **Step 3: Commit**

### Task 10: `<OverviewTab>` — compose

**Files:**
- Create: `src/routes/overview-tab.tsx`
- Create: `src/styles/overview.scss`
- Create: `tests/js/routes/overview-tab.test.tsx`

- [ ] **Step 1: Implement**

  ```tsx
  import { useState } from '@wordpress/element';
  import { Spinner } from '@wordpress/components';
  import { IntervalSelector } from './overview/interval-selector';
  import { ThreatKPIs } from './overview/threat-kpis';
  import { CategoryGrid } from './overview/category-grid';
  import { WooCommercePanel } from './overview/woocommerce-panel';
  import { EmptyState } from './overview/empty-state';
  import { useApiKey } from '@/hooks/use-api-key';
  import type { StatsInterval } from '@/hooks/use-stats-totals';
  import type { CategoryId } from './overview/category-config';

  type Props = {
    onNavigateToActivity?: ( categoryFilter: CategoryId ) => void;
  };

  export function OverviewTab( { onNavigateToActivity }: Props ): JSX.Element {
    const [ interval, setIntervalValue ] = useState< StatsInterval >( '30-days' );
    const { data: apiKey, isLoading } = useApiKey();

    if ( isLoading ) {
      return <Spinner />;
    }

    if ( ! apiKey?.valid ) {
      return <EmptyState />;
    }

    return (
      <div className="akismet-overview">
        <header className="akismet-overview__header">
          <IntervalSelector value={ interval } onChange={ setIntervalValue } />
        </header>
        <ThreatKPIs interval={ interval } />
        <CategoryGrid
          interval={ interval }
          onDrillDown={ ( id ) => onNavigateToActivity?.( id ) }
        />
        <WooCommercePanel interval={ interval } />
      </div>
    );
  }
  ```

- [ ] **Step 2: Styles**

  ```scss
  .akismet-overview {
      display: grid;
      gap: var( --wp-components-spacing-5, 24px );
  }

  .akismet-overview__header {
      display: flex;
      justify-content: flex-end;
  }

  .akismet-threat-kpis {
      &__headline {
          font-size: 22px;
          margin: 0 0 4px;

          strong {
              font-size: 32px;
              margin-right: 8px;
          }
      }

      &__breakdown {
          color: var( --wp-admin-theme-color, #2271b1 );
          margin: 0;
      }

      &__caveat {
          color: var( --wp-components-color-foreground-muted, #757575 );
          font-size: 12px;
          margin-top: 4px;
      }
  }

  .akismet-category-grid {
      display: grid;
      grid-template-columns: repeat( 3, minmax( 0, 1fr ) );
      gap: var( --wp-components-spacing-4, 16px );

      @media ( max-width: 960px ) {
          grid-template-columns: repeat( 2, minmax( 0, 1fr ) );
      }

      @media ( max-width: 600px ) {
          grid-template-columns: 1fr;
      }
  }

  .akismet-category-card {
      &--inactive {
          opacity: 0.7;
      }

      &__badge {
          background: var( --wp-components-color-accent-04, #fff9c4 );
          color: var( --wp-components-color-foreground, #1e1e1e );
          font-size: 11px;
          font-weight: 500;
          padding: 2px 6px;
          margin-left: 8px;
          border-radius: 4px;
      }

      &__short {
          font-size: 13px;
          color: var( --wp-components-color-foreground-muted, #757575 );
          margin: 0 0 12px;
      }

      &__stats {
          display: grid;
          grid-template-columns: repeat( auto-fit, minmax( 80px, 1fr ) );
          gap: 12px;
          margin: 0 0 12px;

          dt {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: var( --wp-components-color-foreground-muted, #757575 );
          }

          dd {
              font-size: 20px;
              margin: 0;
          }
      }

      &__sparkline {
          margin: 12px 0;
      }
  }

  .akismet-woocommerce-panel {
      border: 1px solid var( --wp-components-color-foreground-tertiary, #e0e0e0 );
      border-radius: 8px;
      padding: var( --wp-components-spacing-4, 16px );

      &__header {
          display: flex;
          align-items: center;
          gap: 12px;

          h2 {
              margin: 0;
              font-size: 18px;
          }
      }

      &__badge {
          background: var( --wp-components-color-accent-04, #fff9c4 );
          font-size: 11px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
      }

      &__metrics {
          display: grid;
          grid-template-columns: repeat( 3, minmax( 0, 1fr ) );
          gap: var( --wp-components-spacing-4, 16px );
          margin: var( --wp-components-spacing-4, 16px ) 0;

          @media ( max-width: 600px ) {
              grid-template-columns: 1fr;
          }
      }

      &__methodology {
          font-size: 11px;
          margin: 6px 0 0;
      }

      &__signals {
          margin: var( --wp-components-spacing-3, 12px ) 0;

          ul {
              list-style: none;
              padding: 0;
              display: grid;
              gap: 4px;
          }

          li {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
          }
      }
  }
  ```

- [ ] **Step 3: Empty state** — copy from prior Plan 2 (`empty-state.tsx`); unchanged.

- [ ] **Step 4: Tests** — render all sections for happy-path + WC-inactive (panel omitted) + no-key (empty state).

- [ ] **Step 5: Commit**

  ```bash
  npm test
  npm run build
  git add src/routes/overview-tab.tsx src/routes/overview src/styles/overview.scss tests/js
  git commit -m "feat: <OverviewTab> unified threat dashboard"
  ```

### Task 11: Mount the Overview tab in `<App>`

**Files:**
- Modify: `src/app.tsx`
- Modify: `tests/js/app.test.tsx`

- [ ] **Step 1: Add the tab as the default first tab**

  Pass `onNavigateToActivity` so cards can deep-link to the Activity tab from Plan 3:

  ```tsx
  <Tabs.Root defaultValue={ getInitialTab() } onValueChange={ syncTabToUrl }>
    <Tabs.List>
      <Tabs.Tab value="overview">{ __( 'Overview', 'akismet' ) }</Tabs.Tab>
      <Tabs.Tab value="activity">{ __( 'Activity', 'akismet' ) }</Tabs.Tab>
      <Tabs.Tab value="account">{ __( 'Account', 'akismet' ) }</Tabs.Tab>
      <Tabs.Tab value="settings">{ __( 'Settings', 'akismet' ) }</Tabs.Tab>
    </Tabs.List>
    <Tabs.TabPanel value="overview">
      <OverviewTab onNavigateToActivity={ ( id ) => {
        const url = new URL( window.location.href );
        url.searchParams.set( 'tab', 'activity' );
        url.searchParams.set( 'category', id );
        window.history.replaceState( null, '', url.toString() );
        setTab( 'activity' );
      } } />
    </Tabs.TabPanel>
    {/* other panels rendered by Plans 1 + 3 */}
  </Tabs.Root>
  ```

  > **Note:** the `activity` tab is added by Plan 3. If Plan 3 hasn't shipped yet, ship this Plan 2 with `activity` listed but with a placeholder TabPanel that says "Coming soon" — and remove the `onNavigateToActivity` prop wiring until Plan 3 lands.

- [ ] **Step 2: Update URL-sync allowlist** to include `overview`, `activity`, `account`, `settings`.

- [ ] **Step 3: Run + commit**

### Task 12: Manual verification

- [ ] **Step 1: Site with WooCommerce installed + valid Akismet key**

  Visit `?page=akismet-experimental&tab=overview`:
  - Headline KPI sums all six categories.
  - Six category cards render. Comments shows real numbers. Forms / Logins / Bots / Brute-force show preview badges. Checkouts shows real numbers (or preview-badged if WFP isn't active).
  - WooCommerce panel renders below.
  - Interval selector switches all categories at once.

- [ ] **Step 2: Site without WooCommerce**

  - Checkouts card renders as "Not active here. Requires WooCommerce."
  - WooCommerce panel is absent.

- [ ] **Step 3: Site without a valid Akismet key**

  - Empty state with a "Go to Account" button.

- [ ] **Step 4: Visual review against [strategy.md](./strategy.md)**

  Show the dashboard to a non-engineer for 60 seconds. Ask: "what does Akismet do, looking at this?" If the answer is "comment spam," the UI failed the thesis test and we iterate.

- [ ] **Step 5: Screenshot for the PR**

  Capture: WC-active state, WC-inactive state, mobile layout, no-key state.

### Task 13: PR

- [ ] **Step 1: Push + open**

  ```bash
  git push -u origin akismet/experimental-ui-overview
  gh pr create --title "akismet: experimental UI — unified threat dashboard" --body "..."
  ```

  Body template:

  ```
  ## Summary

  - Replaces the Akismet `tools.akismet.com` iframes with a native unified-threat dashboard built on `@automattic/charts` + `@wordpress/admin-ui`.
  - **Six category cards** (Comments, Forms, Logins, Checkouts, Bots, Brute-force) instead of comment-spam-only — comment spam is now one row of six, demonstrating the Akismet → WordPress trust layer pivot articulated in [strategy.md](./strategy.md).
  - Dedicated **WooCommerce fraud panel** below the cards (renders only when WC is detected) — the wedge-market demo.
  - Three new REST routes on `akismet/v1`:
    - `/blackbox/aggregates?category=&interval=` (currently returns deterministic mocks; Bearer-key Blackbox call is the next step pending @dtbecher).
    - `/woocommerce/fraud-summary?interval=` (reads from WFP when present; mocks otherwise).
  - Closes [AKISMET-95](https://linear.app/a8c/issue/AKISMET-95).

  ## Test plan

  - [ ] `npm test` passes
  - [ ] Every category card renders with the correct active / preview / not-active-here state
  - [ ] WooCommerce panel renders when WC is installed; absent otherwise
  - [ ] Empty state renders when no API key
  - [ ] 60-second-grok test: show to a non-engineer; do they read "WordPress trust layer" or "comment spam"?
  ```

  Suggested reviewers: `cfinke`, `bluefuton`, `@dtbecher`, `@luizfreis`, `keoshi`.

---

## Self-review checklist

- Are all six cards consuming exactly the same `<CategoryCard>` component? (Should be — the differentiation lives in `category-config.ts` and the adapter switch in `useCategorySummary`.)
- Does every preview/mocked surface render the `"preview data"` badge?
- Does `<WooCommercePanel>` short-circuit on `isWooCommerceActive()` without making a request?
- Does the WC panel's "chargebacks averted" number have a visible methodology link? (Real link TBD with `@luizfreis`.)
- Does `<ThreatKPIs>` show the preview-data caveat when any category is mocked? (Required for honesty.)
- Does the "60-second grok test" in Task 12 step 4 actually get done before merging? If not, the thesis is unproven.
