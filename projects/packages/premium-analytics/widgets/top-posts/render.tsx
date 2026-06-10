/**
 * External dependencies
 */
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { TopPosts, type TopPostsAttributes } from './top-posts';

type TopPostsRenderProps = {
	attributes?: TopPostsAttributes;
};

/**
 * Widget render entry point.
 *
 * Attributes flow to the inner component via props rather than
 * `WidgetRootContext` — the context's report params are WC-Analytics-shaped
 * and do not fit stats queries.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function TopPostsWidget( { attributes }: TopPostsRenderProps ) {
	return (
		<WidgetRoot>
			<TopPosts attributes={ attributes } />
		</WidgetRoot>
	);
}
