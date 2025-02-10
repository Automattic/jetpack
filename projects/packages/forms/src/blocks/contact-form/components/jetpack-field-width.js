import {
	BaseControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PERCENTAGE_WIDTHS = [ '25%', '50%', '75%', '100%' ];

export default function JetpackFieldWidth( { setAttributes, attributes } ) {
	return (
		<BaseControl
			help={ __(
				'Adjust the width of the field to include multiple fields on a single line.',
				'jetpack-forms'
			) }
			__nextHasNoMarginBottom={ true }
		>
			<ToggleGroupControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				aria-label={ __( 'Width', 'jetpack-forms' ) }
				isBlock
				label={ __( 'Width', 'jetpack-forms' ) }
				onChange={ value =>
					setAttributes( {
						style: { ...attributes.style, layout: { flexSize: value, selfStretch: 'fixed' } },
					} )
				}
				value={ attributes.style.layout.flexSize ?? '100%' }
			>
				{ PERCENTAGE_WIDTHS.map( widthValue => {
					return (
						<ToggleGroupControlOption
							key={ widthValue }
							label={ widthValue }
							value={ widthValue }
						/>
					);
				} ) }
			</ToggleGroupControl>
		</BaseControl>
	);
}
