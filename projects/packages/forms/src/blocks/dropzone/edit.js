import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const BLOCKS_TEMPLATE = [
	[
		'core/paragraph',
		{
			align: 'center',
			content: __(
				'<strong><a href="#">Select a file</a></strong> or drag and drop your file here.',
				'jetpack-forms'
			),
			style: {
				spacing: {
					padding: {
						top: '8px',
						bottom: '8px',
					},
				},
				typography: {
					fontSize: '16px',
				},
			},
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
