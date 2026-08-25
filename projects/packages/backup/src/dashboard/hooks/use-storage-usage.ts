import { useQuery } from '@tanstack/react-query';
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
	/** Size of the most recent backup in bytes, or null when unknown. */
	lastBackupSize: number | null;
	/** Days of backups the plan promises, or null when unknown. */
	planRetentionDays: number | null;
	/** Derived level driving the meter's colour and the section heading. */
	usageLevel: StorageUsageLevelName | null;
	isLoading: boolean;
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
 * Both halves are read defensively for the same reason. Every legacy
 * bridge answers a non-200 from WordPress.com with a bare `null` body,
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
 * @return Storage figures, the derived level, and whether to render.
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
	const lastBackupSize = size?.last_backup_size ?? null;
	const planRetentionDays = policies?.activity_log_limit_days ?? null;

	// Retention is not one field. The site's own `retention_days` wins
	// when it is set, and the plan's `activity_log_limit_days` stands in
	// when it is not — legacy spells this `backupRetentionDays ||
	// planRetentionDays` at `backup-storage-space/index.jsx:33`, and the
	// `||` is load-bearing: `retention_days` is `0` on a site with no
	// retention policy, not absent.
	const retentionDays = size?.retention_days || planRetentionDays;

	const usageLevel = getUsageLevel(
		storageUsed,
		storageLimit,
		size?.min_days_of_backups_allowed ?? null,
		size?.days_of_backups_allowed ?? null,
		retentionDays,
		size?.days_of_backups_saved ?? null
	);

	const figures: Figures = {
		lastBackupSize,
		planRetentionDays,
		usageLevel,
		isLoading: sizeQuery.isLoading || policiesQuery.isLoading,
	};

	// A limit of zero is not a limit anyone can be measured against, and a
	// site whose policy read came back empty would otherwise render a
	// full-width empty bar.
	if ( storageUsed !== null && storageLimit !== null && storageLimit > 0 ) {
		return { ...figures, hasUsableFigures: true, storageUsed, storageLimit };
	}

	return { ...figures, hasUsableFigures: false, storageUsed, storageLimit };
}
