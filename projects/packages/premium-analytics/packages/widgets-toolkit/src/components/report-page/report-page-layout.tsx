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
 * slot: every report mounts the same instance of it — no interval control over
 * a records table, comparison available — and that is one decision, not
 * fourteen.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( { title, dateFilters, tabs, children }: ReportPageLayoutProps ) {
	const appliedRange = dateFilters?.appliedRange;
	const appliedPresetId = dateFilters?.appliedPresetId;
	const appliedComparisonPresetId = dateFilters?.appliedComparisonPresetId;

	/*
	 * States what the records below are showing, so it follows the applied
	 * range rather than the picker's staged draft. No interval: a records table
	 * is not bucketed by one, so these pages carry no interval control and the
	 * subtitle must not name a bucket the reader cannot change.
	 */
	const subtitle = useMemo(
		() =>
			getSectionSubtitle( {
				range: appliedRange,
				presetId: appliedPresetId,
				comparisonPresetId: appliedComparisonPresetId,
			} ),
		[ appliedRange, appliedPresetId, appliedComparisonPresetId ]
	);

	return (
		<div className={ styles.root }>
			{ tabs }
			<SectionHeader title={ title } subtitle={ subtitle }>
				{ dateFilters ? <DateFiltersPanel { ...dateFilters } /> : null }
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
