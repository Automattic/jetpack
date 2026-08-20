/**
 * External dependencies
 */
import { Link } from '@jetpack-premium-analytics/externals';
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../widget-root';
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
	const { reportParams, navigationParams = reportParams } = useWidgetRootContext();
	const search = useMemo(
		() => ( {
			...pickReportDateParams( navigationParams ),
			...( section ? { section } : {} ),
		} ),
		[ navigationParams, section ]
	);

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
