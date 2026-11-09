/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { box as productIcon, page as pageIcon, post as postIcon } from '@wordpress/icons';

/**
 * The wording for a post type slug; any type without its own reads as a post.
 *
 * @param type - The post type slug.
 * @return The type's label, fallback titles, view action, traffic tab, highlights and views names, and placeholder icon.
 */
export function getPostTypeCopy( type?: string ) {
	if ( type === 'page' ) {
		return {
			label: __( 'Page', 'jetpack-premium-analytics-pkg' ),
			untitled: __( 'Untitled page', 'jetpack-premium-analytics-pkg' ),
			unavailable: __( 'Page unavailable', 'jetpack-premium-analytics-pkg' ),
			view: __( 'View page', 'jetpack-premium-analytics-pkg' ),
			traffic: __( 'Page traffic', 'jetpack-premium-analytics-pkg' ),
			highlights: __( 'Page highlights', 'jetpack-premium-analytics-pkg' ),
			views: __( 'Page views', 'jetpack-premium-analytics-pkg' ),
			icon: pageIcon,
		};
	}

	if ( type === 'product' ) {
		return {
			label: __( 'Product', 'jetpack-premium-analytics-pkg' ),
			untitled: __( 'Untitled product', 'jetpack-premium-analytics-pkg' ),
			unavailable: __( 'Product unavailable', 'jetpack-premium-analytics-pkg' ),
			view: __( 'View product', 'jetpack-premium-analytics-pkg' ),
			traffic: __( 'Product traffic', 'jetpack-premium-analytics-pkg' ),
			highlights: __( 'Product highlights', 'jetpack-premium-analytics-pkg' ),
			views: __( 'Product views', 'jetpack-premium-analytics-pkg' ),
			icon: productIcon,
		};
	}

	return {
		label: __( 'Post', 'jetpack-premium-analytics-pkg' ),
		untitled: __( 'Untitled post', 'jetpack-premium-analytics-pkg' ),
		unavailable: __( 'Post unavailable', 'jetpack-premium-analytics-pkg' ),
		view: __( 'View post', 'jetpack-premium-analytics-pkg' ),
		traffic: __( 'Post traffic', 'jetpack-premium-analytics-pkg' ),
		highlights: __( 'Post highlights', 'jetpack-premium-analytics-pkg' ),
		views: __( 'Post views', 'jetpack-premium-analytics-pkg' ),
		icon: postIcon,
	};
}
