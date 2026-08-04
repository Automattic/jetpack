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
	 * Crumbs after the dashboard root; the last one becomes the page heading.
	 */
	items?: ComponentProps< typeof Breadcrumbs >[ 'items' ];
}

export function StatsBreadcrumbs( { items = [] }: StatsBreadcrumbsProps ) {
	const dashboardLink = useDashboardLink();

	return (
		<div className={ styles.trail }>
			<Breadcrumbs
				items={ [
					{
						label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
						// An unlinked final crumb is the page heading.
						...( items.length > 0 ? { to: dashboardLink } : {} ),
					},
					...items,
				] }
			/>
		</div>
	);
}
