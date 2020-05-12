/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useEditorNotesMeta from './useEditorNotesMeta';
import './editor.scss';

export default function EditorNotesEdit( { attributes, className, setAttributes } ) {
	const { parsedBlocks, setNotes } = useEditorNotesMeta( attributes, setAttributes );

	const onChange = blocks => setNotes( blocks );

	return (
		<div className={ className }>
			<p className="wp-block-jetpack-editor-notes__label">{ __( 'Editor Notes', 'jetpack' ) }</p>
			<InnerBlocks __experimentalBlocks={ parsedBlocks } onChange={ onChange } />
		</div>
	);
}
