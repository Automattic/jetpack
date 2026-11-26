/**
 * External dependencies
 */
import { MENU_SURFACE_PRESETS_WITH_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import { JetpackFooter } from '@jetpack-premium-analytics/externals';
import { DateFiltersPanel, SectionHeader } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
import { createContext, useContext } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-page-layout.module.scss';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';
import type { ReactNode } from 'react';

// The applied date range as a key; null on a report with no period.
const ReportPeriodContext = createContext< string | null >( null );

const ALL_TIME_MENU = {
	presetIds: MENU_SURFACE_PRESETS_WITH_ALL_TIME,
	allTimeStartsOnServer: true,
} as const;

/**
 * Whether the report around the caller has a date window, so copy can speak of "this time period" only where one exists.
 *
 * @return True only inside a `ReportPageLayout` with date filters.
 */
export function useReportHasPeriod(): boolean {
	return useContext( ReportPeriodContext ) !== null;
}

/**
 * Identify the period the report is showing, so its tables can start over when it changes, even
 * to a period whose rows are cached and load without a loading state.
 *
 * @return A key that changes with the applied date range; empty on a report with no period.
 */
export function useReportPeriodKey(): string {
	return useContext( ReportPeriodContext ) ?? '';
}

export interface ReportPageLayoutProps {
	/** Heading for the section on screen: `Posts & Pages`. */
	title: string;
	/** Date-filter controller, from `useReportDateFilters`. Omit on a report with no date window. */
	dateFilters?: ReportDateFilters;
	/**
	 * Offer All time. Only for a report whose query adds `getReportWindowParams()` and whose
	 * endpoint reads `num: -1` as the whole history: `stats/video-plays` reads it as one day.
	 */
	withAllTime?: boolean;
	/** Internal tab bar for pages with multiple views (e.g. Posts & Pages / Archives). */
	tabs?: ReactNode;
	/** The stacked report sections (chart, records table, …). */
	children: ReactNode;
}

/**
 * Second-level report page scaffold: the scroll area below the page header,
 * holding the tabs, the section header pinned at its top, the stacked
 * sections and the footer. The header shows only the range — interval/comparison controls
 * are hidden, not cleared, so they survive on the URL.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( {
	title,
	dateFilters,
	withAllTime = false,
	tabs,
	children,
}: ReportPageLayoutProps ) {
	return (
		<div className={ styles.root }>
			{ tabs }
			<SectionHeader title={ title } pinned>
				{ dateFilters ? (
					<DateFiltersPanel { ...dateFilters } { ...( withAllTime ? ALL_TIME_MENU : {} ) } />
				) : null }
			</SectionHeader>
			<ReportPeriodContext.Provider
				value={ dateFilters ? JSON.stringify( dateFilters.appliedRange ) : null }
			>
				<div className={ styles.sections }>{ children }</div>
			</ReportPeriodContext.Provider>
			<JetpackFooter />
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
