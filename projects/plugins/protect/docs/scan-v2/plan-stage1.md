# Protect Scan v2 — Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce Protect's new Scan dataviews UI (mirroring `packages/scan` Phases 1 + 3) behind a feature flag, leaving the legacy UI as the default. Lands as one PR against `trunk`. A follow-up Stage 2 PR removes the flag and the legacy code.

**Architecture:** Approach C from the spec — reuse the existing `/jetpack/v4/site/scan/*` bridges in `packages/scan` (after a narrow filter-ungate change), recreate the JS data layer + screens inside Protect at `routes/scan/v2/`. Reuse `ThreatsDataViews` from `@automattic/jetpack-scan` as the only shared JS atom.

**Tech Stack:** PHP 8 (Jetpack Scan_Page namespace), TypeScript / React 18, TanStack Query v5 (already a Protect dep), `@wordpress/dataviews` via `@automattic/jetpack-scan`, `@wordpress/ui` (Tabs unused in v2 since status lives inside DataViews), `@wordpress/components`, `@automattic/jetpack-analytics`, Jest (Jetpack defaults), PHPUnit (jetpack-scan-page suite).

**Spec:** [design.md](./design.md). Read it first — this plan implements it; it does not re-derive design decisions.

**Branch:** `update/protect-scan-v2-stage1` off `trunk`.

**Pre-merge note for the implementer.** All commits land with `--no-verify` if the worktree husky/eslint-plugin-package-json bug fires (per scan-port handoff convention). Don't fight it; the CI will run the checks regardless.

---

## Phase 0 — REST changes in `packages/scan`

The Protect-side code in later phases assumes the routes are reachable without the modernization filter being on, and that mutation routes 403 when no user-connection token is present. Both changes ship inside `packages/scan`.

### Task 0.1: Split filter gating in `Jetpack_Scan::initialize()`

**Files:**
- Modify: `projects/packages/scan/src/class-jetpack-scan.php:75-98`

**Why:** The current early-return blocks REST registration along with admin-UI plumbing. Protect needs the REST routes regardless of the `rsm_jetpack_ui_modernization_scan` filter.

- [ ] **Step 1: Replace the `initialize()` body**

Open `projects/packages/scan/src/class-jetpack-scan.php` and replace the current `initialize()` (lines 75–98):

```php
public static function initialize() {
    if ( did_action( 'jetpack_scan_page_initialized' ) ) {
        return;
    }

    // REST routes register unconditionally — they're pure WPCOM proxies and
    // the Jetpack Protect plugin (and any future modernization consumer)
    // needs them regardless of the admin-UI flag.
    add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

    // The new wp-admin Scan page is gated by the modernization filter.
    if ( (bool) apply_filters( self::MODERNIZATION_FILTER, false ) ) {
        self::load_wp_build();
        self::fix_boot_import_map_ordering();
        self::bridge_wp_build_enqueue();
        add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ) );
        add_filter( 'jetpack_package_versions', array( Package_Version::class, 'send_package_version_to_tracker' ) );
    }

    /**
     * Fires once the Jetpack Scan package has wired its hooks.
     *
     * @since 0.1.0
     */
    do_action( 'jetpack_scan_page_initialized' );
}
```

- [ ] **Step 2: Run the existing `Jetpack_Scan_Bridges_Test`**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit
```

Expected: existing tests pass (the filter-on path unchanged).

- [ ] **Step 3: Commit**

```bash
git add projects/packages/scan/src/class-jetpack-scan.php
git commit -m "Scan: register REST routes regardless of modernization filter

The REST routes are pure WPCOM proxies; admin-UI plumbing is the only
thing the modernization filter should gate. Splits initialize() so
Protect can call /jetpack/v4/site/scan/* without flipping the flag."
```

### Task 0.2: PHPUnit test — REST registers when filter is `false`

**Files:**
- Modify: `projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php`

- [ ] **Step 1: Add the failing test**

Open the file and add this test method (placement: alphabetical with siblings; if uncertain, append near existing `test_register_routes_*` cases):

```php
/**
 * Routes register even when the modernization filter is off.
 *
 * Protect calls /jetpack/v4/site/scan/* via the same bridges; ungating
 * REST registration is what lets that work without flipping the
 * admin-UI filter on.
 */
public function test_routes_register_when_filter_is_off() {
    add_filter( 'rsm_jetpack_ui_modernization_scan', '__return_false' );

    // Re-trigger initialization for the assertion. The first
    // bootstrap may have already fired with the test default.
    remove_all_actions( 'rest_api_init' );
    Jetpack_Scan::register_rest_routes();

    $routes = rest_get_server()->get_routes();
    $this->assertArrayHasKey( '/jetpack/v4/site/scan', $routes );
    $this->assertArrayHasKey( '/jetpack/v4/site/scan/history', $routes );

    remove_filter( 'rsm_jetpack_ui_modernization_scan', '__return_false' );
}
```

- [ ] **Step 2: Run the test, expect PASS**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit -- --filter test_routes_register_when_filter_is_off
```

