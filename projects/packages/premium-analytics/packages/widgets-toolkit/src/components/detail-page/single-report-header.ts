import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * What the header hook of a single-report page receives: the entity the page is about
 * and the report params the host composed for it.
 */
export type SingleReportHeaderArgs = {
	entityId: number;
	reportParams?: ReportParams;
};

export type SingleReportHeaderStatus = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * What the header hook returns. Data only: the page renders the slots, the skeleton,
 * the not-found and error states and the image fallback itself.
 */
export type SingleReportHeader = {
	status: SingleReportHeaderStatus;
	/** The entity's title; the page falls back to its label when empty. */
	title?: string;
	/** The entity-specific sentence, e.g. "Video uploaded on Aug 19, 2025."; the page appends the performance sentence. */
	subTitle?: string;
	/** A safe http(s) image URL for the visual slot; the page falls back to the header type's icon. */
	image?: string;
	/** The publication date as the report returns it; anchors the All time preset. */
	publishedDate?: string;
	error?: unknown;
	refetch?: () => void;
};

/**
 * The named export a header widget module provides.
 */
export type UseSingleReportHeader = ( args: SingleReportHeaderArgs ) => SingleReportHeader;
