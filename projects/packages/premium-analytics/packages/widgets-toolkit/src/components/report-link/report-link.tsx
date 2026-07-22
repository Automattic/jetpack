/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../widget-root';

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
	 * Visible link label. Defaults to "See report".
	 */
	label?: string;

	/**
	 * Optional accessible label to disambiguate identical "See report" links on one page.
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
 * @param props           - Component props.
 * @param props.report    - Report id in the reports registry.
 * @param props.section   - Optional report section to open.
 * @param props.label     - Optional visible link label.
 * @param props.ariaLabel - Optional accessible link label.
 * @param props.className - Optional additional class name.
 * @return The rendered report link.
 */
export function ReportLink( { report, section, label, ariaLabel, className }: ReportLinkProps ) {
	const { reportParams } = useWidgetRootContext();
	const search = useMemo(
		() => ( {
			...pickReportDateParams( reportParams ),
			...( section ? { section } : {} ),
		} ),
		[ reportParams, section ]
	);

	return (
		<RouteLink
			to="/reports/$report"
			params={ { report } as unknown as never }
			search={ search as unknown as never }
			className={ className }
			aria-label={ ariaLabel }
		>
			{ label ?? __( 'See report', 'jetpack-premium-analytics' ) }
		</RouteLink>
	);
}
