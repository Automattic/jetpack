# Akismet Modernization — Plan 1: Settings + Connect

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **REQUIRED reads before coding:**
> 1. [README.md](./README.md)
> 2. [GUARDRAILS.md](./GUARDRAILS.md)
> 3. [00-foundation.md](./00-foundation.md) — what's already built (don't re-execute)
> 4. [**react-query-conventions.md**](./react-query-conventions.md) — **mandatory.** Plan 1 is where the first real hooks land; the conventions are non-negotiable. Use the `akismetKeys` factory at `src/data/query-keys.ts`, the `queryOptions()` pattern (Scan-style) at `src/data/queries.ts`, and the shared `renderWithClient` test helper from `tests/js/test-utils.tsx`.

**Goal:** Replace the PHP-rendered API-key entry, connect-via-Jetpack flow, and settings form with a React tab inside the modernized app shell. The legacy PHP forms (`views/{start,enter,connect-jp,setup}.php`) remain untouched and continue to serve when the feature flag is off.

**Architecture:** Two React tabs inside the `<Page>` shell from Plan 0: "Account" (API key state + manage key) and "Settings" (strictness, comments-approved option). When no key is set, the Account tab shows a stepper with three paths (existing key, get a new key, connect with Jetpack). All data flows through `apiClient` (Plan 0) → the existing `akismet/v1/{key, settings}` REST routes (already implemented in `class.akismet-rest-api.php`).

**Tech Stack:** `@wordpress/admin-ui`, `@wordpress/ui` (Tabs.Root), `@wordpress/components` (TextControl, ToggleControl, Button, Notice, Spinner), `@tanstack/react-query`, `@wordpress/i18n`, `@wordpress/api-fetch`.

## Mandatory conventions (from react-query-conventions.md)

Apply throughout Plan 1 without exception:

- **Query keys** come from `akismetKeys` in `src/data/query-keys.ts`. Plan 0 already populated `akismetKeys.key()`, `akismetKeys.settings()`, `akismetKeys.jetpackKey()`. Don't hand-roll keys.
- **Query definitions** live in `src/data/queries.ts` as `queryOptions()` factories (one per resource). Hooks in `src/hooks/` are thin wrappers (`useQuery( apiKeyQuery() )`).
- **Mutations** use **Pattern A — `setQueryData`** when the response is the new state (settings save, key entry both return the new state). Use **Pattern B — `invalidateQueries`** only when the response is unrelated or partial. See conventions §6.
- **Hook naming**: queries are noun-based (`useApiKey`, `useAkismetConfig`). Mutations are verb-prefixed (`useConnectApiKey`, `useDisconnectApiKey`, `useUpdateAkismetConfig`, `useConnectJetpackKey`). Pair query + mutation in one file when they share a resource.
- **Errors** typed as `WpError` from `src/lib/api-client.ts`. `useQuery< TData, WpError >`. Components can branch on `error?.code` for actionable display (e.g., `akismet_invalid_key`).
- **Tests** use `renderWithClient` from `tests/js/test-utils.tsx`. Don't inline `new QueryClient` in test files.
- **The mutation guardrail** (`AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`) is currently scoped to comment moderation (Plan 3). **Resolve the Plan 1 scope-extension question with the user before starting Task 5** — see "Open guardrail question" below.

## Open guardrail question — resolve before Task 5

Plan 1's writes touch `wp_options` (API key, settings). GUARDRAILS.md §"What is forbidden" flags `wp_options` writes. Pick one with the user before implementing:

- **(A)** Extend `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` to gate settings/key writes. Save buttons disable with "Preview mode — action disabled" notice when off. **Recommended.**
- **(B)** Introduce a separate `AKISMET_EXPERIMENTAL_ALLOW_AKISMET_OPTIONS` constant. Finer-grained.
- **(C)** Leave Plan 1 writes ungated (the user is on the Settings page explicitly intending to change settings — not a surprise mutation).

If (A) or (B), the mutation hooks short-circuit on `allowMutations()` (already exported from `src/lib/is-jetpack-active.ts`) and call `showPreviewModeNotice` (the helper Plan 3 introduces; if Plan 1 ships before Plan 3, lift the helper into `src/lib/notices.ts` here).

---

## File structure

```
src/
├── app.tsx                              # MODIFIED — mount Tabs.Root with two tabs
├── routes/
│   ├── account-tab.tsx                  # NEW — entry-point: shows ConnectFlow if no key, AccountPanel if key
│   ├── account/
│   │   ├── connect-flow.tsx             # NEW — stepper UI: existing key / new key / Jetpack
│   │   ├── connect-jetpack-step.tsx     # NEW — POST to akismet/v1/key with Jetpack-provided creds
│   │   ├── enter-key-step.tsx           # NEW — manual key entry + validate
│   │   └── account-panel.tsx            # NEW — connected state: account summary, usage, deactivate
│   └── settings-tab.tsx                 # NEW — strictness + show-approved-comments + alert prefs
├── data/
│   └── queries.ts                       # NEW — queryOptions() factories: apiKeyQuery, akismetSettingsQuery
├── hooks/
│   ├── use-akismet-config.ts            # NEW — query+mutation pair for akismet/v1/settings
│   ├── use-api-key.ts                   # NEW — query+mutations pair for akismet/v1/key
│   └── use-connect-jetpack-key.ts       # NEW — mutation wrapping akismet/v1/jetpack-key
└── styles/
    └── account.scss                     # NEW — imported by app.tsx; stepper layout

tests/js/
├── routes/
│   ├── account-tab.test.tsx             # NEW
│   ├── settings-tab.test.tsx            # NEW
│   └── account/
│       ├── enter-key-step.test.tsx      # NEW
│       └── connect-jetpack-step.test.tsx # NEW
└── mocks/
    └── handlers.ts                      # NEW — MSW handlers for akismet/v1/* (see Task 2)
```

---

## Tasks

### Task 1: Pull Plan 0's branch + scope the feature branch

