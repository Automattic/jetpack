import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import JetpackFieldLabel from '../jetpack-field-label';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';
import './editor.css';

// Base64 encoded version of our upload icon SVG
const DEFAULT_ICON =
	'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgMCAxNiAxNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQuNSAxMlYxNS41SDlWMy43MDAwMkwxMy41IDcuODAwMDJMMTQuNSA2LjcwMDAyTDguMyAwLjkwMDAyNEwyLjUgNi43MDAwMkwzLjUgNy44MDAwMkw3LjUgMy44MDAwMlYxNS41SDEuNVYxMkgwVjE3SDE2VjEySDE0LjVaIiBmaWxsPSIjMUUxRTFFIi8+PC9zdmc+';

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

const JetpackFieldFile = props => {
	const { attributes, clientId, isSelected, setAttributes } = props;
	const { id, label, required, requiredText, width } = attributes;

	useFormWrapper( { attributes, clientId } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: `jetpack-field${ isSelected ? ' is-selected' : '' }`,
		style: blockStyle,
	} );

	return (
		<>
			<div { ...blockProps }>
				<JetpackFieldLabel
					attributes={ attributes }
					label={ label }
					required={ required }
					requiredText={ requiredText }
					setAttributes={ setAttributes }
				/>
				<div className="jetpack-form-file-field__dropzone">
					<div className="jetpack-form-file-field__dropzone-inner">
						<input type="file" style={ { display: 'none' } } aria-hidden="true" />
						<InnerBlocks template={ BLOCKS_TEMPLATE } templateLock={ false } />
					</div>
				</div>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				attributes={ attributes }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [ 'labelFontSize', 'labelLineHeight', 'labelColor' ] )
)( JetpackFieldFile );
