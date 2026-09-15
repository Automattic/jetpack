/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { WidgetTypeAlias } from '../../widget-type-aliases';

/**
 * Page-local aliases for the author detail composition; see `WidgetTypeAlias`.
 * The two post spotlights are the dashboard's cards scoped to the author, so
 * their titles and help drop the dashboard's site-wide window.
 */
export const AUTHOR_DETAIL_WIDGET_TYPE_ALIASES: ReadonlyArray< WidgetTypeAlias > = [
	{
		baseType: 'jpa/popular-post',
		variants: [
			{
				name: 'jpa/popular-post--author',
				getTitle: () => __( 'Popular post', 'jetpack-premium-analytics-pkg' ),
				getHelp: () => ( {
					content: __(
						"This author's most viewed post in the selected period, with its all-time views, likes, and comments.",
						'jetpack-premium-analytics-pkg'
					),
				} ),
			},
		],
	},
	{
		baseType: 'jpa/latest-post',
		variants: [
			{
				name: 'jpa/latest-post--author',
				getTitle: () => __( 'Latest post', 'jetpack-premium-analytics-pkg' ),
				getHelp: () => ( {
					content: __(
						"This author's most recently published post, with its all-time views, likes, and comments.",
						'jetpack-premium-analytics-pkg'
					),
				} ),
			},
		],
	},
];
