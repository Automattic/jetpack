import { useBlockProps } from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import JetpackFieldLabel from '../jetpack-field-label';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';
import './editor.css';

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
					<div className="jetpack-form-file-field__content">
						<div className="jetpack-form-file-field__icon">
							<SVG
								width="16"
								height="17"
								viewBox="0 0 16 17"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<Path
									d="M14.5 12V15.5H9V3.70002L13.5 7.80002L14.5 6.70002L8.3 0.900024L2.5 6.70002L3.5 7.80002L7.5 3.80002V15.5H1.5V12H0V17H16V12H14.5Z"
									fill="#1E1E1E"
								/>
							</SVG>
						</div>
						<div className="jetpack-form-file-field__text">
							<span>
								<span className="jetpack-form-file-field__select-link">
									{ __( 'Select a file', 'jetpack-forms' ) }
								</span>
								{ __( 'or drag and drop your file here', 'jetpack-forms' ) }
							</span>
							<span className="jetpack-form-file-field__formats">
								{ __( 'JPEG, PNG, PDF, and MP4 formats', 'jetpack-forms' ) }
							</span>
						</div>
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
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackFieldFile );
