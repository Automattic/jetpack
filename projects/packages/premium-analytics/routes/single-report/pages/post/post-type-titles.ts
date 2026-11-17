import { getPostTypeCopy } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import type { PostSummary } from './use-post-summary';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Retitle the highlights and views cards for the post type. Returns the input
 * array untouched when no title changes, so memoized consumers keep their identity.
 *
 * @param widgetTypes - The page's widget types.
 * @param postType    - The post type slug.
 * @return The widget types, with the two cards titled for the type.
 */
export function withPostTypeTitles( widgetTypes: WidgetType[], postType?: string ): WidgetType[] {
	const { highlights, views } = getPostTypeCopy( postType );
	const titles = new Map< string, string >( [
		[ 'jpa/post-detail-highlights', highlights ],
		[ 'jpa/post-views', views ],
	] );

	const isChanged = widgetTypes.some(
		( { name, title } ) => titles.has( name ) && titles.get( name ) !== title
	);

	return isChanged
		? widgetTypes.map( widgetType =>
				titles.has( widgetType.name )
					? { ...widgetType, title: titles.get( widgetType.name ) }
					: widgetType
			)
		: widgetTypes;
}

/**
 * The page's widget types: the highlights and views cards titled for the post type.
 *
 * @param widgetTypes - The registered types.
 * @param summary     - The post summary.
 * @return The types, retitled once the type is known.
 */
export function usePostWidgetTypes(
	widgetTypes: WidgetType[],
	summary: PostSummary
): WidgetType[] {
	return useMemo(
		() => withPostTypeTitles( widgetTypes, summary.type ),
		[ widgetTypes, summary.type ]
	);
}
