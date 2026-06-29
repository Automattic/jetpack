import { ThemeProvider } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import SeoInspector from '../../_inc/screens/content/seo-inspector';
import type { ContentPostType } from '../../_inc/data/content-types';

type InspectorSearch = Record< string, unknown > & { postId?: string; postType?: string };

/**
 * The Content route's inspector: renders the per-post SEO editor in wp-build's
 * native sidebar slot. The selected post comes from the URL (`?postId` +
 * `?postType`, written by the stage's edit action); closing clears them.
 *
 * @return The inspector, or `null` when no post is selected.
 */
function Inspector() {
	const search = useSearch( {
		from: '/content' as unknown as never,
		strict: false,
	} ) as InspectorSearch;
	const navigate = useNavigate();

	const onClose = useCallback( () => navigate( { href: '/content' } ), [ navigate ] );

	const postId = Number( search.postId );
	if ( ! postId ) {
		return null;
	}
	const postType: ContentPostType = search.postType === 'page' ? 'page' : 'post';

	return (
		<ThemeProvider>
			<SeoInspector postId={ postId } postType={ postType } onClose={ onClose } />
		</ThemeProvider>
	);
}

export { Inspector as inspector };
