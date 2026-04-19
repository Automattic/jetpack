/**
 * Registry-driven "New" / "Beta" feature flags.
 *
 * Surfaces a feature as recently-introduced for a bounded window. Past the
 * window, lookups return false and any consuming Badge silently disappears —
 * no follow-up code change required, no `// TODO: remove this badge once it's
 * no longer new` comment to rot in the source for years.
 *
 * To flag a feature: add an entry to NEW_FEATURES below. To un-flag: do nothing
 * (it expires automatically) or delete the entry early.
 */

export type NewFeatureVariant = 'new' | 'beta';

export type NewFeatureEntry = {
	/** Stable identifier consumers pass into the hook / components. */
	slug: string;
	/** ISO date the feature was introduced (UTC). */
	addedAt: string;
	/** How long the badge should render. Default 90 days. */
	durationDays?: number;
	/** Defaults to 'new'. */
	variant?: NewFeatureVariant;
	/** Free-form context for humans reading the registry — never rendered. */
	note?: string;
};

const DEFAULT_DURATION_DAYS = 90;

/**
 * The single source of truth for which features render a "New"/"Beta" badge.
 *
 * Keep this file under source control review like any other config. A periodic
 * cleanup (or lint rule) can prune entries past their expiry, but expired
 * entries are inert and don't affect rendering — they're just clutter.
 */
export const NEW_FEATURES: readonly NewFeatureEntry[] = [
	{
		slug: 'jetpack-ai',
		addedAt: '2024-07-22',
		durationDays: 365,
		note: 'AI Assistant entry link added in #38414. Flagged retroactively to demo the registry pattern.',
	},
];

/**
 * Returns true when the feature is currently flagged and within its window.
 *
 * @param slug    - The feature slug to look up.
 * @param variant - Defaults to 'new'.
 * @return True when the feature should render its badge, false otherwise.
 */
export function useNewFeature( slug: string, variant: NewFeatureVariant = 'new' ): boolean {
	const entry = NEW_FEATURES.find( e => e.slug === slug && ( e.variant ?? 'new' ) === variant );
	if ( ! entry ) {
		return false;
	}
	const ageMs = Date.now() - new Date( entry.addedAt ).getTime();
	const durationMs = ( entry.durationDays ?? DEFAULT_DURATION_DAYS ) * 86_400_000;
	return ageMs >= 0 && ageMs < durationMs;
}
