import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const DEFAULT_ICON = `${ window?.jpFormsBlocks?.defaults?.assetsUrl }/images/upload-icon.svg`;

const BLOCKS_TEMPLATE = [
	[
		'core/image',
		{
			url: DEFAULT_ICON,
			width: 24,
			height: 24,
			align: 'center',
			className: 'is-style-default',
			style: {
				spacing: {
					margin: {
						bottom: '20px',
					},
				},
			},
		},
	],
	[
		'core/paragraph',
		{
			align: 'center',
			content: __(
				'<strong><a href="#">Select a file</a></strong> or drag and drop your file here',
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
	[
		'core/paragraph',
		{
			align: 'center',
			content: __( 'JPEG, PNG, PDF, and MP4 formats', 'jetpack-forms' ),
			style: {
				typography: {
					fontSize: '14px',
				},
			},
		},
	],
];

export default function DropzoneEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-form-file-field__dropzone' } );
	const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
		template: BLOCKS_TEMPLATE,
	} );

	return (
		<div { ...innerBlocksProps }>
			<input type="file" style={ { display: 'none' } } aria-hidden="true" />
			{ children }
		</div>
	);
}
