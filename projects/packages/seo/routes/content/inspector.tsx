import { ThemeProvider } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import SeoInspector from '../../_inc/screens/content/seo-inspector';
import styles from '../../_inc/screens/content/style.module.scss';
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
	// ThemeProvider themes this frame instead of adding its own wrapper div, which has no height.
	const [ frame, setFrame ] = useState< HTMLDivElement | null >( null );

	const onClose = useCallback( () => navigate( { href: '/content' } ), [ navigate ] );

	const postId = Number( search.postId );
	if ( ! postId ) {
		return null;
	}
	const postType = ( search.postType || 'post' ) as ContentPostType;

	return (
		<div ref={ setFrame } className={ styles.inspectorFrame }>
			{ frame && (
				<ThemeProvider targetDom={ frame }>
					{ /* Keyed by post so switching rows remounts with that post's state
					     instead of reseeding over another post's unsaved edits. */ }
					<SeoInspector
						key={ postId }
						postId={ postId }
						postType={ postType }
						onClose={ onClose }
					/>
				</ThemeProvider>
			) }
		</div>
	);
}

export { Inspector as inspector };
