/**
 * WordPress dependencies
 */
import {
	BaseControl,
	RangeControl,
	Flex,
	FlexItem,
	useBaseControlProps,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUnitControl as UnitControl,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function roundToTwo( num: number ): number {
	return Math.round( num * 100 ) / 100;
}

const DEFAULT_UNITS = [ '%' ];

export default function ZoomRange( {
	zoom,
	label,
	onChange,
	showLabel = true,
}: {
	label: string;
	zoom: number;
	onChange: ( value: number ) => void;
	showLabel?: boolean;
} ) {
	const { baseControlProps } = useBaseControlProps( {
		label: showLabel ? label : '',
	} );

	const units = useCustomUnits( {
		availableUnits: DEFAULT_UNITS,
	} );

	const value = ( roundToTwo( zoom * 100 ) || 0 ) + '%';

	const [ valueQuantity ] = parseQuantityAndUnitFromRawValue( value, units );

	// Receives the new value from the UnitControl component as a string containing the value and unit.
	const handleUnitControlChange = ( newValue: string | undefined ) => {
		// Attempt to extract the scale value from the string. E.g. "150%" becomes 1.5.
		const updatedValue = parseFloat( newValue || '' ) / 100;
		// Lock the minimum zoom level to 1 (100%).
		onChange( updatedValue > 1 ? updatedValue : 1 );
	};

	// Receives the new value from the RangeControl component as a number.
	const handleRangeControlChange = ( newValue: number | undefined ) => {
		// Convert percentage value to a scale value. E.g. 150 becomes 1.5.
		onChange( newValue !== undefined ? newValue / 100 : 1 );
	};

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						__next40pxDefaultSize
						label={ label }
						hideLabelFromVision
						value={ value }
						onChange={ handleUnitControlChange }
						units={ units }
						min={ 0 }
					/>
				</FlexItem>
				<FlexItem isBlock>
					<Spacer marginX={ 2 } marginBottom={ 0 }>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ label }
							hideLabelFromVision
							value={ valueQuantity }
							withInputField={ false }
							onChange={ handleRangeControlChange }
							min={ 100 }
							max={ 500 }
							step={ 1 }
							renderTooltipContent={ currentValue => `${ currentValue }%` }
						/>
					</Spacer>
				</FlexItem>
			</Flex>
		</BaseControl>
	);
}
