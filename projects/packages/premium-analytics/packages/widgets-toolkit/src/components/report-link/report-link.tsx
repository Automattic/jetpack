/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import { InternalLink } from '../internal-link';
import styles from './report-link.module.scss';
import type { ReactNode } from 'react';

export type ReportLinkProps = {
	/**
	 * Report id in the reports registry, e.g. `posts`. Becomes `/reports/<report>`.
	 */
	report: string;

	/**
	 * Optional report tab to open (`?section=`), resolved by the report's own resolver.
	 */
	section?: string;

	/**
	 * Visible link label. Defaults to "View all".
	 */
	label?: string;

	/**
	 * Optional accessible label to disambiguate identical "View all" links on one page.
	 */
	ariaLabel?: string;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;

	/**
	 * Rendered after the label, e.g. a count badge; the hover underline stays on the label.
	 */
	children?: ReactNode;
};

/**
 * Link from a dashboard widget to its full report.
 *
 * Preserves the shared dashboard date and comparison parameters while leaving
 * page-owned parameters, such as the report chart period, to the destination.
 *
 * @return The rendered report link.
 */
export function ReportLink( {
	report,
	section,
	label,
	ariaLabel,
	className,
	children,
}: ReportLinkProps ) {
	const search = useWidgetNavigationSearch( { section } );
	const text = label ?? __( 'View all', 'jetpack-premium-analytics-pkg' );

	return (
		<InternalLink
			to="/reports/$report"
			params={ { report } }
			search={ search }
			variant="default"
			className={ clsx( styles.reportLink, children && styles.hasContent, className ) }
			ariaLabel={ ariaLabel }
		>
			{ children ? (
				<>
					<span className={ styles.label }>{ text }</span>
					{ /* Keeps the accessible name "Adjustments 2" rather than "Adjustments2". */ }{ ' ' }
					{ children }
				</>
			) : (
				text
			) }
		</InternalLink>
	);
}
