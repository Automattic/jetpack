/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import styles from './stats-breadcrumbs.module.scss';
import type { ComponentProps } from 'react';

export interface StatsBreadcrumbsProps {
	/**
	 * The crumbs below the dashboard, outermost first. The last one is the
	 * page's `h1`; omit them entirely on the dashboard itself.
	 */
	items?: ComponentProps< typeof Breadcrumbs >[ 'items' ];
}

/**
 * The dashboard's breadcrumb trail, rooted at the product name.
 *
 * Every page in the dashboard renders its title through this component so the
 * product is named once, in one place, rather than restated per page.
 *
 * @param props       - The component props.
 * @param props.items - The crumbs below the dashboard.
 * @return The breadcrumb trail.
 */
export function StatsBreadcrumbs( { items = [] }: StatsBreadcrumbsProps ) {
	// Carries the current report window back to the dashboard, so returning
	// from a report restores the view it was opened from.
	const dashboardLink = useDashboardLink();

	return (
		// The wrapper only carries a wp-admin reset; see the stylesheet.
		<div className={ styles.trail }>
			<Breadcrumbs
				items={ [
					{
						label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
						// On the dashboard this crumb is the page's own `h1`, and
						// `Breadcrumbs` only renders the heading for a crumb with no `to`.
						...( items.length > 0 ? { to: dashboardLink } : {} ),
					},
					...items,
				] }
			/>
		</div>
	);
}
