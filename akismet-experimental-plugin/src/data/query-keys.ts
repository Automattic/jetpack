/**
 * Single source of truth for TanStack Query keys in the Akismet experimental UI.
 *
 * Hierarchical, generic→specific. Invalidating any parent key invalidates
 * everything beneath it. Future phases extend this object — keep additions
 * namespaced under `akismetKeys.<resource>.…` so prefix-based invalidation
 * continues to work.
 */
export const akismetKeys = {
	all: [ 'akismet' ] as const,

	// Plan 1 — Account + Settings tabs.
	key: () => [ ...akismetKeys.all, 'key' ] as const,
	settings: () => [ ...akismetKeys.all, 'settings' ] as const,
	jetpackKey: () => [ ...akismetKeys.all, 'jetpack-key' ] as const,

	// Future phases extend here with namespaced sub-objects, e.g.:
	//   stats: { all: () => […], totals: ( interval ) => […], … }
	//   activity: { all: () => […], list: ( params ) => […] }
};

export type AkismetQueryKey =
	| typeof akismetKeys.all
	| ReturnType< typeof akismetKeys.key >
	| ReturnType< typeof akismetKeys.settings >
	| ReturnType< typeof akismetKeys.jetpackKey >;
