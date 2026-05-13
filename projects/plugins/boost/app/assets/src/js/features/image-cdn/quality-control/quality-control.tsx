import { CheckboxControl, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

type QualityControlProps = {
	label: string;
	quality: number;
	lossless: boolean;
	setQuality: ( newValue: number ) => void;
	setLossless: ( newValue: boolean ) => void;
	maxValue: number;
	minValue?: number;
};

const QualityControl = ( {
	label,
	quality,
	lossless,
	setQuality,
	setLossless,
	maxValue,
	minValue = 20,
}: QualityControlProps ) => {
	return (
		<Stack direction="column" gap="xs">
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ label }
				value={ quality }
				min={ minValue }
				max={ maxValue }
				disabled={ lossless }
				onChange={ value => setQuality( value ?? minValue ) }
			/>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __( 'Lossless', 'jetpack-boost' ) }
				checked={ lossless }
				onChange={ setLossless }
			/>
		</Stack>
	);
};

export default QualityControl;
