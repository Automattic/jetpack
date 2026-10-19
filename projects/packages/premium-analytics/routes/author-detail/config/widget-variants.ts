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
 * The post spotlights and the views table are the dashboard's cards scoped to
 * the author, so their titles and help drop the dashboard's site-wide wording.
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
						'This author’s most-viewed post, with its headline views, likes and comments.',
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
						'This author’s most recently published post, with its headline views, likes and comments.',
						'jetpack-premium-analytics-pkg'
					),
				} ),
			},
		],
	},
	{
		baseType: 'jpa/views-over-years',
		variants: [
			{
				name: 'jpa/views-over-years--author',
				getTitle: () => __( 'All-time traffic', 'jetpack-premium-analytics-pkg' ),
				getHelp: () => ( {
					content: __(
						'Every month of this author’s views since their first post, page or product, with each year’s total beside it. Always the full history: the period above doesn’t narrow it. Pick a month to read the rest of the page over it.',
						'jetpack-premium-analytics-pkg'
					),
				} ),
			},
		],
	},
];
