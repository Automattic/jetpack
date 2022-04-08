/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { getEditorType, SITE_EDITOR, WIDGET_EDITOR } from '../../get-editor-type';

export default function useOpenBlockSidebar() {
	const editorType = getEditorType();
	const { enableComplementaryArea } = useDispatch( 'core/interface' );

	switch ( editorType ) {
		case SITE_EDITOR:
			return () => enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
		case WIDGET_EDITOR:
			return () => enableComplementaryArea( 'core/edit-widgets', 'edit-widgets/block-inspector' );
		default:
			return () => enableComplementaryArea( 'core/edit-post', 'edit-post/block' );
	}
}
