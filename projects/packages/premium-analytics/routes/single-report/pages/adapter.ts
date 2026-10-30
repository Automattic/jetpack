/**
 * External dependencies
 */
import type { SingleReportPageSection } from '../registry';
import type { DateRange } from '@jetpack-premium-analytics/datetime';
import type { PageEmptyStateProps } from '@jetpack-premium-analytics/widgets-toolkit';
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
 * The window a section pins its widgets to in place of the URL's, or why it has none yet:
 * `pending` while the window resolves, `blocked` when it never will and the widgets mount anyway.
 */
export type SectionScope =
	{ reportParams: Record< string, unknown >; range: DateRange } | 'pending' | 'blocked';

/**
 * What an adapter says about one of the record's sections for the current entity.
 */
export type SectionState = {
	section: SingleReportPageSection;

	/*
	 * The tab is absent: the section does not apply to this entity.
	 */
	hidden?: boolean;

	/*
	 * A pinned window; the section then renders no date controls.
	 */
	scope?: SectionScope;

	/*
	 * Replaces the header and the widgets with one page-level state.
	 */
	emptyState?: PageEmptyStateProps;
};

/**
 * What the page knows when it asks an adapter about the sections.
 */
export type SectionsContext = {
	/*
	 * The entity id, as the URL carries it.
	 */
	entityId: string;

	/*
	 * The section the URL names, if any.
	 */
	activeSlug?: string;

	/*
	 * The site timezone, for a window computed from a date.
	 */
	timeZone: string;
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
	section?: SectionState;

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

	/*
	 * The state of each of the record's sections for this entity; absent, every section renders as declared.
	 */
	useSections?(
		summary: Summary,
		sections: SingleReportPageSection[],
		context: SectionsContext
	): SectionState[];
};
