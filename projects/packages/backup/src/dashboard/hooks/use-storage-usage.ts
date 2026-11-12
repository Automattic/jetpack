import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { fetchSitePolicies } from '../data/api/policies';
import { keys } from '../data/query-client';
import { getUsageLevel, type StorageUsageLevelName } from '../data/storage-usage-levels';
import { useCanQueryWpcom } from './use-connection';
import { useSiteSizeQuery } from './use-site-size';

// Policies change when a plan changes, which is rare — but a plan change
// is exactly the moment the meter is wrong, so this is not cached for the
// hour it could be.
const SITE_POLICIES_STALE_MS = 5 * 60_000;

type Figures = {
	/** Derived level driving the meter's colour. */
	usageLevel: StorageUsageLevelName | null;
	/**
	 * True only while a request is genuinely in flight. React Query v5
	 * defines this as `isPending && isFetching`, so a query disabled by
	 * `useCanQueryWpcom()` reports `false` rather than staying pending
	 * forever — which is what makes it safe to reserve layout on.
	 */
	isLoading: boolean;
	/**
	 * Days of backups WordPress.com is actually holding, or null when the
	 * response did not carry the figure. Distinct from the plan's promised
	 * retention: this is what survived the storage limit.
	 *
	 * Nullable on its own rather than folded into `hasUsableFigures`,
	 * because it is genuinely independent of the two byte figures — a
	 * response can describe storage perfectly well and omit this.
	 */
	daysOfBackupsSaved: number | null;
	/**
	 * Fewest days of backups the plan will ever keep. Never null where it is rendered:
	 * only the `BackupsDiscarded` warning reads it, and that level is reached only from
	 * a branch guarded on this being truthy.
	 */
	minDaysOfBackupsAllowed: number | null;
	/**
	 * Days of full backups the storage limit would hold at the size of
	 * the last one, or null when the last backup's size is unknown.
	 *
	 * Legacy collapses "cannot compute" and "not even one fits" into the same `0`.
	 * Separating them lets the help popover say nothing in the first case.
	 */
	forecastInDays: number | null;
	/**
	 * The retention the *plan* promises, which is not the retention in force. The help
	 * popover's gate compares against the promise, as legacy's does.
	 */
	planRetentionDays: number | null;
	/** The retention in force: the site's own setting, else the plan's. */
	retentionDays: number | null;
	/** Bytes the last full backup took, or null when unreported. */
	lastBackupSize: number | null;
};

/**
 * `hasUsableFigures` is a discriminant, not a convenience flag: it is the
 * single statement of legacy's `storageSize !== null && storageLimit > 0`
 * gate, and when it is true the two figures are narrowed to numbers. That
 * keeps the predicate in one place — a consumer that re-tested the values
 * itself could drift from it, and a consumer that trusted the flag while
 * the figures stayed nullable would need a cast to draw anything.
 */
type Result = Figures &
	(
		| { hasUsableFigures: true; storageUsed: number; storageLimit: number }
		| { hasUsableFigures: false; storageUsed: number | null; storageLimit: number | null }
	);

/**
 * React Query hook backing the storage meter.
 *
 * Fans out to the two routes that between them describe storage, because
 * neither is sufficient alone: `/site/backup/size` reports usage and the
 * day-counts, and `/site/backup/policies` reports the limit. A meter
 * drawn from `/size` alone has no denominator.
 *
 * Both halves are read defensively for the same reason. A route that
 * cannot decode WordPress.com's answer still returns a bare `null` body,
 * which WordPress serves as HTTP 200 — so the request resolves, React
 * Query records a success, and the only evidence of failure is the shape
 * of the data. Anything unreadable therefore has to collapse to `null`
 * here rather than to a zero, which would read as "you have used none of
 * your storage" and draw an empty bar over a full site.
 *
 * `/size` additionally carries WordPress.com's own `ok` flag *inside* a
 * 200 body; without it the sibling fields carry no meaning, so the whole
 * response is discarded rather than half-read. Legacy does the same, by
 * dispatching its failure action.
 *
 * @return The figures, the derived level, and whether to render.
 */
