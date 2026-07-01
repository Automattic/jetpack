/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './stats-breadcrumbs.module.scss';

type StatsBreadcrumbsProps = {
	/**
	 * The current post/page title, shown as the trailing crumb.
	 */
	title?: string;
};

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
	return (
		<div className={ styles.breadcrumbs }>
			<Link to="/" className={ styles.root }>
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
