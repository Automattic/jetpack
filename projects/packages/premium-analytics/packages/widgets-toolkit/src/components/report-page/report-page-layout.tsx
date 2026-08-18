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
 * The shared second-level report page scaffold: optional internal tabs, the
 * section header, and the stacked report sections.
 *
 * The header offers the range alone. Its interval and comparison controls are
 * hidden rather than cleared, so both survive on the URL for the dashboard.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( { title, dateFilters, tabs, children }: ReportPageLayoutProps ) {
	const appliedRange = dateFilters?.appliedRange;
	const appliedPresetId = dateFilters?.appliedPresetId;

	// The applied range, not the picker's staged draft. No interval or
	// comparison: the header must not describe what it offers no control for.
	const subtitle = useMemo(
		() => getSectionSubtitle( { range: appliedRange, presetId: appliedPresetId } ),
		[ appliedRange, appliedPresetId ]
	);

	return (
		<div className={ clsx( styles.root, tabs && styles.rootTabbed ) }>
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