**Files:** none.

- [ ] **Step 1: Confirm Plan 0 is in `trunk`**

  ```bash
  cd ~/Code/akismet
  git fetch origin
  git log origin/trunk -1 --oneline
  ```

  Expected: the foundation PR's commit is in trunk. If not, stop and rebase/wait.

- [ ] **Step 2: Create the feature branch**

  ```bash
  git checkout trunk
  git pull
  git checkout -b akismet/experimental-ui-settings-connect
  ```

### Task 2: Add MSW handlers for the akismet REST routes

**Files:**
- Create: `tests/js/mocks/handlers.ts`
- Create: `tests/js/mocks/server.ts`
- Modify: `tests/js/setup.ts`

- [ ] **Step 1: Write the handlers**

  Create `tests/js/mocks/handlers.ts`:

  ```ts
  import { http, HttpResponse } from 'msw';

  let state = {
    key: '',
    keyValid: false,
    settings: {
      akismet_strictness: '0',
      akismet_show_user_comments_approved: '0',
    },
  };

  export function __resetMockState() {
    state = {
      key: '',
      keyValid: false,
      settings: {
        akismet_strictness: '0',
        akismet_show_user_comments_approved: '0',
      },
    };
  }

  export const handlers = [
    http.get( '*/akismet/v1/key', () =>
      HttpResponse.json( { key: state.key, valid: state.keyValid } )
    ),

    http.post( '*/akismet/v1/key', async ( { request } ) => {
      const body = ( await request.json() ) as { key?: string };
      if ( ! body.key || body.key.length < 6 ) {
        return HttpResponse.json(
          { code: 'invalid_key', message: 'Invalid key.' },
          { status: 400 }
        );
      }
      state.key = body.key;
      state.keyValid = true;
      return HttpResponse.json( { key: state.key, valid: true } );
    } ),

    http.delete( '*/akismet/v1/key', () => {
      state.key = '';
      state.keyValid = false;
      return HttpResponse.json( { success: true } );
    } ),

    http.get( '*/akismet/v1/settings', () =>
      HttpResponse.json( state.settings )
    ),

    http.put( '*/akismet/v1/settings', async ( { request } ) => {
      const body = ( await request.json() ) as Record< string, string >;
      state.settings = { ...state.settings, ...body };
      return HttpResponse.json( state.settings );
    } ),
  ];
  ```

- [ ] **Step 2: Wire up MSW**

  Create `tests/js/mocks/server.ts`:

  ```ts
  import { setupServer } from 'msw/node';
  import { handlers } from './handlers';

  export const server = setupServer( ...handlers );
  ```

  Update `tests/js/setup.ts`:

  ```ts
  import '@testing-library/jest-dom';
  import { server } from './mocks/server';
  import { __resetMockState } from './mocks/handlers';

  beforeAll( () => server.listen( { onUnhandledRequest: 'warn' } ) );
  afterEach( () => {
    server.resetHandlers();
    __resetMockState();
  } );
  afterAll( () => server.close() );
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add tests/js
  git commit -m "test: MSW handlers for akismet/v1 key + settings"
  ```

### Task 3: TDD — `useApiKey` hook (with `queryOptions()` factory)

**Files:**
- Create: `src/data/queries.ts` (or extend if already present)
- Create: `src/lib/types.ts` (or inline if you prefer)
- Create: `src/hooks/use-api-key.ts`
- Create: `tests/js/hooks/use-api-key.test.tsx`

Follows `react-query-conventions.md` §4 (factory key), §5 (`queryOptions()`), §11 (`renderWithClient`). Key `akismetKeys.key()` is already exported from Plan 0's `src/data/query-keys.ts`.

- [ ] **Step 1: Define the data shape**

  Add to `src/lib/types.ts` (create if needed):

  ```ts
  export type ApiKeyState = {
    key: string;
    valid: boolean;
  };

  export type AkismetSettings = {
    akismet_strictness: '0' | '1';
    akismet_show_user_comments_approved: '0' | '1';
  };
  ```

- [ ] **Step 2: Add the `queryOptions()` factory**

  Create `src/data/queries.ts`:

  ```ts
  import { queryOptions } from '@tanstack/react-query';
  import { akismetKeys } from '@/data/query-keys';
  import { apiClient, type WpError } from '@/lib/api-client';
  import type { ApiKeyState, AkismetSettings } from '@/lib/types';

  export const apiKeyQuery = () =>
    queryOptions< ApiKeyState, WpError >( {
      queryKey: akismetKeys.key(),
      queryFn: () => apiClient.get< ApiKeyState >( 'key' ),
    } );

  export const akismetSettingsQuery = () =>
    queryOptions< AkismetSettings, WpError >( {
      queryKey: akismetKeys.settings(),
      queryFn: () => apiClient.get< AkismetSettings >( 'settings' ),
    } );
  ```

- [ ] **Step 3: Write the failing test**

  Create `tests/js/hooks/use-api-key.test.tsx`:

  ```tsx
  import { renderHook, waitFor } from '@testing-library/react';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { http, HttpResponse } from 'msw';
  import { useApiKey } from '@/hooks/use-api-key';
  import { server } from '../mocks/server';
  import { createTestQueryClient } from '../test-utils';

  function wrap() {
    const client = createTestQueryClient();
    return ( { children }: { children: React.ReactNode } ) => (
      <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
  }

  describe( 'useApiKey', () => {
    it( 'returns the empty key when none is set', async () => {
      const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data ).toEqual( { key: '', valid: false } );
    } );

    it( 'returns the populated key after one is set', async () => {
      server.use(
        http.get( '*/akismet/v1/key', () =>
          HttpResponse.json( { key: 'abcdef123456', valid: true } )
        )
      );
      const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );
      expect( result.current.data ).toEqual( { key: 'abcdef123456', valid: true } );
    } );

    it( 'types errors as WpError', async () => {
      // Smoke: the queryOptions() factory bakes WpError as the error generic, so
      // `result.current.error?.code` is typed (no `any` access in the consumer).
      server.use(
        http.get( '*/akismet/v1/key', () =>
          HttpResponse.json(
            { code: 'akismet_unavailable', message: 'service down', data: { status: 503 } },
            { status: 503 }
          )
        )
      );
      const { result } = renderHook( () => useApiKey(), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.isError ).toBe( true ) );
      expect( result.current.error?.code ).toBe( 'akismet_unavailable' );
    } );
  } );
  ```

