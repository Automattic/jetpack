import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';

type CoreEditorSelect = {
	getCurrentPostType: () => string;
	isCurrentPostPublished: () => boolean;
};

/**
 * True once the current post (of type `post`) transitions from unpublished
 * to published during this editor session.
 *
 * The flip is deferred a tick: the post-published panel takes focus when it
 * appears, and a modal opened in the same tick would close on that outside
 * focus.
 * @return {boolean} Whether the post was just published.
 */
const useJustPublishedPost = (): boolean => {
	const { postType, isCurrentPostPublished } = useSelect( select => {
		const editor = select( 'core/editor' ) as CoreEditorSelect;
		return {
			postType: editor.getCurrentPostType(),
			isCurrentPostPublished: editor.isCurrentPostPublished(),
		};
	}, [] );

	const wasPublished = useRef( isCurrentPostPublished );
	const [ justPublished, setJustPublished ] = useState( false );

	useEffect( () => {
		if ( ! wasPublished.current && isCurrentPostPublished && postType === 'post' ) {
			const timeout = window.setTimeout( () => setJustPublished( true ) );
			return () => window.clearTimeout( timeout );
		}
		wasPublished.current = isCurrentPostPublished;
	}, [ isCurrentPostPublished, postType ] );

	return justPublished;
};

export default useJustPublishedPost;
