import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import './editor.css';

const DEFAULT_ICON = `${ window?.jpFormsBlocks?.defaults?.assetsUrl }/images/upload-icon.svg`;

const BLOCKS_TEMPLATE = [
	[
		'core/group',
		{
			style: {
				spacing: {
					padding: {
						top: '48px',
						bottom: '48px',
						left: '48px',
						right: '48px',
					},
					margin: {
						top: '8px',
						bottom: '8px',
					},
				},
				border: {
					style: 'dashed',
					width: '1px',
					color: 'rgba(125,125,125,0.3)',
				},
			},
		},
		[
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
		],
	],
];

const JetpackDropzone = () => {
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<div className="jetpack-form-file-field__dropzone">
				<div className="jetpack-form-file-field__dropzone-inner">
					<input type="file" style={ { display: 'none' } } aria-hidden="true" />
					<InnerBlocks template={ BLOCKS_TEMPLATE } templateLock={ false } />
				</div>
			</div>
		</div>
	);
};

export default JetpackDropzone;