- [ ] **Step 4: Run, expect failure**

  ```bash
  npm test -- --testPathPattern=use-api-key
  ```

  Expected: FAIL — `Cannot find module '@/hooks/use-api-key'`.

- [ ] **Step 5: Implement the hook (one-line wrapper over the factory)**

  Create `src/hooks/use-api-key.ts`:

  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { apiKeyQuery } from '@/data/queries';

  /**
   * Read the current Akismet API key state.
   *
   * @return TanStack `useQuery` result, typed { key, valid } | WpError.
   */
  export function useApiKey() {
    return useQuery( apiKeyQuery() );
  }
  ```

- [ ] **Step 6: Run, expect pass + commit**

  ```bash
  npm test -- --testPathPattern=use-api-key
  git add src/data/queries.ts src/hooks/use-api-key.ts src/lib/types.ts tests/js/hooks/use-api-key.test.tsx
  git commit -m "akismet(experimental): useApiKey() + apiKeyQuery() factory"
  ```

### Task 4: TDD — `useAkismetConfig` hook (query + mutation pair, Pattern A)

**Files:**
- Modify: `src/data/queries.ts` (the `akismetSettingsQuery` factory was added in Task 3 — verify it's there)
- Create: `src/hooks/use-akismet-config.ts`
- Create: `tests/js/hooks/use-akismet-config.test.tsx`

Pattern A from `react-query-conventions.md` §6 — `PUT /settings` returns the new state so `setQueryData` is the right move (skip the refetch). Uses `akismetKeys.settings()` from the factory.

- [ ] **Step 1: Write the test**

  ```tsx
  import { renderHook, act, waitFor } from '@testing-library/react';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { useAkismetConfig } from '@/hooks/use-akismet-config';
  import { createTestQueryClient } from '../test-utils';

  function wrap() {
    const client = createTestQueryClient();
    return ( { children }: { children: React.ReactNode } ) => (
      <QueryClientProvider client={ client }>{ children }</QueryClientProvider>
    );
  }

  describe( 'useAkismetConfig', () => {
    it( 'fetches and persists settings via setQueryData (no refetch round-trip)', async () => {
      const { result } = renderHook( () => useAkismetConfig(), { wrapper: wrap() } );
      await waitFor( () => expect( result.current.config.isSuccess ).toBe( true ) );
      expect( result.current.config.data?.akismet_strictness ).toBe( '0' );

      await act( async () => {
        await result.current.update.mutateAsync( { akismet_strictness: '1' } );
      } );

      // Without an extra fetch, the cache should already reflect the new state
      // because the mutation's onSuccess calls setQueryData.
      expect( result.current.config.data?.akismet_strictness ).toBe( '1' );
    } );
  } );
  ```

- [ ] **Step 2: Run, expect failure**

  ```bash
  npm test -- --testPathPattern=use-akismet-config
  ```

- [ ] **Step 3: Implement**

  Create `src/hooks/use-akismet-config.ts`:

  ```ts
  import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
  import { akismetSettingsQuery } from '@/data/queries';
  import { akismetKeys } from '@/data/query-keys';
  import { allowMutations } from '@/lib/is-jetpack-active';
  import { apiClient, type WpError } from '@/lib/api-client';
  import type { AkismetSettings } from '@/lib/types';

  /**
   * Read + write Akismet settings.
   *
   * The PUT response IS the new settings state, so we use Pattern A
   * (setQueryData) from the conventions — no refetch needed.
   *
   * @return `{ config, update }` — the query result + the mutation.
   */
  export function useAkismetConfig() {
    const queryClient = useQueryClient();

    const config = useQuery( akismetSettingsQuery() );

    const update = useMutation< AkismetSettings, WpError, Partial< AkismetSettings > >( {
      mutationFn: ( patch ) => {
        // Guardrail: settings writes touch wp_options. Honors the mutation gate
        // pending the user's decision on Option A/B/C in the "Open guardrail
        // question" section above. This is the Option A wiring.
        if ( ! allowMutations() ) {
          return Promise.reject< AkismetSettings >( {
            code: 'preview_mode_active',
            message: 'Preview mode — settings save disabled.',
            data: { status: 403 },
          } as WpError );
        }
        return apiClient.put< AkismetSettings >( 'settings', patch );
      },
      onSuccess: ( data ) => {
        queryClient.setQueryData( akismetKeys.settings(), data );
      },
    } );

    return { config, update };
  }
  ```

  > **Note on the mutation gate:** the example above implements Option A. If the user picks Option C (ungated), strip the `allowMutations()` short-circuit. If Option B, swap the constant name. Don't ship one of these without their explicit choice.

- [ ] **Step 4: Run + commit**

  ```bash
  npm test -- --testPathPattern=use-akismet-config
  git add src/hooks/use-akismet-config.ts tests/js/hooks/use-akismet-config.test.tsx
  git commit -m "akismet(experimental): useAkismetConfig() — query + mutation pair (Pattern A)"
  ```

### Task 5: Build the `<EnterKeyStep>` component (TDD)

**Files:**
- Create: `tests/js/routes/account/enter-key-step.test.tsx`
- Create: `src/routes/account/enter-key-step.tsx`

- [ ] **Step 1: Write the test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { EnterKeyStep } from '@/routes/account/enter-key-step';

  function renderWithClient( ui: React.ReactNode ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
  }

  describe( '<EnterKeyStep>', () => {
    it( 'rejects an empty submission with a visible error', async () => {
      const onSuccess = jest.fn();
      renderWithClient( <EnterKeyStep onSuccess={ onSuccess } /> );
      await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
      expect( await screen.findByText( /enter a key/i ) ).toBeInTheDocument();
      expect( onSuccess ).not.toHaveBeenCalled();
    } );

    it( 'submits a valid key and calls onSuccess', async () => {
      const onSuccess = jest.fn();
      renderWithClient( <EnterKeyStep onSuccess={ onSuccess } /> );
      await userEvent.type( screen.getByLabelText( /api key/i ), 'abcdef123456' );
      await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
      expect( await screen.findByText( /key connected/i ) ).toBeInTheDocument();
      expect( onSuccess ).toHaveBeenCalled();
    } );

    it( 'shows the server error on rejection', async () => {
      renderWithClient( <EnterKeyStep onSuccess={ () => {} } /> );
      await userEvent.type( screen.getByLabelText( /api key/i ), 'bad' ); // <6 chars triggers MSW 400
      await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
      expect( await screen.findByText( /invalid key/i ) ).toBeInTheDocument();
    } );
  } );
  ```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement**

  Create `src/routes/account/enter-key-step.tsx`:

  ```tsx
  import { useState } from '@wordpress/element';
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { Button, TextControl, Notice } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import { apiClient } from '@/lib/api-client';

  type Props = {
    onSuccess: () => void;
  };

  type ApiResponse = { key: string; valid: boolean };

  export function EnterKeyStep( { onSuccess }: Props ): JSX.Element {
    const [ value, setValue ] = useState( '' );
    const [ inlineError, setInlineError ] = useState< string | null >( null );
    const [ success, setSuccess ] = useState( false );
    const queryClient = useQueryClient();

    const mutation = useMutation( {
      mutationFn: ( key: string ) => apiClient.post< ApiResponse >( 'key', { key } ),
      onSuccess: ( data ) => {
        queryClient.setQueryData( [ 'akismet', 'key' ], data );
        setSuccess( true );
        onSuccess();
      },
      onError: () => {
        setInlineError( __( 'Invalid key.', 'akismet' ) );
      },
    } );

    function handleSubmit( event: React.FormEvent< HTMLFormElement > ) {
      event.preventDefault();
      setInlineError( null );
      setSuccess( false );
      if ( ! value.trim() ) {
        setInlineError( __( 'Please enter a key.', 'akismet' ) );
        return;
      }
      mutation.mutate( value.trim() );
    }

    return (
      <form onSubmit={ handleSubmit }>
        <TextControl
          label={ __( 'API key', 'akismet' ) }
          value={ value }
          onChange={ setValue }
          __nextHasNoMarginBottom
          __next40pxDefaultSize
        />
        { inlineError && (
          <Notice status="error" isDismissible={ false }>
            { inlineError }
          </Notice>
        ) }
        { success && (
          <Notice status="success" isDismissible={ false }>
            { __( 'Key connected.', 'akismet' ) }
          </Notice>
        ) }
        <Button
          variant="primary"
          type="submit"
          isBusy={ mutation.isPending }
          disabled={ mutation.isPending }
          __next40pxDefaultSize
        >
          { __( 'Use this key', 'akismet' ) }
        </Button>
      </form>
    );
  }
  ```

