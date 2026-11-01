import { getPostTypeCopy } from './post-type-copy';
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
	const titles: Record< string, string > = {
		'jpa/post-detail-highlights': highlights,
		'jpa/post-views': views,
	};

	const isChanged = widgetTypes.some(
		( { name, title } ) => name in titles && titles[ name ] !== title
	);

	return isChanged
		? widgetTypes.map( widgetType =>
				widgetType.name in titles ? { ...widgetType, title: titles[ widgetType.name ] } : widgetType
			)
		: widgetTypes;
}
