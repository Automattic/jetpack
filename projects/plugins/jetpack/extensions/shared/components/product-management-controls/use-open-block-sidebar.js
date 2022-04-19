/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { getEditorType, SITE_EDITOR, WIDGET_EDITOR } from '../../get-editor-type';

export default function useOpenBlockSidebar( clientId ) {
	const editorType = getEditorType();
	const { selectBlock } = useDispatch( blockEditorStore );
	const { enableComplementaryArea } = useDispatch( 'core/interface' );

	return () => {
		if ( clientId ) {
			selectBlock( clientId );
		}

		switch ( editorType ) {
			case SITE_EDITOR:
				return enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
			case WIDGET_EDITOR:
				return enableComplementaryArea( 'core/edit-widgets', 'edit-widgets/block-inspector' );
			default:
				enableComplementaryArea( 'core/edit-post', 'edit-post/block' );
		}
	};
}
