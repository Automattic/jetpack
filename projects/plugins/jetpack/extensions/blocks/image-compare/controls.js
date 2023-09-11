import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ImageCompareControls( { attributes, setAttributes } ) {
	const { orientation } = attributes;
	return (
		<PanelBody title={ __( 'Orientation', 'jetpack' ) }>
			<RadioControl
				selected={ orientation || 'horizontal' }
				options={ [
					{ label: __( 'Side by side', 'jetpack' ), value: 'horizontal' },
					{ label: __( 'Above and below', 'jetpack' ), value: 'vertical' },
				] }
				onChange={ value => setAttributes( { orientation: value } ) }
			/>
		</PanelBody>
	);
}
