/**
 * External dependencies
 */
import type { SingleReportPageSection } from '../registry';
import type { DateRange } from '@jetpack-premium-analytics/datetime';
import type { ReactNode } from 'react';

/**
 * What a page knows about its entity once the summary request settles.
 */
export type EntitySummary = {
	/*
	 * The entity's title: the last crumb and the document title.
	 */
	title?: string;

	/*
	 * Where All time starts for this entity, as a site-local wall time or an offset instant.
	 */
	allTimeStart?: string;

	isLoading: boolean;

	/*
	 * Whether the request failed; the page then presents no fallback title as data.
	 */
	isError: boolean;

	/*
	 * The failed request's error, for `describeError`.
	 */
	error: unknown;

	/*
	 * Whether the entity is missing or is not of the page's kind.
	 */
	isNotFound: boolean;

	/*
	 * Re-runs the failed request.
	 */
	refetch: () => void;
};

/**
 * The slots of the page header, as `SectionHeader` takes them.
 */
export type SingleReportHeaderSlots = {
	visual?: ReactNode;
	title: ReactNode;
	subTitle?: ReactNode;
	busy?: boolean;
};

/**
 * What the page hands an adapter along with the summary.
 */
export type HeaderContext = {
	/*
	 * The record's label, the entity kind.
	 */
	label: string;

	/*
	 * The active inner section, on a page with sections.
	 */
	section?: SingleReportPageSection;

	/*
	 * The committed report range, stated as the performance window.
	 */
	performanceRange?: DateRange;
};

/**
 * The code a page needs beyond its record, keyed by the record's `path`. Method
 * signatures, so an adapter over a narrower summary fits the lookup table.
 */
export type SingleReportAdapter< Summary extends EntitySummary = EntitySummary > = {
	/*
	 * The entity's summary request, over the id as the URL carries it.
	 */
	useSummary( entityId: string ): Summary;

	/*
	 * The header slots for a summary in any state.
	 */
	headerSlots( summary: Summary, context: HeaderContext ): SingleReportHeaderSlots;

	/*
	 * Actions beside the page options, such as View post.
	 */
	headerActions?( summary: Summary ): ReactNode;

	/*
	 * The not-found notice's sentence, whole for translators; a page without one names no kind.
	 */
	notFoundDescription?(): string;
};