- [ ] **Step 4: Run + commit**

  ```bash
  npm test -- --testPathPattern=enter-key-step
  git add src/routes/account tests/js/routes/account
  git commit -m "feat: <EnterKeyStep> component"
  ```

### Task 6: Build the `<ConnectJetpackStep>` component (TDD)

**Files:**
- Create: `tests/js/routes/account/connect-jetpack-step.test.tsx`
- Create: `src/routes/account/connect-jetpack-step.tsx`
- Modify: `class.akismet-admin.php` (Plan 0) to add `akismet/v1/jetpack-key` REST route — see step 4 below

- [ ] **Step 1: Decide the contract**

  The legacy PHP path in `views/connect-jp.php` uses `get_jetpack_user()` at `class.akismet-admin.php:1057` to retrieve a Jetpack-connected WPCOM user's API key, then validates it via `verify_wpcom_key()` at line 952. For the React path, the cleanest contract is a **new REST endpoint** that performs the lookup + validation server-side and returns the key. We add `GET akismet/v1/jetpack-key`.

- [ ] **Step 2: Add the REST route**

  In `class.akismet-rest-api.php`, register inside `init()`:

  ```php
  register_rest_route( 'akismet/v1', '/jetpack-key', array(
      'methods'             => WP_REST_Server::READABLE,
      'callback'            => array( 'Akismet_REST_API', 'get_jetpack_key' ),
      'permission_callback' => array( 'Akismet_REST_API', 'privileged_permission_callback' ),
  ) );
  ```

  And implement:

  ```php
  public static function get_jetpack_key() {
      if ( ! class_exists( 'Jetpack' ) ) {
          return new WP_Error(
              'no_jetpack',
              __( 'Jetpack is not active.', 'akismet' ),
              array( 'status' => 400 )
          );
      }
      $user = Akismet_Admin::get_jetpack_user();
      if ( empty( $user ) || empty( $user['api_key'] ) ) {
          return new WP_Error(
              'no_jetpack_user',
              __( 'No Jetpack-connected user with an Akismet key was found.', 'akismet' ),
              array( 'status' => 400 )
          );
      }
      $valid = Akismet::verify_wpcom_key( $user['api_key'], $user['user_id'] );
      if ( is_wp_error( $valid ) || ! $valid ) {
          return new WP_Error(
              'invalid_key',
              __( 'The Jetpack key could not be verified.', 'akismet' ),
              array( 'status' => 400 )
          );
      }
      Akismet::set_api_key( $user['api_key'] );
      return rest_ensure_response( array(
          'key'   => $user['api_key'],
          'valid' => true,
      ) );
  }
  ```

  > Verify `get_jetpack_user()` and `verify_wpcom_key()` visibility/return shape against the actual code in `class.akismet-admin.php` and `class.akismet.php` — if either is `private`, mark `public` (Akismet's CONTRIBUTING.md should be checked re: API stability).

- [ ] **Step 3: Write the failing test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { ConnectJetpackStep } from '@/routes/account/connect-jetpack-step';
  import { server } from '../../mocks/server';
  import { http, HttpResponse } from 'msw';

  function renderWithClient( ui: React.ReactNode ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
  }

  describe( '<ConnectJetpackStep>', () => {
    it( 'shows the button when Jetpack is active', () => {
      ( window as unknown as { akismetAdmin: { jetpackActive: boolean } } ).akismetAdmin = {
        jetpackActive: true,
      };
      renderWithClient( <ConnectJetpackStep onSuccess={ () => {} } /> );
      expect(
        screen.getByRole( 'button', { name: /connect with jetpack/i } )
      ).toBeInTheDocument();
    } );

    it( 'reports an error when no Jetpack-connected user is found', async () => {
      ( window as unknown as { akismetAdmin: { jetpackActive: boolean } } ).akismetAdmin = {
        jetpackActive: true,
      };
      server.use(
        http.get( '*/akismet/v1/jetpack-key', () =>
          HttpResponse.json(
            { code: 'no_jetpack_user', message: 'No Jetpack-connected user.' },
            { status: 400 }
          )
        )
      );
      const onSuccess = jest.fn();
      renderWithClient( <ConnectJetpackStep onSuccess={ onSuccess } /> );
      await userEvent.click( screen.getByRole( 'button', { name: /connect with jetpack/i } ) );
      expect( await screen.findByText( /no jetpack-connected user/i ) ).toBeInTheDocument();
      expect( onSuccess ).not.toHaveBeenCalled();
    } );

    it( 'succeeds when Jetpack returns a valid key', async () => {
      ( window as unknown as { akismetAdmin: { jetpackActive: boolean } } ).akismetAdmin = {
        jetpackActive: true,
      };
      server.use(
        http.get( '*/akismet/v1/jetpack-key', () =>
          HttpResponse.json( { key: 'jp-key-12', valid: true } )
        )
      );
      const onSuccess = jest.fn();
      renderWithClient( <ConnectJetpackStep onSuccess={ onSuccess } /> );
      await userEvent.click( screen.getByRole( 'button', { name: /connect with jetpack/i } ) );
      expect( await screen.findByText( /jetpack key connected/i ) ).toBeInTheDocument();
      expect( onSuccess ).toHaveBeenCalled();
    } );

    afterEach( () => {
      // @ts-expect-error
      delete window.akismetAdmin;
    } );
  } );
  ```

- [ ] **Step 4: Implement**

  Create `src/routes/account/connect-jetpack-step.tsx`:

  ```tsx
  import { useState } from '@wordpress/element';
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { Button, Notice } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import { apiClient } from '@/lib/api-client';
  import { isJetpackActive } from '@/lib/is-jetpack-active';

  type Props = {
    onSuccess: () => void;
  };

  type ApiResponse = { key: string; valid: boolean };

  export function ConnectJetpackStep( { onSuccess }: Props ): JSX.Element | null {
    const queryClient = useQueryClient();
    const [ error, setError ] = useState< string | null >( null );
    const [ success, setSuccess ] = useState( false );

    const mutation = useMutation( {
      mutationFn: () => apiClient.get< ApiResponse >( 'jetpack-key' ),
      onSuccess: ( data ) => {
        queryClient.setQueryData( [ 'akismet', 'key' ], data );
        setSuccess( true );
        onSuccess();
      },
      onError: ( err: Error & { message?: string } ) => {
        setError( err?.message ?? __( 'Could not connect with Jetpack.', 'akismet' ) );
      },
    } );

    if ( ! isJetpackActive() ) {
      return null;
    }

    return (
      <div className="akismet-connect-jetpack">
        <Button
          variant="primary"
          onClick={ () => {
            setError( null );
            setSuccess( false );
            mutation.mutate();
          } }
          isBusy={ mutation.isPending }
          disabled={ mutation.isPending }
          __next40pxDefaultSize
        >
          { __( 'Connect with Jetpack', 'akismet' ) }
        </Button>
        { error && (
          <Notice status="error" isDismissible={ false }>
            { error }
          </Notice>
        ) }
        { success && (
          <Notice status="success" isDismissible={ false }>
            { __( 'Jetpack key connected.', 'akismet' ) }
          </Notice>
        ) }
      </div>
    );
  }
  ```

- [ ] **Step 5: Run + commit**

  ```bash
  npm test -- --testPathPattern=connect-jetpack
  git add src/routes/account/connect-jetpack-step.tsx \
          tests/js/routes/account/connect-jetpack-step.test.tsx \
          class.akismet-rest-api.php
  git commit -m "feat: <ConnectJetpackStep> + akismet/v1/jetpack-key REST route"
  ```

### Task 7: Build the `<ConnectFlow>` stepper

**Files:**
- Create: `src/routes/account/connect-flow.tsx`
- Create: `src/styles/account.scss`

- [ ] **Step 1: Implement**

  Create `src/routes/account/connect-flow.tsx`:

  ```tsx
  import { useState } from '@wordpress/element';
  import { Card, CardBody, CardHeader, Button, ExternalLink } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import { EnterKeyStep } from './enter-key-step';
  import { ConnectJetpackStep } from './connect-jetpack-step';
  import { isJetpackActive } from '@/lib/is-jetpack-active';

  type Step = 'choose' | 'existing' | 'new' | 'jetpack';

  type Props = {
    onSuccess: () => void;
  };

  export function ConnectFlow( { onSuccess }: Props ): JSX.Element {
    const [ step, setStep ] = useState< Step >( 'choose' );

    if ( step === 'existing' ) {
      return (
        <Card>
          <CardHeader>{ __( 'Enter your API key', 'akismet' ) }</CardHeader>
          <CardBody>
            <EnterKeyStep onSuccess={ onSuccess } />
            <Button variant="link" onClick={ () => setStep( 'choose' ) }>
              { __( 'Go back', 'akismet' ) }
            </Button>
          </CardBody>
        </Card>
      );
    }

    if ( step === 'jetpack' ) {
      return (
        <Card>
          <CardHeader>{ __( 'Connect with Jetpack', 'akismet' ) }</CardHeader>
          <CardBody>
            <ConnectJetpackStep onSuccess={ onSuccess } />
            <Button variant="link" onClick={ () => setStep( 'choose' ) }>
              { __( 'Go back', 'akismet' ) }
            </Button>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>{ __( 'Set up Akismet', 'akismet' ) }</CardHeader>
        <CardBody>
          <p>
            { __(
              'Akismet protects your site from spam comments. To get started, choose how you’d like to set up your API key.',
              'akismet'
            ) }
          </p>
          <div className="akismet-connect-choices">
            <Button variant="primary" onClick={ () => setStep( 'existing' ) } __next40pxDefaultSize>
              { __( 'I already have a key', 'akismet' ) }
            </Button>
            <ExternalLink href="https://akismet.com/wordpress/">
              { __( 'Get a new key', 'akismet' ) }
            </ExternalLink>
            { isJetpackActive() && (
              <Button variant="secondary" onClick={ () => setStep( 'jetpack' ) } __next40pxDefaultSize>
                { __( 'Connect with Jetpack', 'akismet' ) }
              </Button>
            ) }
          </div>
        </CardBody>
      </Card>
    );
  }
  ```

  Create `src/styles/account.scss`:

  ```scss
  .akismet-connect-choices {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var( --wp-components-spacing-3, 12px );
      margin-top: var( --wp-components-spacing-4, 16px );
  }
  ```

  Import the SCSS at the top of `src/routes/account/connect-flow.tsx`:

  ```ts
  import '@/styles/account.scss';
  ```

- [ ] **Step 2: Smoke test**

  Add a test that renders the flow in its initial state:

  Create `tests/js/routes/account/connect-flow.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { ConnectFlow } from '@/routes/account/connect-flow';

  it( 'shows the choose step by default', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={ client }>
        <ConnectFlow onSuccess={ () => {} } />
      </QueryClientProvider>
    );
    expect(
      screen.getByRole( 'button', { name: /i already have a key/i } )
    ).toBeInTheDocument();
  } );
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/routes/account/connect-flow.tsx \
          src/styles/account.scss \
          tests/js/routes/account/connect-flow.test.tsx
  git commit -m "feat: <ConnectFlow> stepper"
  ```

### Task 8: Build the `<AccountPanel>` for the connected state

**Files:**
- Create: `src/routes/account/account-panel.tsx`
- Create: `tests/js/routes/account/account-panel.test.tsx`

- [ ] **Step 1: Implement**

  Create `src/routes/account/account-panel.tsx`:

  ```tsx
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { Card, CardBody, CardHeader, Button, Spinner, Notice } from '@wordpress/components';
  import { __, sprintf } from '@wordpress/i18n';
  import { apiClient } from '@/lib/api-client';
  import { useApiKey } from '@/hooks/use-api-key';

  function maskKey( key: string ): string {
    if ( key.length <= 4 ) {
      return key;
    }
    return `${ key.slice( 0, 4 ) }${ '•'.repeat( key.length - 4 ) }`;
  }

  export function AccountPanel(): JSX.Element {
    const queryClient = useQueryClient();
    const { data, isLoading } = useApiKey();

    const disconnect = useMutation( {
      mutationFn: () => apiClient.delete( 'key' ),
      onSuccess: () => {
        queryClient.setQueryData( [ 'akismet', 'key' ], { key: '', valid: false } );
      },
    } );

    if ( isLoading ) {
      return <Spinner />;
    }

    if ( ! data?.valid ) {
      return (
        <Notice status="warning" isDismissible={ false }>
          { __( 'No active key on this site.', 'akismet' ) }
        </Notice>
      );
    }

    return (
      <Card>
        <CardHeader>{ __( 'Akismet account', 'akismet' ) }</CardHeader>
        <CardBody>
          <p>
            { sprintf(
              /* translators: %s: the masked API key. */
              __( 'API key: %s', 'akismet' ),
              maskKey( data.key )
            ) }
          </p>
          <Button
            variant="secondary"
            isDestructive
            onClick={ () => disconnect.mutate() }
            isBusy={ disconnect.isPending }
            __next40pxDefaultSize
          >
            { __( 'Disconnect this key', 'akismet' ) }
          </Button>
        </CardBody>
      </Card>
    );
  }
  ```

- [ ] **Step 2: Test**

  Create `tests/js/routes/account/account-panel.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { AccountPanel } from '@/routes/account/account-panel';
  import { server } from '../../mocks/server';
  import { http, HttpResponse } from 'msw';

  function renderWithClient( ui: React.ReactNode ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
  }

  describe( '<AccountPanel>', () => {
    it( 'shows the masked key + disconnect button when connected', async () => {
      server.use(
        http.get( '*/akismet/v1/key', () =>
          HttpResponse.json( { key: 'abcdef123456', valid: true } )
        )
      );
      renderWithClient( <AccountPanel /> );
      expect( await screen.findByText( /abcd•+/ ) ).toBeInTheDocument();
      expect( screen.getByRole( 'button', { name: /disconnect/i } ) ).toBeInTheDocument();
    } );

    it( 'invalidates the key after disconnecting', async () => {
      server.use(
        http.get( '*/akismet/v1/key', () =>
          HttpResponse.json( { key: 'abcdef123456', valid: true } )
        )
      );
      renderWithClient( <AccountPanel /> );
      const btn = await screen.findByRole( 'button', { name: /disconnect/i } );
      server.use(
        http.delete( '*/akismet/v1/key', () =>
          HttpResponse.json( { success: true } )
        )
      );
      await userEvent.click( btn );
      expect( await screen.findByText( /no active key/i ) ).toBeInTheDocument();
    } );
  } );
  ```

- [ ] **Step 3: Commit**

  ```bash
  npm test -- --testPathPattern=account-panel
  git add src/routes/account/account-panel.tsx tests/js/routes/account/account-panel.test.tsx
  git commit -m "feat: <AccountPanel>"
  ```

### Task 9: Build the `<AccountTab>` that switches between ConnectFlow and AccountPanel

**Files:**
- Create: `src/routes/account-tab.tsx`
- Create: `tests/js/routes/account-tab.test.tsx`

- [ ] **Step 1: Implement**

  ```tsx
  import { Spinner } from '@wordpress/components';
  import { useQueryClient } from '@tanstack/react-query';
  import { useApiKey } from '@/hooks/use-api-key';
  import { ConnectFlow } from '@/routes/account/connect-flow';
  import { AccountPanel } from '@/routes/account/account-panel';

  export function AccountTab(): JSX.Element {
    const queryClient = useQueryClient();
    const { data, isLoading } = useApiKey();
    if ( isLoading ) {
      return <Spinner />;
    }
    if ( ! data?.valid ) {
      return (
        <ConnectFlow
          onSuccess={ () => queryClient.invalidateQueries( { queryKey: [ 'akismet', 'key' ] } ) }
        />
      );
    }
    return <AccountPanel />;
  }
  ```

- [ ] **Step 2: Test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { AccountTab } from '@/routes/account-tab';
  import { server } from '../mocks/server';
  import { http, HttpResponse } from 'msw';

  function renderWithClient( ui: React.ReactNode ) {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
  }

  it( 'shows the connect flow when no key', async () => {
    renderWithClient( <AccountTab /> );
    expect( await screen.findByRole( 'button', { name: /i already have a key/i } ) ).toBeInTheDocument();
  } );

  it( 'shows the account panel when a valid key exists', async () => {
    server.use(
      http.get( '*/akismet/v1/key', () =>
        HttpResponse.json( { key: 'abcdef123456', valid: true } )
      )
    );
    renderWithClient( <AccountTab /> );
    expect( await screen.findByRole( 'button', { name: /disconnect/i } ) ).toBeInTheDocument();
  } );
  ```

