/**
 * External dependencies
 */
import { Link } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import styles from './report-link.module.scss';

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
};

/**
 * Link from a dashboard widget to its full report.
 *
 * Preserves the shared dashboard date and comparison parameters while leaving
 * page-owned parameters, such as the report chart period, to the destination.
 *
 * @return The rendered report link.
 */
export function ReportLink( { report, section, label, ariaLabel, className }: ReportLinkProps ) {
	const search = useWidgetNavigationSearch( section );

	return (
		<Link
			render={
				<RouteLink
					to="/reports/$report"
					params={ { report } as unknown as never }
					search={ search as unknown as never }
				/>
			}
			className={ clsx( styles.reportLink, className ) }
			aria-label={ ariaLabel }
		>
			{ label ?? __( 'View all', 'jetpack-premium-analytics-pkg' ) }
		</Link>
	);
}
