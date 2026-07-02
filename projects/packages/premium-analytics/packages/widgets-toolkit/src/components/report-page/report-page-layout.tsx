/**
 * External dependencies
 */
import { Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './report-page-layout.module.scss';
import type { ReactNode } from 'react';

export interface ReportPageLayoutProps {
	/** Page breadcrumbs (e.g. `Stats / Pages`), rendered at the top of the header. */
	breadcrumbs?: ReactNode;
	/** Short page description shown under the breadcrumbs. */
	description?: ReactNode;
	/** Header-right slot for page-level actions (e.g. a Download button). */
	actions?: ReactNode;
	/** Internal tab bar for pages with multiple views (e.g. Posts & Pages / Archives). */
	tabs?: ReactNode;
	/** Filters row shown above the content (the date-range + comparison picker). */
	filters?: ReactNode;
	/** The stacked report sections (chart, records table, …). */
	children: ReactNode;
}

/**
 * The shared second-level report page scaffold: a breadcrumb header with an
 * actions slot, optional internal tabs, a filters row, and the stacked report
 * sections. Every module report page (Posts & Pages, Referrers, …) composes
 * this layout instead of re-implementing the page chrome.
 *
 * @param {ReportPageLayoutProps} props - The component props.
 * @return The report page scaffold.
 */
export function ReportPageLayout( {
	breadcrumbs,
	description,
	actions,
	tabs,
	filters,
	children,
}: ReportPageLayoutProps ) {
	return (
		<div className={ styles.root }>
			<header className={ styles.header }>
				<div className={ styles.heading }>
					{ breadcrumbs }
					{ description ? (
						<Text variant="body-md" className={ styles.description }>
							{ description }
						</Text>
					) : null }
				</div>
				{ actions ? <div className={ styles.actions }>{ actions }</div> : null }
			</header>
			{ tabs }
			{ filters ? <div className={ styles.filters }>{ filters }</div> : null }
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
