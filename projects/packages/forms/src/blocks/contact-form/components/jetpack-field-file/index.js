import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import JetpackFieldLabel from '../jetpack-field-label';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';

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
				<InnerBlocks
					template={ [ [ 'jetpack/field-file-dropzone', {}, [] ] ] }
					templateLock="all"
				/>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				attributes={ attributes }
				extraFieldSettings={ [
					{
						index: 1,
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