- [ ] **Step 3: Commit**

  ```bash
  npm test -- --testPathPattern=account-tab
  git add src/routes/account-tab.tsx tests/js/routes/account-tab.test.tsx
  git commit -m "feat: <AccountTab>"
  ```

### Task 10: Build the `<SettingsTab>`

**Files:**
- Create: `src/routes/settings-tab.tsx`
- Create: `tests/js/routes/settings-tab.test.tsx`

- [ ] **Step 1: Implement**

  ```tsx
  import { ToggleControl, RadioControl, Spinner } from '@wordpress/components';
  import { __ } from '@wordpress/i18n';
  import { useAkismetConfig } from '@/hooks/use-akismet-config';

  export function SettingsTab(): JSX.Element {
    const { config, update } = useAkismetConfig();

    if ( config.isLoading ) {
      return <Spinner />;
    }

    const data = config.data;
    if ( ! data ) {
      return <p>{ __( 'Could not load settings.', 'akismet' ) }</p>;
    }

    return (
      <div className="akismet-settings">
        <RadioControl
          label={ __( 'Strictness', 'akismet' ) }
          help={ __(
            'Choose how aggressively Akismet should filter incoming comments.',
            'akismet'
          ) }
          selected={ data.akismet_strictness }
          options={ [
            { label: __( 'Silently discard the worst spam', 'akismet' ), value: '1' },
            { label: __( 'Always put spam in the Spam folder for review', 'akismet' ), value: '0' },
          ] }
          onChange={ ( value ) =>
            update.mutate( { akismet_strictness: value as '0' | '1' } )
          }
        />
        <ToggleControl
          label={ __( 'Show the number of approved comments next to each commenter', 'akismet' ) }
          checked={ data.akismet_show_user_comments_approved === '1' }
          onChange={ ( checked ) =>
            update.mutate( {
              akismet_show_user_comments_approved: checked ? '1' : '0',
            } )
          }
          __nextHasNoMarginBottom
        />
      </div>
    );
  }
  ```

