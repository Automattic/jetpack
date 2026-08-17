/**
 * External dependencies
 */
import { DateFiltersPanel, SectionHeader, getSectionSubtitle } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-page-layout.module.scss';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';
import type { ReactNode } from 'react';

export interface ReportPageLayoutProps {
	/**
	 * The report's own heading, the same string its trailing breadcrumb
	 * carries. Repeating it is the point: the breadcrumb is page chrome, while
	 * this names the surface the date controls beside it act on — the pairing
	 * the dashboard already has.
	 */
	title: string;
	/**
	 * The date-filter controller, from `useReportDateFilters`. The picker
	 * renders beside the title and the applied window is spelled out under it.
	 * Left out on a report with no date window (Annual insights, Emails, …),
	 * whose header is the title alone.
	 *
	 * The controller is the dashboard's, comparison and interval included, but
	 * this surface renders a control for neither. Both stay in the URL
	 * untouched, so the dashboard still has them on the way back.
	 */
	dateFilters?: ReportDateFilters;
	/** Internal tab bar for pages with multiple views (e.g. Posts & Pages / Archives). */
	tabs?: ReactNode;
	/** The stacked report sections (chart, records table, …). */
	children: ReactNode;
}

/**
 * The shared second-level report page scaffold: optional internal tabs, the
 * section header carrying the report's title and its date controls, and the
 * stacked report sections. Every module report page (Posts & Pages, Referrers,
 * …) composes this layout instead of re-implementing the page chrome.
 *
 * The header is `SectionHeader`, the same component the dashboard's sections
 * use, so a report and the section it was reached from describe their date
 * configuration identically. The panel is composed here rather than taken as a
 * slot: every report mounts the same instance of it, and that is one decision
 * rather than fourteen.
 *
 * That instance is the range alone. A records table is not bucketed, so there
 * is no interval control (the panel's default), and these pages do not offer
 * the period-over-period comparison either. Hiding both is presentational: the
 * controller still carries them and nothing here writes to the URL, so a
 * comparison or interval set on the dashboard survives a trip through a report
 * — and `buildRangePatch` keeps the comparison window in step with a range
 * edited here, so it is still the right one on the way back.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( { title, dateFilters, tabs, children }: ReportPageLayoutProps ) {
	const appliedRange = dateFilters?.appliedRange;
	const appliedPresetId = dateFilters?.appliedPresetId;

	/*
	 * States what the records below are showing, so it follows the applied
	 * range rather than the picker's staged draft.
	 *
	 * Neither the interval nor the comparison is named, because this surface
	 * offers a control for neither and a header must not describe a
	 * configuration its reader cannot reach.
	 */
	const subtitle = useMemo(
		() => getSectionSubtitle( { range: appliedRange, presetId: appliedPresetId } ),
		[ appliedRange, appliedPresetId ]
	);

	return (
		<div className={ styles.root }>
			{ tabs }
			<SectionHeader title={ title } subtitle={ subtitle }>
				{ dateFilters ? <DateFiltersPanel { ...dateFilters } showComparison={ false } /> : null }
			</SectionHeader>
			<div className={ styles.sections }>{ children }</div>
		</div>
	);
}

export interface ReportPageSectionProps {
	children: ReactNode;
	className?: string;
}

/**
 * A bordered card wrapping one report section (the performance chart, the
 * records table, …), so sections share consistent framing on every report page.
 *
 * @param {ReportPageSectionProps} props - The component props.
 * @return The section card.
 */
export function ReportPageSection( { children, className }: ReportPageSectionProps ) {
	return <section className={ clsx( styles.section, className ) }>{ children }</section>;
}
