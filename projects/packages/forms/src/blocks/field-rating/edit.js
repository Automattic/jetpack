import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function RatingFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const { max, default: defaultValue, required, id, width } = attributes;

	useFormWrapper( props );

	const blockProps = useBlockProps( {
		className: `jetpack-field jetpack-field-rating${
			width ? ` jetpack-field__width-${ width }` : ''
		}`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/rating-input' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Rating', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/rating-input', { max, default: defaultValue } ],
		],
		templateLock: 'all',
	} );

	return (
		<>
			<div { ...innerBlocksProps } />

			{ /* Rating settings now moved to child rating-input block */ }

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
