/**
 * External dependencies
 */
import { DateFiltersPanel, SectionHeader } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './report-page-layout.module.scss';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';
import type { ReactNode } from 'react';

export interface ReportPageLayoutProps {
	/** Heading for the section on screen: `Posts & pages report`. */
	title: string;
	/** Date-filter controller, from `useReportDateFilters`. Omit on a report with no date window. */
	dateFilters?: ReportDateFilters;
	/** Internal tab bar for pages with multiple views (e.g. Posts & Pages / Archives). */
	tabs?: ReactNode;
	/** The stacked report sections (chart, records table, …). */
	children: ReactNode;
}

/**
 * Second-level report page scaffold: tabs, section header, and stacked
 * sections. The header shows only the range — interval/comparison controls
 * are hidden, not cleared, so they survive on the URL.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( { title, dateFilters, tabs, children }: ReportPageLayoutProps ) {
	return (
		<div className={ styles.root }>
			{ tabs }
			<SectionHeader title={ title }>
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
