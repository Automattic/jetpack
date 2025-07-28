import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import './style.scss';

const debug = debugFactory( 'jetpack-forms:field-phone-number' );

export default function PhoneNumberFieldEdit( props ) {
	useFormWrapper( props );
	const { attributes, setAttributes, clientId } = props;
	const { required, id, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: `jetpack-field jetpack-field-phone-number${
			width ? ` jetpack-field__width-${ width }` : ''
		}`,
		style: blockStyle,
	} );

	debug( 'blockProps', blockProps );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/phone-number-input' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Phone Number', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/phone-number-input', {} ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	debug( 'innerBlocksProps', innerBlocksProps );

	return (
		<>
			<div { ...innerBlocksProps } />

			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</>
	);
}