export function useStorageUsage(): Result {
	const sizeQuery = useSiteSizeQuery();
	const policiesQuery = useQuery( {
		queryKey: keys.sitePolicies(),
		queryFn: fetchSitePolicies,
		staleTime: SITE_POLICIES_STALE_MS,
		enabled: useCanQueryWpcom(),
	} );

	const size = sizeQuery.data?.ok ? sizeQuery.data : null;
	const policies = policiesQuery.data?.policies ?? null;

	const storageUsed = size?.size ?? null;
	const storageLimit = policies?.storage_limit_bytes ?? null;

	// Retention is not one field. The site's own `retention_days` wins
	// when it is set, and the plan's `activity_log_limit_days` stands in
	// when it is not — legacy spells this `backupRetentionDays ||
	// planRetentionDays` at `backup-storage-space/index.jsx:33`, and the
	// `||` is load-bearing: `retention_days` is `0` on a site with no
	// retention policy, not absent.
	const planRetentionDays = policies?.activity_log_limit_days ?? null;
	const retentionDays = size?.retention_days || planRetentionDays;

	const daysOfBackupsSaved = size?.days_of_backups_saved ?? null;
	const minDaysOfBackupsAllowed = size?.min_days_of_backups_allowed ?? null;

	// Both above zero or no forecast: `last_backup_size` may be omitted or reported as
	// zero, and `Math.floor( limit / 0 )` is `Infinity`, which would render as a day
	// count.
	const lastBackupSize = size?.last_backup_size ?? null;
	const forecastInDays =
		storageLimit !== null && storageLimit > 0 && lastBackupSize !== null && lastBackupSize > 0
			? Math.floor( storageLimit / lastBackupSize )
			: null;

	const usageLevel = getUsageLevel(
		storageUsed,
		storageLimit,
		minDaysOfBackupsAllowed,
		size?.days_of_backups_allowed ?? null,
		retentionDays,
		daysOfBackupsSaved
	);

	const figures: Figures = {
		usageLevel,
		isLoading: sizeQuery.isLoading || policiesQuery.isLoading,
		daysOfBackupsSaved,
		minDaysOfBackupsAllowed,
		forecastInDays,
		planRetentionDays,
		retentionDays,
		lastBackupSize,
	};

	// A limit of zero is not a limit anyone can be measured against, and a
	// site whose policy read came back empty would otherwise render a
	// full-width empty bar.
	if ( storageUsed !== null && storageLimit !== null && storageLimit > 0 ) {
		return { ...figures, hasUsableFigures: true, storageUsed, storageLimit };
	}

	return { ...figures, hasUsableFigures: false, storageUsed, storageLimit };
}

const DISMISSED_KEY = 'jetpack-backup-storage-notice-dismissed';
const DISMISSIBLE_LEVELS: StorageUsageLevelName[] = [ 'Warning', 'Critical' ];

/**
 * Reads the stored dismissal.
 *
 * @return The stored level, or null when none or storage is blocked.
 */
function readDismissedLevel(): StorageUsageLevelName | null {
	try {
		const stored = window.localStorage.getItem( DISMISSED_KEY );
		return DISMISSIBLE_LEVELS.find( level => level === stored ) ?? null;
	} catch {
		return null;
	}
}

/**
 * Stores or clears the dismissal.
 *
 * @param level - The level to store, or null to clear.
 */
function writeDismissedLevel( level: StorageUsageLevelName | null ) {
	try {
		if ( level === null ) {
			window.localStorage.removeItem( DISMISSED_KEY );
		} else {
			window.localStorage.setItem( DISMISSED_KEY, level );
		}
	} catch {
		// Blocked storage only means the notice comes back on the next load.
	}
}

/**
 * Remembers, in this browser, the highest warning level the reader dismissed.
 *
 * A worse level shows its notice again. `Full` and `BackupsDiscarded` are never
 * dismissible, so they are never read or stored.
 *
 * @param usageLevel - The current level, or null while unknown.
 * @return Whether the current level is dismissed, and a function to dismiss it.
 */
export function useStorageNoticeDismissal( usageLevel: StorageUsageLevelName | null ) {
	const [ dismissedLevel, setDismissedLevel ] = useState( readDismissedLevel );

	// Back to Normal means a later climb is a new event, so forget the old dismissal.
	useEffect( () => {
		if ( usageLevel === 'Normal' && dismissedLevel !== null ) {
			writeDismissedLevel( null );
			setDismissedLevel( null );
		}
	}, [ usageLevel, dismissedLevel ] );

	const rank = usageLevel === null ? -1 : DISMISSIBLE_LEVELS.indexOf( usageLevel );
	const isDismissible = rank !== -1;
	const isDismissed =
		isDismissible &&
		dismissedLevel !== null &&
		DISMISSIBLE_LEVELS.indexOf( dismissedLevel ) >= rank;

	const dismiss = useCallback( () => {
		if ( usageLevel === null || ! DISMISSIBLE_LEVELS.includes( usageLevel ) ) {
			return;
		}
		writeDismissedLevel( usageLevel );
		setDismissedLevel( usageLevel );
	}, [ usageLevel ] );

	return { isDismissible, isDismissed, dismiss };
}
