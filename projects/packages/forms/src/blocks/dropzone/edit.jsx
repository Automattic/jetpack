import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import './editor.scss';

const BLOCKS_TEMPLATE = [
	[
		'core/paragraph',
		{
			content: __( 'Drag and drop or click to select a file.', 'jetpack-forms' ),
		},
	],
];

export default function DropzoneEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-form-file-field__dropzone' } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: BLOCKS_TEMPLATE,
	} );

	return <div { ...innerBlocksProps } />;
}
