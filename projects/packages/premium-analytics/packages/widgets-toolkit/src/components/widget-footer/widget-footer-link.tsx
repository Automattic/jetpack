/**
 * External dependencies
 */
import { Link } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import reportLinkStyles from '../report-link/report-link.module.scss';
import type { ReactNode } from 'react';

export type WidgetFooterLinkProps = {
	href: string;
	children: ReactNode;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;
};

/**
 * Footer link to a page outside the dashboard, styled like `ReportLink`.
 *
 * @return The rendered footer link.
 */
export function WidgetFooterLink( { href, children, className }: WidgetFooterLinkProps ) {
	return (
		<Link href={ href } className={ clsx( reportLinkStyles.reportLink, className ) }>
			{ children }
		</Link>
	);
}
