/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { Link, useSearch } from '@wordpress/route';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './stats-breadcrumbs.module.scss';

export interface StatsBreadcrumbsProps {
	/**
	 * The current post/page title, shown as the trailing crumb.
	 */
	title?: string;
}

/**
 * The "Stats / <post title>" breadcrumb shown in the page header.
 *
 * The leading "Stats" crumb links back to the dashboard; the trailing crumb is
 * the current resource's title.
 *
 * @param props       - Component props.
 * @param props.title - The current post/page title.
 * @return The breadcrumb element.
 */
export function StatsBreadcrumbs( { title }: StatsBreadcrumbsProps ) {
	// Carry the shared date range and comparison back to the dashboard so the
	// breadcrumb and the browser Back button return to the same view. Page-scoped
	// params (`post_id`, `section`) are dropped by `pickReportDateParams`.
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const dashboardSearch = pickReportDateParams( search );

	return (
		<div className={ styles.breadcrumbs }>
			<Link to="/" search={ dashboardSearch as unknown as never } className={ styles.root }>
				{ __( 'Stats', 'jetpack-premium-analytics' ) }
			</Link>
			{ title ? (
				<>
					<span className={ styles.separator } aria-hidden="true">
						/
					</span>
					<Text variant="body-md" className={ styles.current }>
						{ title }
					</Text>
				</>
			) : null }
		</div>
	);
}