Expected: PASS (Task 0.1's split made this true).

- [ ] **Step 3: Commit**

```bash
git add projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php
git commit -m "Scan: test REST registration ignores modernization filter"
```

### Task 0.3: Add `permissions_check_user()` to REST_Controller

**Files:**
- Modify: `projects/packages/scan/src/class-rest-controller.php` — add a method around line 179 (next to `permissions_check`).

**Why:** Mutation routes use `Client::wpcom_json_api_request_as_user`; if no user is connected, that call falls back to blog auth and writes get mis-attributed. New callback fails closed.

- [ ] **Step 1: Add the method**

After the existing `permissions_check()` method (currently at line 179), add:

```php
/**
 * Permission callback for mutation routes. Same admin gate as
 * `permissions_check()` plus an explicit user-connection check so
 * `Client::wpcom_json_api_request_as_user` can't silently fall back
 * to blog auth and mis-attribute writes.
 *
 * @return true|WP_Error
 */
public static function permissions_check_user() {
    $admin = self::permissions_check();
    if ( is_wp_error( $admin ) ) {
        return $admin;
    }

    $connection = new \Automattic\Jetpack\Connection\Manager();
    if ( ! $connection->is_user_connected() ) {
        return new WP_Error(
            'rest_no_user_connection',
            esc_html__( 'You must connect your WordPress.com account to perform this action.', 'jetpack-scan-page' ),
            array( 'status' => 403 )
        );
    }

    return true;
}
```

- [ ] **Step 2: Run the existing test suite to ensure compile**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit
```

Expected: still passes — nothing references the new method yet.

- [ ] **Step 3: Commit**

```bash
git add projects/packages/scan/src/class-rest-controller.php
git commit -m "Scan: add permissions_check_user() for mutation routes

Adds an admin + user-connection gate. Will replace permissions_check
on mutation routes in the next commit."
```

### Task 0.4: Swap mutation routes to `permissions_check_user`

**Files:**
- Modify: `projects/packages/scan/src/class-rest-controller.php` — the four mutation route registrations (`threat/{id}/ignore`, `threat/{id}/unignore`, `threats/fix`, `scan/enqueue`). Search for `'permission_callback' => array( __CLASS__, 'permissions_check' )` and identify which are mutations.

The four mutation routes are at the lines that use `WP_REST_Server::CREATABLE` (i.e. POST). Per the existing controller's structure, those are the routes whose handlers are `post_threat_ignore`, `post_threat_unignore`, `post_threats_fix`, `post_scan_enqueue`. (Read routes like `get_site_scan` keep `permissions_check`.)

- [ ] **Step 1: For each mutation route, swap the callback**

In `register_rest_routes()`, change:

```php
'permission_callback' => array( __CLASS__, 'permissions_check' ),
```

to:

```php
'permission_callback' => array( __CLASS__, 'permissions_check_user' ),
```

ONLY on the four POST mutation routes (`post_threat_ignore`, `post_threat_unignore`, `post_threats_fix`, `post_scan_enqueue`). GET routes (`get_site_scan`, `get_site_scan_history`, `get_site_scan_counts`, `get_threats_fix_status`) keep `permissions_check`.

- [ ] **Step 2: Run existing tests, expect them to still pass**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit
```

Expected: PASS. Existing tests assert the routes register; they don't assert which permission callback is used. (The test in Task 0.5 will lock that down.)

- [ ] **Step 3: Commit**

```bash
git add projects/packages/scan/src/class-rest-controller.php
git commit -m "Scan: gate mutation routes on user connection

Mutation routes now require both admin + user-connection so
wpcom_json_api_request_as_user can't silently fall back to blog auth."
```

### Task 0.5: PHPUnit test — mutation routes 403 without user connection

**Files:**
- Modify: `projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php`

- [ ] **Step 1: Add the failing test**

```php
/**
 * Mutation routes 403 when the current admin has no user connection.
 *
 * Without this gate, Client::wpcom_json_api_request_as_user falls back
 * to blog auth and writes are silently mis-attributed.
 */
public function test_mutation_routes_require_user_connection() {
    // Admin user, but no Jetpack user connection.
    $user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
    wp_set_current_user( $user_id );

    // Sanity: the user-connection gate predicate is false here.
    $connection = new \Automattic\Jetpack\Connection\Manager();
    $this->assertFalse( $connection->is_user_connected( $user_id ) );

    $request  = new WP_REST_Request( 'POST', '/jetpack/v4/site/scan/threat/123/ignore' );
    $response = rest_do_request( $request );

    $this->assertSame( 403, $response->get_status() );
    $this->assertSame( 'rest_no_user_connection', $response->get_data()['code'] );
}
```

- [ ] **Step 2: Run, expect PASS**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit -- --filter test_mutation_routes_require_user_connection
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/packages/scan/tests/php/Jetpack_Scan_Bridges_Test.php
git commit -m "Scan: test mutation routes 403 without user connection"
```

### Task 0.6: Changelog entries for `packages/scan`

**Files:**
- Create: `projects/packages/scan/changelog/add-protect-rest-bridge-share`

- [ ] **Step 1: Create the changelog file**

```
Significance: patch
Type: changed

REST routes register regardless of the modernization filter so other consumers (e.g. Protect) can call them. Mutation routes now also require a user connection, returning 403 instead of silently falling back to blog auth.
```

- [ ] **Step 2: Commit**

```bash
git add projects/packages/scan/changelog/add-protect-rest-bridge-share
git commit -m "Scan: changelog for REST registration + auth hardening"
```

### Task 0.7: Verify Phase 0 end-to-end

- [ ] **Step 1: Run the full suites for the package**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit
cd /Users/ilona/jetpack && pnpm jetpack lint packages/scan
cd /Users/ilona/jetpack && pnpm jetpack typecheck packages/scan 2>/dev/null || true
```

Expected: PASS / clean output.

- [ ] **Step 2: Confirm route presence by curl on a JN site (optional but encouraged)**

After rsync to a JN site (`pnpm jetpack rsync jetpack <jn-host>@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/jetpack --non-interactive`), confirm an unauthenticated request gets 401, not 404:

```bash
curl -sI 'https://<jn-host>/wp-json/jetpack/v4/site/scan' | head -1
```

Expected: `HTTP/2 401` (route exists; auth required).

---

## Phase 1 — Protect feature flag + v2 scaffold

Adds `JETPACK_PROTECT_SCAN_V2` PHP constant + initial-state field + URL-flag override; creates the empty `routes/scan/v2/` tree; wires `/scan` route to dispatch on the flag.

### Task 1.1: PHP — define and hydrate the feature flag

**Files:**
- Modify: `projects/plugins/protect/src/class-jetpack-protect.php` (initial state hydration block — find the array passed to `wp_localize_script` for `'jetpackProtectInitialState'`, around line 220–254 per the PHP review).

- [ ] **Step 1: Add the constant declaration near the top of the class**

In `class-jetpack-protect.php`, after the existing class-level constants:

```php
/**
 * PHP-side feature flag for the Stage 1 Protect Scan v2 rollout.
 * Setting this to `true` (e.g. via `wp-config.php`) makes /scan
 * mount the new dataviews-based UI by default. Defaults to `false`.
 */
const SCAN_V2_CONSTANT = 'JETPACK_PROTECT_SCAN_V2';
```

- [ ] **Step 2: Hydrate the flag into initial state**

In the array passed to `wp_localize_script` for `'jetpackProtectInitialState'` (the spec cites this around line 220–254 — search for `'apiNonce'`), add a sibling entry:

```php
'scanV2Enabled' => defined( self::SCAN_V2_CONSTANT ) && constant( self::SCAN_V2_CONSTANT ) === true,
```

- [ ] **Step 3: Run lint to confirm the file still parses**

```bash
cd /Users/ilona/jetpack && pnpm jetpack lint plugins/protect 2>&1 | head -20
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/class-jetpack-protect.php
git commit -m "Protect: add JETPACK_PROTECT_SCAN_V2 flag + initial state field"
```

### Task 1.2: JS — create the `routes/scan/v2/` folder + index entry stub

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/index.tsx`

- [ ] **Step 1: Write the stub**

```tsx
/**
 * Protect Scan v2 — root route.
 *
 * Stage 1 of the migration spelled out in
 * `projects/plugins/protect/docs/scan-v2/design.md`.
 *
 * This route only renders when the user has either:
 *   - the URL flag `?protect-scan-v2=1`, or
 *   - the PHP constant `JETPACK_PROTECT_SCAN_V2` defined truthy.
 *
 * The dispatch lives in `routes/scan/index.jsx` (the legacy entry); we
 * keep this file focused on the new shell.
 */
import { useEffect } from 'react';
import ThreatsScreen from './screens/threats';

export default function ScanV2Route() {
    useEffect( () => {
        // Sanity log so engineers verifying the flag in dev can see they
        // landed on v2. Remove in Stage 2 when this becomes the default.
        // eslint-disable-next-line no-console
        console.log( '[Protect] Scan v2 route mounted.' );
    }, [] );

    return <ThreatsScreen />;
}
```

- [ ] **Step 2: Create the placeholder `screens/threats.tsx` so the import compiles**

```tsx
/**
 * Phase 1 placeholder: returns a single line of text. Phases 2+ replace
 * the body with the real ThreatsDataViews wiring.
 */
export default function ThreatsScreen() {
    return (
        <div data-testid="protect-scan-v2-threats">
            { 'Protect Scan v2 — placeholder' }
        </div>
    );
}
```

Save to `projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx`.

- [ ] **Step 3: Run typecheck on Protect**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -20
```

Expected: clean (TS + JSX both happy).

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/
git commit -m "Protect: scaffold routes/scan/v2/ shell"
```

### Task 1.3: JS — wire feature-flag dispatch on `/scan`

**Files:**
- Modify: `projects/plugins/protect/src/js/index.tsx:15-16,63` and surrounding.

The existing `<Route path="scan" element={ <ScanRoute /> } />` (line 63) becomes a flag-conditional that picks v1 or v2.

- [ ] **Step 1: Add a `useScanV2Enabled` helper hook**

Create `projects/plugins/protect/src/js/hooks/use-scan-v2-enabled/index.ts`:

```ts
/**
 * Reads the Protect Scan v2 feature flag.
 *
 * Truthy when EITHER:
 *   - the PHP constant JETPACK_PROTECT_SCAN_V2 is defined truthy
 *     (hydrated as `scanV2Enabled` on initial state), OR
 *   - the URL has `?protect-scan-v2=1`.
 */
type ProtectInitialState = {
    scanV2Enabled?: boolean;
};

declare const window: Window & {
    jetpackProtectInitialState?: ProtectInitialState;
};

export default function useScanV2Enabled(): boolean {
    if ( typeof window === 'undefined' ) {
        return false;
    }

    const fromConstant = Boolean( window.jetpackProtectInitialState?.scanV2Enabled );
    const fromUrl = new URLSearchParams( window.location.search ).has( 'protect-scan-v2' );
    return fromConstant || fromUrl;
}
```

- [ ] **Step 2: Add a dispatch route component**

Create `projects/plugins/protect/src/js/routes/scan/dispatch.tsx`:

```tsx
import useScanV2Enabled from '../../hooks/use-scan-v2-enabled';
import ScanRoute from './index';
import ScanV2Route from './v2';

/**
 * Stage 1 dispatch: chooses legacy ScanRoute or v2 based on the flag.
 * Stage 2 deletes this file and points the route directly at v2.
 */
export default function ScanDispatchRoute() {
    return useScanV2Enabled() ? <ScanV2Route /> : <ScanRoute />;
}
```

- [ ] **Step 3: Update `index.tsx` to use the dispatch**

In `projects/plugins/protect/src/js/index.tsx`, replace line 15:
```jsx
import ScanRoute from './routes/scan';
```
with:
```jsx
import ScanDispatchRoute from './routes/scan/dispatch';
```

And line 63:
```jsx
<Route path="scan" element={ <ScanRoute /> } />
```
with:
```jsx
<Route path="scan" element={ <ScanDispatchRoute /> } />
```

- [ ] **Step 4: Run typecheck and Jest**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect && pnpm jetpack test-js plugins/protect 2>&1 | tail -20
```

Expected: clean / existing Jest still passes.

- [ ] **Step 5: Manual sanity (optional but recommended)**

Build & rsync to JN, visit:
- `/wp-admin/admin.php?page=jetpack-protect#/scan` → legacy UI (flag off).
- `/wp-admin/admin.php?page=jetpack-protect?protect-scan-v2=1#/scan` → "Protect Scan v2 — placeholder".

(Note the `?` placement: it goes BEFORE the `#` since the URL flag is a query string, not a hash param.)

- [ ] **Step 6: Commit**

```bash
git add projects/plugins/protect/src/js/index.tsx \
        projects/plugins/protect/src/js/hooks/use-scan-v2-enabled/ \
        projects/plugins/protect/src/js/routes/scan/dispatch.tsx
git commit -m "Protect: dispatch /scan to v2 when feature flag is on"
```

### Task 1.4: Data layer — `types.ts`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/types.ts`

- [ ] **Step 1: Write the file**

```ts
/**
 * Re-exports the canonical Threat shape from `@automattic/jetpack-scan`
 * plus Protect-specific response wrappers. The Threat shape is the
 * upstream type rendered by ThreatsDataViews, so we never define our
 * own.
 */
export type { Threat, ThreatStatus } from '@automattic/jetpack-scan';

import type { Threat } from '@automattic/jetpack-scan';

export type SiteScanResponse = {
    state: 'idle' | 'enqueued' | 'running' | 'unavailable';
    progress?: number;
    threats: Threat[];
};

export type SiteScanHistoryResponse = {
    threats: Threat[];
};

export type SiteScanCountsResponse = {
    current: { threats: number };
    history: { threats: number };
};

export type FixThreatsResponse = {
    ok: boolean;
    threat_ids: number[];
};

export type ThreatFixStatus = {
    status: 'in_progress' | 'fixed' | 'not_fixed' | 'unknown';
    threat_id: number;
};
```

(Note: if the actual upstream `SiteScan*Response` shapes from `packages/scan/src/js/data/types.ts` differ, mirror them here — they're the source of truth. Run `cat projects/packages/scan/src/js/data/types.ts` before writing this file.)

- [ ] **Step 2: Verify the imports resolve**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/data/types.ts
git commit -m "Protect: scan v2 data types"
```

### Task 1.5: Data layer — mock mode

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/mock/index.ts`
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/mock/fixtures.ts`

- [ ] **Step 1: Write `mock/index.ts`**

```ts
/**
 * Detects Protect's mock-mode flag (?jpprotect-mock=1). Separate from
 * Scan's `?jps-mock=1` so each plugin can iterate without colliding.
 *
 * Per spec: if both `?jpprotect-mock=1` and `?jps-mock=1` are present,
 * Protect honors only its own flag.
 */
const MOCK_URL_PARAM = 'jpprotect-mock';

export function isProtectMockMode(): boolean {
    if ( typeof window === 'undefined' ) {
        return false;
    }
    return new URLSearchParams( window.location.search ).has( MOCK_URL_PARAM );
}
```

- [ ] **Step 2: Write `mock/fixtures.ts`**

Use four fixture threats: two active (one fixable malware, one ignorable vulnerability), two history (one fixed, one ignored). Threat shape must match upstream `Threat` exactly — copy structurally from `projects/packages/scan/src/js/data/mock/fixtures.ts` and adjust IDs/titles/timestamps so Protect's mock data is visibly distinct from Scan's.

```ts
import type {
    Threat,
    SiteScanResponse,
    SiteScanHistoryResponse,
    SiteScanCountsResponse,
    ThreatFixStatus,
} from '../types';

const ACTIVE_FIXABLE_MALWARE: Threat = {
    id: 'protect-mock-1',
    title: 'Malicious code in plugin',
    description: 'A backdoor was detected in a third-party plugin.',
    severity: 8,
    status: 'current',
    fixable: { fixer: 'replace', file: 'wp-content/plugins/example.php' },
    signature: 'EICAR-Test-Signature',
    firstDetected: '2026-04-15T12:00:00.000Z',
};

const ACTIVE_IGNORABLE_VULN: Threat = {
    id: 'protect-mock-2',
    title: 'Vulnerable plugin version',
    description: 'A plugin on this site has a known vulnerability.',
    severity: 5,
    status: 'current',
    fixable: false,
    firstDetected: '2026-04-20T08:00:00.000Z',
};

const HISTORY_FIXED: Threat = {
    id: 'protect-mock-3',
    title: 'Old malware (fixed)',
    description: 'A previously-detected malware sample, fixed.',
    severity: 7,
    status: 'fixed',
    fixedOn: '2026-04-25T16:00:00.000Z',
    firstDetected: '2026-04-10T09:00:00.000Z',
};

const HISTORY_IGNORED: Threat = {
    id: 'protect-mock-4',
    title: 'Ignored vulnerability',
    description: 'User chose to ignore this vulnerability.',
    severity: 3,
    status: 'ignored',
    firstDetected: '2026-04-08T13:00:00.000Z',
};

export const mockSiteScan: SiteScanResponse = {
    state: 'idle',
    threats: [ ACTIVE_FIXABLE_MALWARE, ACTIVE_IGNORABLE_VULN ],
};

export const mockSiteScanHistory: SiteScanHistoryResponse = {
    threats: [ HISTORY_FIXED, HISTORY_IGNORED ],
};

export const mockSiteScanCounts: SiteScanCountsResponse = {
    current: { threats: mockSiteScan.threats.length },
    history: { threats: mockSiteScanHistory.threats.length },
};

export const mockFixThreatsStatus: ThreatFixStatus[] = [
    { status: 'fixed', threat_id: 1 },
];
```

- [ ] **Step 3: Verify imports + typecheck**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
```

Expected: clean. If `Threat` exports `fixable` differently (object vs boolean), align with upstream.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/data/mock/
git commit -m "Protect: scan v2 mock-mode fixtures"
```

### Task 1.6: Data layer — `fetchers.ts`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/fetchers.ts`

- [ ] **Step 1: Write the file**

Read `projects/packages/scan/src/js/data/fetchers.ts` first to mirror its conventions exactly. Then:

```ts
import apiFetch from '@wordpress/api-fetch';
import { isProtectMockMode } from './mock';
import {
    mockSiteScan,
    mockSiteScanHistory,
    mockSiteScanCounts,
    mockFixThreatsStatus,
} from './mock/fixtures';
import type {
    SiteScanResponse,
    SiteScanHistoryResponse,
    SiteScanCountsResponse,
    FixThreatsResponse,
    ThreatFixStatus,
} from './types';

const REST_PREFIX = '/jetpack/v4/site/scan';

export async function fetchSiteScan(): Promise< SiteScanResponse > {
    if ( isProtectMockMode() ) {
        return mockSiteScan;
    }
    return apiFetch< SiteScanResponse >( { path: REST_PREFIX } );
}

export async function fetchSiteScanHistory(): Promise< SiteScanHistoryResponse > {
    if ( isProtectMockMode() ) {
        return mockSiteScanHistory;
    }
    return apiFetch< SiteScanHistoryResponse >( { path: `${ REST_PREFIX }/history` } );
}

export async function fetchSiteScanCounts(): Promise< SiteScanCountsResponse > {
    if ( isProtectMockMode() ) {
        return mockSiteScanCounts;
    }
    return apiFetch< SiteScanCountsResponse >( { path: `${ REST_PREFIX }/counts` } );
}

export async function ignoreThreat( threatId: string | number ): Promise< void > {
    if ( isProtectMockMode() ) {
        return;
    }
    await apiFetch( {
        path: `${ REST_PREFIX }/threat/${ threatId }/ignore`,
        method: 'POST',
    } );
}

export async function unignoreThreat( threatId: string | number ): Promise< void > {
    if ( isProtectMockMode() ) {
        return;
    }
    await apiFetch( {
        path: `${ REST_PREFIX }/threat/${ threatId }/unignore`,
        method: 'POST',
    } );
}

export async function fixThreats( threatIds: Array< string | number > ): Promise< FixThreatsResponse > {
    if ( isProtectMockMode() ) {
        return { ok: true, threat_ids: threatIds.map( Number ) };
    }
    return apiFetch< FixThreatsResponse >( {
        path: `${ REST_PREFIX }/threats/fix`,
        method: 'POST',
        data: { threat_ids: threatIds },
    } );
}

export async function fetchFixThreatsStatus(
    threatIds: Array< string | number >
): Promise< ThreatFixStatus[] > {
    if ( isProtectMockMode() ) {
        return mockFixThreatsStatus;
    }
    const params = threatIds.map( id => `threat_ids[]=${ id }` ).join( '&' );
    return apiFetch< ThreatFixStatus[] >( {
        path: `${ REST_PREFIX }/threats/fix-status?${ params }`,
    } );
}

export async function enqueueScan(): Promise< void > {
    if ( isProtectMockMode() ) {
        return;
    }
    await apiFetch( {
        path: `${ REST_PREFIX }/enqueue`,
        method: 'POST',
    } );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/data/fetchers.ts
git commit -m "Protect: scan v2 fetchers"
```

### Task 1.7: Data layer — `query-options.ts`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/query-options.ts`

- [ ] **Step 1: Write the file**

```ts
import { queryOptions } from '@tanstack/react-query';
import {
    fetchSiteScan,
    fetchSiteScanHistory,
    fetchSiteScanCounts,
} from './fetchers';

export const SCAN_QUERY_PREFIX = [ 'protect', 'scan' ] as const;

export function siteScanQuery() {
    return queryOptions( {
        queryKey: [ ...SCAN_QUERY_PREFIX, 'site' ] as const,
        queryFn: fetchSiteScan,
    } );
}

export function siteScanHistoryQuery() {
    return queryOptions( {
        queryKey: [ ...SCAN_QUERY_PREFIX, 'history' ] as const,
        queryFn: fetchSiteScanHistory,
    } );
}

export function siteScanCountsQuery() {
    return queryOptions( {
        queryKey: [ ...SCAN_QUERY_PREFIX, 'counts' ] as const,
        queryFn: fetchSiteScanCounts,
    } );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -5
git add projects/plugins/protect/src/js/routes/scan/v2/data/query-options.ts
git commit -m "Protect: scan v2 query-options"
```

### Task 1.8: Data layer — `use-track-event.ts`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/use-track-event.ts`

- [ ] **Step 1: Write the file**

```ts
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useCallback } from '@wordpress/element';

/**
 * Stable callback for emitting jetpack_protect_scan_* Tracks events.
 * Mirrors packages/scan's use-track-event.ts but with the Protect
 * namespace.
 */
export function useTrackEvent() {
    return useCallback(
        ( eventName: string, properties?: Record< string, unknown > ) => {
            jetpackAnalytics.tracks.recordEvent( eventName, properties );
        },
        []
    );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -5
git add projects/plugins/protect/src/js/routes/scan/v2/data/use-track-event.ts
git commit -m "Protect: scan v2 use-track-event"
```

### Task 1.9: Manual sanity — flag dispatch + mock mode

- [ ] **Step 1: Build + rsync**

```bash
cd /Users/ilona/jetpack && pnpm jetpack build plugins/jetpack --deps && pnpm jetpack rsync jetpack <jn-host>@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/jetpack --non-interactive
```

- [ ] **Step 2: Verify URLs**

| URL | Expected |
|---|---|
| `…?page=jetpack-protect#/scan` | Legacy UI (flag off). |
| `…?page=jetpack-protect&protect-scan-v2=1#/scan` | "Protect Scan v2 — placeholder" + console log. |
| `…?page=jetpack-protect&protect-scan-v2=1&jpprotect-mock=1#/scan` | Same placeholder; mock-mode is wired but no UI consumer yet (Phase 2 lights it up). |

If anything but legacy renders without the flag, stop and debug — don't continue to Phase 2.

---

## Phase 2 — Read paths + status filter + persistKey

The placeholder `<ThreatsScreen />` becomes the real `<ThreatsDataViews />` instance, fed by a merged active+history query, with the upstream status toggle inside the table.

### Task 2.1: Implement `useScanThreatsQuery` (merged query hook)

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/use-scan-threats-query.ts`

- [ ] **Step 1: Write the failing test**

Create `projects/plugins/protect/src/js/routes/scan/v2/data/test/use-scan-threats-query.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fetchers from '../fetchers';
import { useScanThreatsQuery } from '../use-scan-threats-query';
import type { ReactNode } from 'react';

jest.mock( '../fetchers' );

function wrapper( client: QueryClient ) {
    return ( { children }: { children: ReactNode } ) => (
        <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
}

function freshClient(): QueryClient {
    return new QueryClient( { defaultOptions: { queries: { retry: false } } } );
}

describe( 'useScanThreatsQuery', () => {
    afterEach( () => jest.resetAllMocks() );

    it( 'merges active and history threats keyed by id', async () => {
        ( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
            state: 'idle',
            threats: [ { id: 'a', status: 'current', title: 'A' } ],
        } );
        ( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( {
            threats: [ { id: 'b', status: 'fixed', title: 'B' } ],
        } );

        const client = freshClient();
        const { result } = renderHook( () => useScanThreatsQuery(), { wrapper: wrapper( client ) } );

        await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
        expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a', 'b' ] );
        expect( result.current.activeError ).toBeNull();
        expect( result.current.historyError ).toBeNull();
    } );

    it( 'surfaces history error without blocking active rows', async () => {
        ( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
            state: 'idle',
            threats: [ { id: 'a', status: 'current', title: 'A' } ],
        } );
        ( fetchers.fetchSiteScanHistory as jest.Mock ).mockRejectedValue( new Error( 'boom' ) );

        const client = freshClient();
        const { result } = renderHook( () => useScanThreatsQuery(), { wrapper: wrapper( client ) } );

        await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
        expect( result.current.data.map( t => t.id ) ).toEqual( [ 'a' ] );
        expect( result.current.historyError?.message ).toBe( 'boom' );
        expect( result.current.activeError ).toBeNull();
    } );

    it( 'returns the active error when the active query fails', async () => {
        ( fetchers.fetchSiteScan as jest.Mock ).mockRejectedValue( new Error( 'down' ) );
        ( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( { threats: [] } );

        const client = freshClient();
        const { result } = renderHook( () => useScanThreatsQuery(), { wrapper: wrapper( client ) } );

        await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
        expect( result.current.activeError?.message ).toBe( 'down' );
        expect( result.current.data ).toEqual( [] );
    } );

    it( 'dedupes overlapping threats by id, preferring active', async () => {
        ( fetchers.fetchSiteScan as jest.Mock ).mockResolvedValue( {
            state: 'idle',
            threats: [ { id: 'x', status: 'current', title: 'Active X' } ],
        } );
        ( fetchers.fetchSiteScanHistory as jest.Mock ).mockResolvedValue( {
            threats: [ { id: 'x', status: 'fixed', title: 'History X' } ],
        } );

        const client = freshClient();
        const { result } = renderHook( () => useScanThreatsQuery(), { wrapper: wrapper( client ) } );

        await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
        expect( result.current.data ).toHaveLength( 1 );
        expect( result.current.data[ 0 ].title ).toBe( 'Active X' );
    } );
} );
```

- [ ] **Step 2: Run, expect FAIL (hook not defined)**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=use-scan-threats-query 2>&1 | tail -30
```

Expected: FAIL `Cannot find module '../use-scan-threats-query'`.

- [ ] **Step 3: Implement the hook**

Create `projects/plugins/protect/src/js/routes/scan/v2/data/use-scan-threats-query.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from '@wordpress/element';
import { siteScanQuery, siteScanHistoryQuery } from './query-options';
import type { Threat } from './types';

export type UseScanThreatsResult = {
    data: Threat[];
    isLoading: boolean;
    isFetching: boolean;
    activeError: Error | null;
    historyError: Error | null;
    refetch: () => void;
};

/**
 * Merged query backing the Protect Scan v2 threat list. Calls both
 * the active and history endpoints in parallel and returns a single
 * deduped Threat array. Per spec §5:
 *  - Active fails: data is [], activeError is set; consumer renders an
 *    error block.
 *  - History fails: data has only active rows, historyError is set;
 *    consumer surfaces a snackbar with retry.
 *  - Both fail: data is [], both errors set.
 */
export function useScanThreatsQuery(): UseScanThreatsResult {
    const active = useQuery( siteScanQuery() );
    const history = useQuery( siteScanHistoryQuery() );

    const data = useMemo< Threat[] >( () => {
        const seen = new Map< string, Threat >();
        for ( const t of active.data?.threats ?? [] ) {
            seen.set( String( t.id ), t );
        }
        for ( const t of history.data?.threats ?? [] ) {
            if ( ! seen.has( String( t.id ) ) ) {
                seen.set( String( t.id ), t );
            }
        }
        return Array.from( seen.values() );
    }, [ active.data, history.data ] );

    const refetch = useCallback( () => {
        active.refetch();
        history.refetch();
    }, [ active, history ] );

    return {
        data: active.error ? [] : data,
        isLoading: active.isLoading || history.isLoading,
        isFetching: active.isFetching || history.isFetching,
        activeError: ( active.error as Error | null ) ?? null,
        historyError: ( history.error as Error | null ) ?? null,
        refetch,
    };
}
```

- [ ] **Step 4: Run, expect PASS**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=use-scan-threats-query 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/data/use-scan-threats-query.ts \
        projects/plugins/protect/src/js/routes/scan/v2/data/test/use-scan-threats-query.test.ts
git commit -m "Protect: scan v2 useScanThreatsQuery + tests"
```

### Task 2.2: Real `<ThreatsScreen />` rendering `<ThreatsDataViews />`

**Files:**
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx`

- [ ] **Step 1: Replace the placeholder with the real component**

```tsx
import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useScanThreatsQuery } from '../data/use-scan-threats-query';
import { useTrackEvent } from '../data/use-track-event';
import type { Threat } from '../data/types';

const PERSIST_KEY = 'jetpack-protect:scan:view';
const TRACK_PREFIX = 'jetpack_protect_scan_';

const isFixable = ( t: Threat ) => Boolean( t.fixable );
const isCurrent = ( t: Threat ) => t.status === 'current';
const isIgnored = ( t: Threat ) => t.status === 'ignored';

export default function ThreatsScreen() {
    const { data, isLoading, activeError } = useScanThreatsQuery();
    const trackEvent = useTrackEvent();

    if ( isLoading ) {
        return null; // Phase 6 replaces with a skeleton.
    }

    if ( activeError ) {
        return (
            <div data-testid="protect-scan-v2-error">
                { 'Couldn’t load your threats. Please try again.' }
            </div>
        );
    }

    return (
        <ThreatsDataViews
            data={ data }
            showStatusFilter={ true }
            filters={ [ { field: 'status', operator: 'isAny', value: [ 'current' ] } ] }
            persistKey={ PERSIST_KEY }
            isThreatEligibleForFix={ isFixable }
            isThreatEligibleForIgnore={ isCurrent }
            isThreatEligibleForUnignore={ isIgnored }
            onTrackEvent={ ( name, properties ) =>
                trackEvent( `${ TRACK_PREFIX }${ name }`, properties )
            }
        />
    );
}
```

(`onFixThreats` / `onIgnoreThreats` / `onUnignoreThreats` and the `Render*Modal` props arrive in Phase 3. Empty slot lands in Phase 6. ScanStatus takeover is Phase 5.)

- [ ] **Step 2: Typecheck**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
```

Expected: clean. If `Threat.fixable` is an object (not boolean) per upstream, `isFixable` becomes `Boolean( t.fixable )` (already covered) but verify shape.

- [ ] **Step 3: Manual sanity (after build + rsync)**

Visit `…?page=jetpack-protect&protect-scan-v2=1&jpprotect-mock=1#/scan`. Expected: ThreatsDataViews renders with the in-table Active/History toggle (defaulting to Active), the two active mock threats are listed, and switching to History shows the two historical mock threats.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx
git commit -m "Protect: scan v2 ThreatsScreen renders ThreatsDataViews"
```

### Task 2.3: Mount `<ScanV2Route />` shell — QueryClientProvider scope check

Protect's app shell already sits inside a `QueryClientProvider` (see `projects/plugins/protect/src/js/index.tsx:21–27`), so `useScanThreatsQuery` runs against the existing client. No additional provider needed for the v2 route.

- [ ] **Step 1: Confirm the existing client's `staleTime: Infinity` is fine for our queries**

Read `projects/plugins/protect/src/js/index.tsx:21–27`. The default is `staleTime: Infinity`, which means tabs won't refetch on navigation. That matches `packages/scan`'s expectation; mutations explicitly invalidate the prefix on success (Phase 3).

- [ ] **Step 2: No code change. Document in `routes/scan/v2/index.tsx` module comment**

Edit `projects/plugins/protect/src/js/routes/scan/v2/index.tsx` to add at the top of the module comment block:

```
 * The route relies on the QueryClientProvider mounted higher up in
 * `src/js/index.tsx`. We do not declare a sub-client here.
```

- [ ] **Step 3: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/index.tsx
git commit -m "Protect: document scan v2 query-client scope"
```

### Task 2.4: Snackbar list mounted inside the route

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/notices-list.tsx`
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/index.tsx`

Mirrors `packages/scan/src/js/notices-list.tsx`.

- [ ] **Step 1: Write `notices-list.tsx`**

```tsx
import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

const MAX_VISIBLE = 3;

export default function NoticesList() {
    const notices = useSelect(
        select => select( noticesStore ).getNotices().filter( n => n.type === 'snackbar' ),
        []
    );
    const { removeNotice } = useDispatch( noticesStore );

    if ( notices.length === 0 ) {
        return null;
    }

    return (
        <SnackbarList
            notices={ notices.slice( -MAX_VISIBLE ) }
            onRemove={ removeNotice }
        />
    );
}
```

- [ ] **Step 2: Mount inside `routes/scan/v2/index.tsx`**

Replace the body of `ScanV2Route()` to:

```tsx
return (
    <>
        <ThreatsScreen />
        <NoticesList />
    </>
);
```

Add the import: `import NoticesList from './notices-list';`

- [ ] **Step 3: Typecheck and commit**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
git add projects/plugins/protect/src/js/routes/scan/v2/notices-list.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/index.tsx
git commit -m "Protect: scan v2 SnackbarList mount"
```

### Task 2.5: Mock-mode dev banner

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/mock-banner.tsx`
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/index.tsx`

- [ ] **Step 1: Write `mock-banner.tsx`** (mirror `packages/scan/src/js/mock-banner.tsx` shape, copy/adapt)

```tsx
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isProtectMockMode } from './data/mock';

export default function MockBanner() {
    if ( ! isProtectMockMode() ) {
        return null;
    }
    return (
        <Notice status="warning" isDismissible={ false }>
            { __( 'Dev mode (?jpprotect-mock=1) — fixtures only, no server requests.', 'jetpack-protect' ) }
        </Notice>
    );
}
```

- [ ] **Step 2: Mount in `index.tsx`**

```tsx
return (
    <>
        <MockBanner />
        <ThreatsScreen />
        <NoticesList />
    </>
);
```

Add import: `import MockBanner from './mock-banner';`

- [ ] **Step 3: Manual sanity**

After build + rsync: with `?jpprotect-mock=1`, banner appears; without it, no banner.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/mock-banner.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/index.tsx
git commit -m "Protect: scan v2 mock-mode banner"
```

---

## Phase 3 — Row actions + four `Render*Modal` modals

Single-threat ignore/unignore/fix flows + view-details modal, all wired through the `Render*Modal` props.

### Task 3.1: Mutations — `useThreatMutations.ts`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/use-threat-mutations.ts`
- Test: `projects/plugins/protect/src/js/routes/scan/v2/data/test/use-threat-mutations.test.ts`

- [ ] **Step 1: Write the failing test (sketch — verify coverage of cache invalidation)**

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as fetchers from '../fetchers';
import {
    useFixThreatsMutation,
    useIgnoreThreatMutation,
    useUnignoreThreatMutation,
    useEnqueueScanMutation,
} from '../use-threat-mutations';
import { SCAN_QUERY_PREFIX } from '../query-options';

jest.mock( '../fetchers' );

function wrap( client: QueryClient ) {
    return ( { children }: { children: React.ReactNode } ) => (
        <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
}

describe( 'threat mutations', () => {
    it( 'fixThreats invalidates SCAN_QUERY_PREFIX on success', async () => {
        ( fetchers.fixThreats as jest.Mock ).mockResolvedValue( { ok: true, threat_ids: [ 1 ] } );
        const client = new QueryClient();
        const spy = jest.spyOn( client, 'invalidateQueries' );

        const { result } = renderHook( () => useFixThreatsMutation(), { wrapper: wrap( client ) } );
        await act( async () => {
            await result.current.mutateAsync( [ 1 ] );
        } );

        expect( spy ).toHaveBeenCalledWith( { queryKey: SCAN_QUERY_PREFIX } );
    } );

    // Repeat shape for ignore / unignore / enqueue.
} );
```

(Repeat the same body for `useIgnoreThreatMutation`, `useUnignoreThreatMutation`, `useEnqueueScanMutation` — each calls its respective fetcher and invalidates the same prefix.)

- [ ] **Step 2: Run, expect FAIL**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=use-threat-mutations 2>&1 | tail -20
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hooks**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fixThreats,
    ignoreThreat,
    unignoreThreat,
    enqueueScan,
} from './fetchers';
import { SCAN_QUERY_PREFIX } from './query-options';

export function useFixThreatsMutation() {
    const queryClient = useQueryClient();
    return useMutation( {
        mutationFn: ( threatIds: Array< string | number > ) => fixThreats( threatIds ),
        onSuccess: () => queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } ),
    } );
}

export function useIgnoreThreatMutation() {
    const queryClient = useQueryClient();
    return useMutation( {
        mutationFn: ( threatId: string | number ) => ignoreThreat( threatId ),
        onSuccess: () => queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } ),
    } );
}

export function useUnignoreThreatMutation() {
    const queryClient = useQueryClient();
    return useMutation( {
        mutationFn: ( threatId: string | number ) => unignoreThreat( threatId ),
        onSuccess: () => queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } ),
    } );
}

export function useEnqueueScanMutation() {
    const queryClient = useQueryClient();
    return useMutation( {
        mutationFn: () => enqueueScan(),
        onSuccess: () => queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } ),
    } );
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=use-threat-mutations 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/data/use-threat-mutations.ts \
        projects/plugins/protect/src/js/routes/scan/v2/data/test/use-threat-mutations.test.ts
git commit -m "Protect: scan v2 threat mutations"
```

### Task 3.2: Fix-status polling — `useFixThreatsStatusQuery`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/data/use-fix-threats-status.ts`
- Test: `projects/plugins/protect/src/js/routes/scan/v2/data/test/use-fix-threats-status.test.ts`

Mirror `packages/scan/src/js/data/use-fix-threats-status.ts` exactly. The polling logic + `isFixComplete` predicate should be identical (re-export from upstream if exposed; otherwise copy with attribution comment).

- [ ] **Step 1: Read the upstream and copy/adapt**

```bash
cat projects/packages/scan/src/js/data/use-fix-threats-status.ts
```

- [ ] **Step 2: Implement the hook + write 5 unit tests covering the `isFixComplete` predicate** (undefined / empty / partial / terminal / unknown — same shape as `packages/scan/src/js/data/test/use-fix-threats-status.test.ts`)

- [ ] **Step 3: Run, expect PASS, then commit.**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=use-fix-threats-status
git add projects/plugins/protect/src/js/routes/scan/v2/data/use-fix-threats-status.ts \
        projects/plugins/protect/src/js/routes/scan/v2/data/test/use-fix-threats-status.test.ts
git commit -m "Protect: scan v2 fix-status polling"
```

### Task 3.3: `<FixThreatModal />` (single-threat fix)

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/fix-threat-modal.tsx`

- [ ] **Step 1: Read the upstream for shape**

```bash
cat projects/packages/scan/src/js/screens/overview/fix-threat-modal.tsx
```

- [ ] **Step 2: Implement Protect's version (same UX, Protect copy + tracks namespace)**

```tsx
import { Button, Modal, Notice } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { RenderModalProps } from '@wordpress/dataviews';
import type { Threat } from '../data/types';
import { useFixThreatsMutation } from '../data/use-threat-mutations';
import { useFixThreatsStatusQuery } from '../data/use-fix-threats-status';
import { useTrackEvent } from '../data/use-track-event';

export default function FixThreatModal( {
    items,
    closeModal,
}: RenderModalProps< Threat > ) {
    const threat = items[ 0 ];
    const trackEvent = useTrackEvent();
    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
    const fixMutation = useFixThreatsMutation();
    const [ submitted, setSubmitted ] = useState( false );

    const fixStatus = useFixThreatsStatusQuery(
        submitted ? [ threat.id ] : []
    );

    const isComplete = fixStatus.data?.every(
        s => s.status === 'fixed' || s.status === 'not_fixed'
    );

    if ( submitted && isComplete ) {
        const ok = fixStatus.data?.every( s => s.status === 'fixed' );
        if ( ok ) {
            createSuccessNotice( __( 'Threat fixed.', 'jetpack-protect' ), { type: 'snackbar' } );
        } else {
            createErrorNotice( __( 'We couldn’t fix that threat.', 'jetpack-protect' ), {
                type: 'snackbar',
            } );
        }
        closeModal();
    }

    const onConfirm = async () => {
        trackEvent( 'jetpack_protect_scan_fix_threat_modal_click', { threat_id: threat.id } );
        try {
            await fixMutation.mutateAsync( [ threat.id ] );
            setSubmitted( true );
        } catch {
            createErrorNotice( __( 'Could not start the fix.', 'jetpack-protect' ), {
                type: 'snackbar',
            } );
        }
    };

    return (
        <Modal title={ __( 'Fix threat', 'jetpack-protect' ) } onRequestClose={ closeModal }>
            <p>{ threat.title }</p>
            { submitted && ! isComplete && (
                <Notice status="info" isDismissible={ false }>
                    { __( 'Fixing…', 'jetpack-protect' ) }
                </Notice>
            ) }
            <div className="protect-modal-actions">
                <Button variant="tertiary" onClick={ closeModal }>
                    { __( 'Cancel', 'jetpack-protect' ) }
                </Button>
                <Button
                    variant="primary"
                    onClick={ onConfirm }
                    isBusy={ fixMutation.isPending || ( submitted && ! isComplete ) }
                >
                    { __( 'Fix threat', 'jetpack-protect' ) }
                </Button>
            </div>
        </Modal>
    );
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect 2>&1 | head -10
git add projects/plugins/protect/src/js/routes/scan/v2/screens/fix-threat-modal.tsx
git commit -m "Protect: scan v2 FixThreatModal"
```

### Task 3.4: `<IgnoreThreatModal />`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/ignore-threat-modal.tsx`

Same shape as Task 3.3 but for ignore. Mirror upstream `packages/scan/src/js/screens/overview/ignore-threat-modal.tsx`. Use `useIgnoreThreatMutation`, fire `jetpack_protect_scan_ignore_threat_modal_click`, success snackbar `__( 'Threat ignored.', 'jetpack-protect' )`. Modal title `__( 'Ignore threat', 'jetpack-protect' )`. Single-step mutation — no polling.

Read upstream, write component, typecheck, commit.

- [ ] **Step 1: Read upstream**: `cat projects/packages/scan/src/js/screens/overview/ignore-threat-modal.tsx`
- [ ] **Step 2: Write Protect's version with `jetpack-protect` text-domain + Protect tracks namespace**
- [ ] **Step 3: Typecheck, commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/ignore-threat-modal.tsx
git commit -m "Protect: scan v2 IgnoreThreatModal"
```

### Task 3.5: `<UnignoreThreatModal />`

Same as Task 3.4 with `useUnignoreThreatMutation`, modal title `__( 'Unignore threat', 'jetpack-protect' )`, snackbar `__( 'Threat unignored.', 'jetpack-protect' )`, tracks `jetpack_protect_scan_unignore_threat_modal_click`.

- [ ] **Step 1**: Read upstream `unignore-threat-modal.tsx`
- [ ] **Step 2**: Write + typecheck
- [ ] **Step 3**: Commit `Protect: scan v2 UnignoreThreatModal`

### Task 3.6: `<ViewDetailsModal />`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/view-details-modal.tsx`

Read-only modal. Title: `__( 'Threat details', 'jetpack-protect' )`. Renders threat metadata: severity badge (`ThreatSeverityBadge` from `@automattic/jetpack-scan`), title, description, signature, filename + diff (if present), first detected, fixed-on (if status === 'fixed').

- [ ] **Step 1**: Read upstream `view-details-modal.tsx`
- [ ] **Step 2**: Write Protect's version. Modal `size="large"`. No mutation, just display.
- [ ] **Step 3**: Typecheck, commit `Protect: scan v2 ViewDetailsModal`

### Task 3.7: Wire all four `Render*Modal` props into `<ThreatsScreen />`

**Files:**
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx`

- [ ] **Step 1: Update `<ThreatsDataViews />` props**

```tsx
import FixThreatModal from './fix-threat-modal';
import IgnoreThreatModal from './ignore-threat-modal';
import UnignoreThreatModal from './unignore-threat-modal';
import ViewDetailsModal from './view-details-modal';

// inside the return:
<ThreatsDataViews
    data={ data }
    showStatusFilter={ true }
    filters={ [ { field: 'status', operator: 'isAny', value: [ 'current' ] } ] }
    persistKey={ PERSIST_KEY }
    isThreatEligibleForFix={ isFixable }
    isThreatEligibleForIgnore={ isCurrent }
    isThreatEligibleForUnignore={ isIgnored }
    onTrackEvent={ ( name, properties ) =>
        trackEvent( `${ TRACK_PREFIX }${ name }`, properties )
    }
    RenderFixModal={ FixThreatModal }
    RenderIgnoreModal={ IgnoreThreatModal }
    RenderUnignoreModal={ UnignoreThreatModal }
    RenderViewModal={ ViewDetailsModal }
/>
```

- [ ] **Step 2: Manual sanity**

After build + rsync, with mock mode + flag:
- Click "Fix" on the active fixable threat → modal opens, confirm → snackbar fires → threat moves to History as fixed.
- Click "Ignore" on the second active threat → modal opens, confirm → snackbar fires → threat moves to History as ignored.
- Toggle to History, click "Unignore" → reverse flow.
- Click "View details" on any row → read-only modal renders with all the threat metadata.

(In mock mode, the table won't actually update because mock data is static. The mutations resolve immediately and snackbars fire, but the data stays put. That's expected — full round-trip happens in live mode.)

- [ ] **Step 3: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx
git commit -m "Protect: scan v2 wire row-action modals"
```

---

## Phase 4 — Bulk fix CTA + `<BulkFixModal />`

Inline CTA strip above DataViews (per spec §7 — no `HeaderActionsProvider`). Conditional "Auto-fix N threats" when fixable+current rows exist.

### Task 4.1: `<BulkFixModal />`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/bulk-fix-modal.tsx`

Mirror `packages/scan/src/js/screens/overview/bulk-fix-modal.tsx`. State machine: `'confirm' → 'progress' → 'done'`.

- [ ] **Step 1: Read upstream**

```bash
cat projects/packages/scan/src/js/screens/overview/bulk-fix-modal.tsx
```

- [ ] **Step 2: Implement Protect's version**

Key differences from upstream: text-domain `jetpack-protect`, tracks namespace `jetpack_protect_scan_*` (events: `bulk_fix_threats_modal_open`, `bulk_fix_threats_modal_click`, `bulk_fix_threats_modal_success`, `bulk_fix_threats_modal_failed`).

Component signature:

```tsx
type BulkFixModalProps = {
    threats: Threat[]; // pre-filtered by the caller to current+fixable
    isOpen: boolean;
    onClose: () => void;
};

export default function BulkFixModal( { threats, isOpen, onClose }: BulkFixModalProps ) {
    // ... state machine ...
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/bulk-fix-modal.tsx
git commit -m "Protect: scan v2 BulkFixModal"
```

### Task 4.2: `<CtaStrip />` + state in `<ThreatsScreen />`

**Files:**
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx`
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/cta-strip.tsx` (or inline)

- [ ] **Step 1: Add `useState` for bulk-fix open flag and a `fixableActive` derived list**

In `threats.tsx`, above the return:

```tsx
import { useState, useMemo } from '@wordpress/element';
import BulkFixModal from './bulk-fix-modal';
// ... existing imports ...

const [ bulkFixOpen, setBulkFixOpen ] = useState( false );
const fixableActive = useMemo(
    () => data.filter( t => t.status === 'current' && Boolean( t.fixable ) ),
    [ data ]
);
```

- [ ] **Step 2: Render the inline CTA strip above `<ThreatsDataViews />`**

```tsx
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

// inside the return, BEFORE <ThreatsDataViews />:
<div className="protect-scan-v2-cta-strip">
    {/* Phase 5 will add <ScanNowButton /> here. */}
    { fixableActive.length > 0 && (
        <Button
            variant="primary"
            onClick={ () => {
                trackEvent( 'jetpack_protect_scan_fix_threats_cta_click', {
                    threat_count: fixableActive.length,
                } );
                setBulkFixOpen( true );
            } }
        >
            { sprintf(
                // translators: %d is the number of fixable threats.
                __( 'Auto-fix %d threats', 'jetpack-protect' ),
                fixableActive.length
            ) }
        </Button>
    ) }
</div>
<BulkFixModal
    threats={ fixableActive }
    isOpen={ bulkFixOpen }
    onClose={ () => setBulkFixOpen( false ) }
/>
```

- [ ] **Step 3: Typecheck, manual sanity**

With mock mode: `Auto-fix 1 threats` button visible (only one fixable+current in fixtures). Click → `BulkFixModal` opens, confirms, transitions to "done", closes, snackbar.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/screens/bulk-fix-modal.tsx
git commit -m "Protect: scan v2 CTA strip + BulkFixModal wiring"
```

---

## Phase 5 — Scan-now CTA + scan-progress takeover

### Task 5.1: `<ScanNowButton />`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/scan-now-button.tsx`

- [ ] **Step 1: Read upstream**

```bash
cat projects/packages/scan/src/js/screens/overview/scan-now-button.tsx
```

- [ ] **Step 2: Implement Protect's version**

```tsx
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useQueryClient } from '@tanstack/react-query';
import { useEnqueueScanMutation } from '../data/use-threat-mutations';
import { useTrackEvent } from '../data/use-track-event';
import { siteScanQuery } from '../data/query-options';

type ScanNowButtonProps = {
    disabled?: boolean;
};

export default function ScanNowButton( { disabled }: ScanNowButtonProps ) {
    const enqueue = useEnqueueScanMutation();
    const trackEvent = useTrackEvent();
    const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
    const queryClient = useQueryClient();

    const onClick = async () => {
        trackEvent( 'jetpack_protect_scan_now', {} );
        try {
            await enqueue.mutateAsync();
            queryClient.invalidateQueries( siteScanQuery() );
            createSuccessNotice( __( 'Scan started.', 'jetpack-protect' ), { type: 'snackbar' } );
        } catch {
            createErrorNotice( __( 'Could not start the scan.', 'jetpack-protect' ), {
                type: 'snackbar',
            } );
        }
    };

    return (
        <Button variant="secondary" onClick={ onClick } disabled={ disabled || enqueue.isPending }>
            { __( 'Scan now', 'jetpack-protect' ) }
        </Button>
    );
}
```

- [ ] **Step 3: Mount in `<CtaStrip />` (the section above the bulk-fix CTA in `threats.tsx`)**

In `threats.tsx`'s CTA strip block:

```tsx
<div className="protect-scan-v2-cta-strip">
    <ScanNowButton disabled={ isScanRunning } />
    { fixableActive.length > 0 && ( /* existing Auto-fix button */ ) }
</div>
```

(`isScanRunning` is added in Task 5.2.)

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/scan-now-button.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx
git commit -m "Protect: scan v2 ScanNowButton"
```

### Task 5.2: `<ScanStatus />` and progress takeover

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/scan-status.tsx`
- Modify: `projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx`

- [ ] **Step 1: Read upstream**

```bash
cat projects/packages/scan/src/js/screens/overview/scan-status.tsx
```

- [ ] **Step 2: Implement Protect's `<ScanStatus />` (same shape; spinner + heading + muted body + ProgressBar)**

```tsx
import { ProgressBar, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { SiteScanResponse } from '../data/types';

type ScanStatusProps = {
    state: SiteScanResponse[ 'state' ];
    progress?: number;
};

export default function ScanStatus( { state, progress }: ScanStatusProps ) {
    const heading =
        state === 'enqueued'
            ? __( 'Scan queued…', 'jetpack-protect' )
            : __( 'Scanning your site…', 'jetpack-protect' );

    return (
        <div className="protect-scan-status">
            <Spinner />
            <h2>{ heading }</h2>
            <p>{ __( 'This usually takes a few minutes.', 'jetpack-protect' ) }</p>
            { state === 'running' && typeof progress === 'number' && (
                <ProgressBar value={ progress } />
            ) }
        </div>
    );
}
```

- [ ] **Step 3: Wire scan state into `<ThreatsScreen />`**

In `threats.tsx`, add:

```tsx
import { useQuery } from '@tanstack/react-query';
import { siteScanQuery } from '../data/query-options';
import ScanStatus from './scan-status';

// inside the component:
const scanQuery = useQuery( siteScanQuery() );
const isScanRunning =
    scanQuery.data?.state === 'enqueued' || scanQuery.data?.state === 'running';

// inside the return, replacing <ThreatsDataViews /> alone:
{ isScanRunning ? (
    <ScanStatus
        state={ scanQuery.data!.state }
        progress={ scanQuery.data?.progress }
    />
) : (
    <ThreatsDataViews ... />
) }
```

The CTA strip stays visible during scanning; only the body swaps.

- [ ] **Step 4: Manual sanity (live mode preferred)**

In live mode on a paid JN site, click Scan-now: page shows ScanStatus until WPCOM returns to idle, then snaps back to ThreatsDataViews.

- [ ] **Step 5: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/scan-status.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx
git commit -m "Protect: scan v2 scan-progress takeover"
```

---

## Phase 6 — Empty state dispatch (free upsell vs paid "all clear")

### Task 6.1: `<EmptyState />`

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/empty-state.tsx`

- [ ] **Step 1: Implement**

```tsx
import { ContextualUpgradeTrigger, Title, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import usePlan from '../../../../hooks/use-plan';
import { useProtectScanCheckout } from '../data/use-checkout'; // if a similar hook is already in Protect — otherwise reuse usePlan().getScanRedirect

export default function EmptyState() {
    const { hasPlan, isLoading } = usePlan();

    if ( isLoading ) {
        // Skeleton — NOT an optimistic Free flash that could whiplash.
        return (
            <div className="protect-scan-v2-empty-skeleton" aria-hidden="true">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
            </div>
        );
    }

    if ( hasPlan ) {
        return (
            <div className="protect-scan-v2-empty">
                <Title>{ __( 'You’re all clear', 'jetpack-protect' ) }</Title>
                <Text>{ __( 'No threats found in your most recent scan.', 'jetpack-protect' ) }</Text>
            </div>
        );
    }

    // Free tier upsell — copy reused from current scan-footer.jsx.
    const { getScan } = usePlan(); // existing hook returns a getScan() callback that opens checkout
    return (
        <div className="protect-scan-v2-empty-upsell">
            <Title>{ __( 'Advanced scan results', 'jetpack-protect' ) }</Title>
            <Text mb={ 3 }>
                { __(
                    'Upgrade Jetpack Protect to get advanced scan tools, including one-click fixes for most threats and malware scanning.',
                    'jetpack-protect'
                ) }
            </Text>
            <ContextualUpgradeTrigger
                description={ __(
                    'Looking for advanced scan results and one-click fixes?',
                    'jetpack-protect'
                ) }
                cta={ __( 'Upgrade Jetpack Protect now', 'jetpack-protect' ) }
                onClick={ getScan }
            />
        </div>
    );
}
```

(If `usePlan().getScan` doesn't exist with that exact name, search Protect's existing `usePlan` hook output for the existing checkout-launch callback and use that. The shape is well-established — `scan-footer.jsx:64–66` already calls `onClick={ getScan }`.)

- [ ] **Step 2: Wire into `<ThreatsScreen />`**

```tsx
import EmptyState from './empty-state';

// inside <ThreatsDataViews ... />:
empty={ <EmptyState /> }
```

- [ ] **Step 3: Manual sanity**

- Free site: empty slot shows upsell card with the spec'd copy.
- Paid + zero rows: "You're all clear".
- Paid + zero rows + History toggle: same "You're all clear" — known limitation §1, deferred.

- [ ] **Step 4: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/empty-state.tsx \
        projects/plugins/protect/src/js/routes/scan/v2/screens/threats.tsx
git commit -m "Protect: scan v2 EmptyState (free upsell / paid all-clear)"
```

### Task 6.2: Test — `<EmptyState />` plan dispatch

**Files:**
- Create: `projects/plugins/protect/src/js/routes/scan/v2/screens/test/empty-state.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import EmptyState from '../empty-state';

jest.mock( '../../../../hooks/use-plan', () => ( {
    __esModule: true,
    default: jest.fn(),
} ) );

import usePlan from '../../../../hooks/use-plan';

const mockUsePlan = usePlan as jest.Mock;

describe( '<EmptyState />', () => {
    afterEach( () => mockUsePlan.mockReset() );

    it( 'renders the skeleton while plan is loading', () => {
        mockUsePlan.mockReturnValue( { isLoading: true } );
        render( <EmptyState /> );
        expect( document.querySelector( '.protect-scan-v2-empty-skeleton' ) ).toBeInTheDocument();
    } );

    it( 'renders all-clear when paid', () => {
        mockUsePlan.mockReturnValue( { isLoading: false, hasPlan: true } );
        render( <EmptyState /> );
        expect( screen.getByText( /all clear/i ) ).toBeInTheDocument();
    } );

    it( 'renders the upsell when free', () => {
        mockUsePlan.mockReturnValue( {
            isLoading: false,
            hasPlan: false,
            getScan: jest.fn(),
        } );
        render( <EmptyState /> );
        expect( screen.getByText( /upgrade jetpack protect/i ) ).toBeInTheDocument();
    } );
} );
```

- [ ] **Step 2: Run, expect PASS**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect -- --testPathPattern=empty-state
```

- [ ] **Step 3: Commit**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/screens/test/empty-state.test.tsx
git commit -m "Protect: scan v2 EmptyState test"
```

---

## Phase 7 — Tracks events through `@automattic/jetpack-analytics`

The `useTrackEvent` hook already exists from Task 1.8. The wiring across modals + CTAs already calls `trackEvent( 'jetpack_protect_scan_*', ... )` with the right payloads (Tasks 3.3–3.7, 4.2, 5.1). This phase is verification — confirming all events from spec §9 actually fire, and adding any that were missed.

### Task 7.1: Audit event coverage

- [ ] **Step 1: Grep for every `jetpack_protect_scan_` call in the v2 tree**

```bash
grep -rn "jetpack_protect_scan_" /Users/ilona/jetpack/projects/plugins/protect/src/js/routes/scan/v2/
```

- [ ] **Step 2: Cross-reference against the spec §9 table**

Every row in the table:
- `_scan_now` ✓ (Task 5.1)
- `_fix_threats_cta_click` ✓ (Task 4.2)
- `_bulk_fix_threats_modal_open` (Task 4.1 — verify)
- `_bulk_fix_threats_modal_click` (Task 4.1 — verify)
- `_bulk_fix_threats_modal_success` (Task 4.1 — verify)
- `_bulk_fix_threats_modal_failed` (Task 4.1 — verify)
- `_search` / `_layout_changed` / `_page_change` / `_filter_change` / `_view_change` — all forwarded by the `onTrackEvent` lambda in `<ThreatsDataViews />` (Task 2.2 / 3.7).

- [ ] **Step 3: Add any missing events with the correct payloads**

For any row in the spec table without a grep hit in v2/, add the event at the call site. Re-run the grep until every row is accounted for.

- [ ] **Step 4: Commit (only if changes)**

```bash
git add projects/plugins/protect/src/js/routes/scan/v2/
git commit -m "Protect: scan v2 ensure all spec'd Tracks events fire"
```

### Task 7.2: Manual verification on JN

- [ ] **Step 1: Build + rsync to a JN site (paid plan)**
- [ ] **Step 2: Open DevTools → Network, filter for `tracks.pixel.wp.com`**
- [ ] **Step 3: Trigger each event from the spec §9 table; confirm each fires with the documented payload shape**

If any payload is missing or wrong, fix at the call site, re-test, commit.

---

## Phase 8 — Tests + manual walkthrough

### Task 8.1: Run all Jest + PHPUnit suites green

- [ ] **Step 1: Protect Jest**

```bash
cd /Users/ilona/jetpack && pnpm jetpack test-js plugins/protect 2>&1 | tail -30
```

Expected: all green.

- [ ] **Step 2: Scan PHPUnit**

```bash
cd /Users/ilona/jetpack/projects/packages/scan && composer phpunit
```

Expected: all green (including the two new tests).

- [ ] **Step 3: Lint + typecheck across both projects**

```bash
cd /Users/ilona/jetpack && pnpm jetpack lint plugins/protect packages/scan
cd /Users/ilona/jetpack && pnpm jetpack typecheck plugins/protect packages/scan
```

Expected: clean.

### Task 8.2: Changelog entry for Protect

**Files:**
- Create: `projects/plugins/protect/changelog/add-scan-v2-feature-flagged`

- [ ] **Step 1: Write**

```
Significance: minor
Type: added

New Scan UI based on the dataviews component, available behind the JETPACK_PROTECT_SCAN_V2 PHP constant or the ?protect-scan-v2=1 URL flag. Stage 1 of a two-stage migration; legacy UI remains the default. No changes for users who don't enable the flag.
```

- [ ] **Step 2: Commit**

```bash
git add projects/plugins/protect/changelog/add-scan-v2-feature-flagged
git commit -m "Protect: changelog for Scan v2 stage 1"
```

### Task 8.3: Manual JN walkthrough — full test plan from spec §Test plan

- [ ] **Step 1: Mock-mode (no Scan plan needed)**
  - `?protect-scan-v2=1&jpprotect-mock=1#/scan` shows ThreatsDataViews with active+history toggle.
  - Active default; toggle to History; persistence across reload (clear/dirty toggle).
  - Auto-fix 1 → bulk-fix modal → progress → done.
  - Per-row: fix / ignore / unignore / view-details — each modal opens, confirms, snackbar fires.
  - `/scan/history` — Stage 1 leaves this route in place; verify it still works.

- [ ] **Step 2: Free site (live mode, no plan)**
  - `?protect-scan-v2=1#/scan` shows EmptyState upsell card.
  - No JS errors in console.

- [ ] **Step 3: Paid site (live mode)**
  - `?protect-scan-v2=1#/scan` shows real WPCOM threat list.
  - Round-trip fix / ignore / unignore / view-details with WPCOM successfully.
  - Scan-now → scan progress → return to threats list.
  - DevTools confirms `jetpack_protect_scan_*` Tracks events fire on each interaction.

- [ ] **Step 4: Flag off**
  - `#/scan` (no flag) shows the legacy UI unchanged.
  - No console warnings, no extra network requests, no double-render.

- [ ] **Step 5: Mark this task complete only if every checkbox above is green**

---

## Stage 1 PR — final assembly

- [ ] **Step 1: Confirm branch is clean**

```bash
git status
git log --oneline trunk..HEAD
```

Expected: ~30 small commits across Phase 0–8.

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin update/protect-scan-v2-stage1
gh pr create --base trunk --draft --title "Protect: introduce Scan v2 behind feature flag (Stage 1 of 2)" --body "$(cat <<'EOF'
## Summary

Stage 1 of two-stage migration — see [projects/plugins/protect/docs/scan-v2/design.md](./projects/plugins/protect/docs/scan-v2/design.md).

Introduces the new dataviews-based Scan UI inside Protect, gated behind:
- PHP constant `JETPACK_PROTECT_SCAN_V2`, or
- URL flag `?protect-scan-v2=1`.

Legacy UI is the default; this PR adds new code without removing any old code.

## Stage 2 (follow-up PR)

After this lands and soaks, Stage 2 flips the default, removes the flag plumbing, and deletes the legacy components.

## Test plan

- [ ] Mock mode `?jpprotect-mock=1&protect-scan-v2=1` — full row-action / bulk-fix / scan-now flows.
- [ ] Free site — `EmptyState` shows upsell card.
- [ ] Paid site — real WPCOM data; fix / ignore / unignore / view-details / scan-now all round-trip.
- [ ] Flag off — legacy UI byte-identical to trunk.
- [ ] Tracks `jetpack_protect_scan_*` events fire (Network → tracks.pixel.wp.com).
EOF
)"
```

- [ ] **Step 3: Update the Stage 2 plan as a follow-up note** — Stage 2 will be drafted as a separate plan after Stage 1 ships.

---

## Self-review checklist (run before declaring this plan complete)

- [ ] Every spec §1–§11 mapped to a task. (No gaps.)
- [ ] No `TBD` / `TODO` / `FIXME` in this plan body.
- [ ] Every step that changes code shows the actual code.
- [ ] Type/method names consistent across tasks (`useScanThreatsQuery`, `SCAN_QUERY_PREFIX`, `useFixThreatsMutation`, etc.).
- [ ] All four `Render*Modal` props wired (Task 3.7).
- [ ] Tracks namespace consistent: `jetpack_protect_scan_*` everywhere.
- [ ] Mock-mode flag consistent: `?jpprotect-mock=1`.
- [ ] persistKey consistent: `jetpack-protect:scan:view`.
- [ ] Stage 2 work flagged as out of scope for this plan.
