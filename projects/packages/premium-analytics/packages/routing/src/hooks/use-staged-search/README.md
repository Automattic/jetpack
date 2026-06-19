# `useStagedSearch` — staged UI + atomic URL commits

Make the UI react instantly while the URL stays the source of truth. Edits are
staged locally and then committed atomically to the URL (one navigation). Back/
Forward stays smooth.

---

## Concepts

- **committed**: current URL state (`useSearch`).
- **staged**: optimistic local edits (what the user is changing now).
- **effective**: `staged` merged over `committed` (ignoring `undefined`).

Atomic commit:

- `commit()` writes all staged changes in one `navigate({ search })`.
- Optional debounced auto-commit uses `replace: true` to avoid dirty history.
- On confirm, call `commit({ replace: false })` to push a history entry.

---

## API

```ts
type UseStagedSearchOptions< TFrom extends string > = {
	from: TFrom; // TanStack route id/path
	autoCommitDebounceMs?: number; // optional debounce in ms
};

type UseStagedSearchReturn< TSearch > = {
	committed: TSearch; // current URL state
	staged: TSearch; // optimistic local snapshot
	effective: TSearch; // staged over committed per key
	isSyncing: boolean; // true while committing
	isDirty: boolean; // staged differs from committed
	stage( patch: Partial< TSearch > ): void;
	commit( opts?: { replace?: boolean } ): void;
	revert(): void;
	cancelAutoCommit(): void;
};
```

Notes:

- Internally uses `useSearch( { from } )` and `useNavigate( { from } )`.
- No `to` is passed on commit, so the current route is preserved.

---

## Minimal usage

```tsx
import { useMemo, useCallback } from 'react';
import { useStagedSearch, encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { localTZDate } from '@jetpack-premium-analytics/data';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

type Search = {
	from?: string;
	to?: string;
	compare_preset?: string;
	comp?: string;
};

export function DashboardHeader() {
	const { effective, stage, commit } = useStagedSearch< Search, '/' >( {
		from: '/',
		// autoCommitDebounceMs: 250,
	} );

	const range = useMemo(
		() => ( {
			from: effective.from ? localTZDate( effective.from ) : undefined,
			to: effective.to ? localTZDate( effective.to ) : undefined,
		} ),
		[ effective.from, effective.to ]
	);

	const onRangeChange = useCallback(
		( next: DateRange | undefined ) => {
			if ( ! next ) {
				return;
			}
			stage( {
				from: encodeDateToSearchParam( next.from ),
				to: encodeDateToSearchParam( next.to ),
			} );
			commit( { replace: false } );
		},
		[ stage, commit ]
	);

	// ...
}
```

---

## Best practices

**What to use when**

- Render and fetch: **`effective`**
- Inputs being edited: **`staged`**
- URL-driven side effects / analytics / share links: **`committed`**

**Navigation and history**

- Do not pass `to` on commit; update only `search` for SPA smoothness.
- Explicit commit: `commit( { replace: false } )` pushes history.
- Auto-commit (debounce): `replace: true` during continuous edits.
- The URL→UI mirror keeps Back/Forward fluid and flicker-free.

**Data fetching**

```ts
const { effective, isSyncing } = useStagedSearch< Search >( {
	from: '/',
} );

const query = useQuery( {
	queryKey: [ 'orders', effective ],
	enabled: ! isSyncing,
	queryFn: () => fetchOrders( effective ),
} );
```

**Debounce guidance**

- `autoCommitDebounceMs`: 200–300 ms works well for date pickers.
- During edits → debounced replace-commits.
- On confirm (Apply/close) → `commit( { replace: false } )`.

**Removing params**

- `effective` ignores `undefined` in `staged`. To remove a key, stage it as
  `undefined` and commit; the updater omits the key in the URL.

**Avoid**

- Writing the URL from multiple components (breaks atomicity).
- Mixing `useSearch()` reads in children that also depend on staging.
- Always using `replace: true` on explicit commits.

---
