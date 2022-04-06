/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	getGutenbergContext,
	POST_EDITOR_CONTEXT,
	SITE_EDITOR_CONTEXT,
	WIDGET_EDITOR_CONTEXT,
} from '../gutenberg/context/resolver';

export default function useOpenBlockSidebar() {
	const gutenbergContext = getGutenbergContext();
	const { enableComplementaryArea } = useDispatch( 'core/interface' );

	switch ( gutenbergContext ) {
		case SITE_EDITOR_CONTEXT:
			return () => enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
		case WIDGET_EDITOR_CONTEXT:
			return () => enableComplementaryArea( 'core/edit-widgets', 'edit-widgets/block-inspector' );
		case POST_EDITOR_CONTEXT:
			return () => enableComplementaryArea( 'core/edit-post', 'edit-post/block' );
	}
}