- [ ] **Step 2: Test**

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { SettingsTab } from '@/routes/settings-tab';

  function renderWithClient() {
    const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
    return render(
      <QueryClientProvider client={ client }>
        <SettingsTab />
      </QueryClientProvider>
    );
  }

  it( 'persists the strictness change', async () => {
    renderWithClient();
    await screen.findByLabelText( /silently discard/i );
    await userEvent.click( screen.getByLabelText( /silently discard/i ) );
    // After the mutation resolves and React Query updates, the new radio should be checked.
    expect( screen.getByLabelText( /silently discard/i ) ).toBeChecked();
  } );
  ```

- [ ] **Step 3: Commit**

  ```bash
  npm test -- --testPathPattern=settings-tab
  git add src/routes/settings-tab.tsx tests/js/routes/settings-tab.test.tsx
  git commit -m "feat: <SettingsTab>"
  ```

### Task 11: Mount the tabs in `<App>`

**Files:**
- Modify: `src/app.tsx`
- Modify: `tests/js/app.test.tsx`

- [ ] **Step 1: Update `<App>`**

  Replace the `<Page>` body with a `Tabs.Root` from `@wordpress/ui`:

  ```tsx
  import { Page } from '@wordpress/admin-ui';
  import { Tabs } from '@wordpress/ui';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { ThemeProvider } from '@wordpress/theme';
  import { __ } from '@wordpress/i18n';
  import { JetpackFooter } from '@automattic/jetpack-components';
  import { createQueryClient } from '@/lib/query-client';
  import { isJetpackActive } from '@/lib/is-jetpack-active';
  import { AccountTab } from '@/routes/account-tab';
  import { SettingsTab } from '@/routes/settings-tab';
  import '@/styles/app.scss';

  const queryClient = createQueryClient();

  export function App(): JSX.Element {
    return (
      <ThemeProvider>
        <QueryClientProvider client={ queryClient }>
          <Page
            className="akismet-app"
            title={ __( 'Akismet Anti-Spam', 'akismet' ) }
          >
            <Tabs.Root defaultValue="account">
              <Tabs.List>
                <Tabs.Tab value="account">{ __( 'Account', 'akismet' ) }</Tabs.Tab>
                <Tabs.Tab value="settings">{ __( 'Settings', 'akismet' ) }</Tabs.Tab>
              </Tabs.List>
              <Tabs.TabPanel value="account">
                <AccountTab />
              </Tabs.TabPanel>
              <Tabs.TabPanel value="settings">
                <SettingsTab />
              </Tabs.TabPanel>
            </Tabs.Root>
          </Page>
          { isJetpackActive() && <JetpackFooter a8cLogoHref="https://automattic.com" /> }
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  ```

  > **Note:** the exact `Tabs` API surface depends on `@wordpress/ui` version. If `Tabs.TabPanel` is renamed or props differ, follow the Boost reference (`projects/plugins/boost/_inc/components/boost-page.tsx` in jetpack-monorepo) at the version pinned in Plan 0's `package.json`.

- [ ] **Step 2: Update the app-level test**

  Replace the placeholder test with one that asserts both tabs render and the Account tab is selected by default:

  ```tsx
  it( 'renders the Account and Settings tabs', () => {
    render( <App /> );
    expect( screen.getByRole( 'tab', { name: /account/i } ) ).toBeInTheDocument();
    expect( screen.getByRole( 'tab', { name: /settings/i } ) ).toBeInTheDocument();
    expect( screen.getByRole( 'tab', { name: /account/i } ) ).toHaveAttribute(
      'aria-selected',
      'true'
    );
  } );
  ```

- [ ] **Step 3: Persist tab in the URL**

  Add a `?tab=` query-param sync (mirrors Boost's pattern). For Plan 1 the minimum is reading the initial value from `new URL(location.href).searchParams.get('tab')` and writing back on tab change with `history.replaceState`. Cover with a test that mounts with `?tab=settings` and asserts the Settings panel is visible.

  ```tsx
  function getInitialTab(): string {
    if ( typeof window === 'undefined' ) return 'account';
    const value = new URL( window.location.href ).searchParams.get( 'tab' );
    return value === 'settings' || value === 'account' ? value : 'account';
  }

  function syncTabToUrl( value: string ) {
    if ( typeof window === 'undefined' ) return;
    const url = new URL( window.location.href );
    url.searchParams.set( 'tab', value );
    window.history.replaceState( null, '', url.toString() );
  }
  ```

  And on `Tabs.Root`: `defaultValue={ getInitialTab() } onValueChange={ syncTabToUrl }`.

- [ ] **Step 4: Run + commit**

  ```bash
  npm test
  npm run build
  git add src/app.tsx tests/js/app.test.tsx
  git commit -m "feat: mount Account + Settings tabs in <App>"
  ```

### Task 12: Manual verification in a sandbox site

**Files:** none.

- [ ] **Step 1: Spin up a Studio (or local Docker) site with both Akismet and Jetpack active**

  Use [hatch](https://github.com/Automattic/hatch) or Studio. Enable the experimental UI via wp-config:

  ```php
  // wp-config.php
  define( 'AKISMET_EXPERIMENTAL_UI', true );
  ```

- [ ] **Step 2: Walk every state**

  - `?page=akismet-experimental` with no API key → ConnectFlow shows three options.
  - Click "I already have a key" → enter a real key → see "Key connected" + transition to AccountPanel.
  - Click "Connect with Jetpack" → see either success or "no jetpack-connected user" depending on Jetpack state.
  - Switch to Settings tab → toggle each setting → reload page; the values stick.
  - URL: `?page=akismet-experimental&tab=settings` opens directly on the Settings tab.

- [ ] **Step 3: Compare with the legacy UI**

  Without `AKISMET_EXPERIMENTAL_UI` defined: confirm `?page=akismet-key-config` still renders the legacy PHP UI unchanged, and the "Akismet (Experimental)" menu entry is absent.

- [ ] **Step 4: Screenshot for the PR**

  Capture: ConnectFlow (3 paths), AccountPanel (connected), SettingsTab.

### Task 13: PR

- [ ] **Step 1: Push + open the PR**

  ```bash
  git push -u origin akismet/experimental-ui-settings-connect
  gh pr create --title "akismet: experimental UI — settings + connect" --body "..."
  ```

  Body template:

  ```
  ## Summary

  - Adds React tabs for Account (API key entry + Jetpack connect) and Settings (strictness, comments-approved).
  - Adds the `akismet/v1/jetpack-key` REST route to wrap `Akismet_Admin::get_jetpack_user` + `Akismet::verify_wpcom_key`.
  - All UI lives on the experimental admin page from Plan 0; legacy `?page=akismet-key-config` is untouched.

  ## Test plan

  - [ ] `npm test` passes
  - [ ] Walk every state from the plan's Task 12 manual checklist
  - [ ] Without `AKISMET_EXPERIMENTAL_UI`, the legacy `?page=akismet-key-config` UI is byte-identical
  ```

  Link the PR to the Linear sub-issue for Plan 1.

---

## Self-review checklist

- Are all React strings wrapped in `__()` / `sprintf()`?
- Does the `akismet/v1/jetpack-key` endpoint respect the same capability check as the rest of the REST API? (`privileged_permission_callback` matches the existing pattern.)
- Are mutations optimistic only where safe? The current plan uses `setQueryData` after success — fine for these low-frequency mutations.
- Does the legacy code path remain byte-identical when the flag is off?
