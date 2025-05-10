import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { compose } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import JetpackFieldLabel from '../jetpack-field-label';
import { UpsellNudge } from '../upsell-nudge';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';
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
						top: '0',
						bottom: '0',
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
					width: '24px',
					height: '24px',
					scale: 'cover',
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
	const { attributes, clientId, isSelected, setAttributes, name } = props;
	const { id, label, required, requiredText, width } = attributes;
	const fieldFileAvailability = getJetpackExtensionAvailability( 'field-file' );

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: `jetpack-field${ isSelected ? ' is-selected' : '' }`,
		style: blockStyle,
	} );

	const isInnerBlockSelected = useSelect( select => {
		const selectedBlockClientId = select( 'core/block-editor' ).getSelectedBlockClientId();
		const blockParents = select( 'core/block-editor' ).getBlockParents( selectedBlockClientId );
		return blockParents.includes( clientId );
	} );

	const requiresCustomUpgradeNudge = useMemo( () => {
		return (
			( ! fieldFileAvailability || ! fieldFileAvailability.available ) &&
			fieldFileAvailability?.unavailableReason?.includes( 'nudge_disabled' )
		);
	}, [ fieldFileAvailability ] );

	return (
		<>
			<div { ...blockProps }>
				{ requiresCustomUpgradeNudge && ( isSelected || isInnerBlockSelected ) && (
					<UpsellNudge requiredPlan={ fieldFileAvailability?.details?.required_plan } />
				) }
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
				hidePlaceholder={ true }
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<p key="max-file-size">
								{ __( 'Maximum file size is set to 20MB', 'jetpack-forms' ) }
							</p>
						),
					},
					{
						index: 2,
						element: (
							<NumberControl
								key="maxfiles"
								label={ __( 'Number of files', 'jetpack-forms' ) }
								value={ attributes.maxfiles }
								onChange={ value =>
									setAttributes( {
										maxfiles: value,
									} )
								}
								max={ 10 }
								min={ 1 }
								step={ 1 }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
								help={ __(
									'Maximum number of files that the user is able to upload per form submission.',
									'jetpack-forms'
								) }
							/>
						),
					},
				] }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [ 'labelFontSize', 'labelLineHeight', 'labelColor' ] )
)( JetpackFieldFile );
