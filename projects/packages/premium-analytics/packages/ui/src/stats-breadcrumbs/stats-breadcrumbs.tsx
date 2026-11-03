/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import styles from './stats-breadcrumbs.module.scss';
import type { ComponentProps } from 'react';

export interface StatsBreadcrumbsProps {
	/** Whether the root crumb is the dashboard's page heading. */
	isRoot?: boolean;
	/**
	 * Crumbs after the dashboard root; the last one becomes the page heading.
	 */
	items?: ComponentProps< typeof Breadcrumbs >[ 'items' ];
}

export function StatsBreadcrumbs( { isRoot = false, items = [] }: StatsBreadcrumbsProps ) {
	const dashboardLink = useDashboardLink();

	return (
		<div className={ styles.trail }>
			<Breadcrumbs
				items={ [
					{
						label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
						// An unlinked final crumb is the page heading, so only the
						// dashboard drops the link.
						...( isRoot ? {} : { to: dashboardLink } ),
					},
					...items,
				] }
			/>
		</div>
	);
}
