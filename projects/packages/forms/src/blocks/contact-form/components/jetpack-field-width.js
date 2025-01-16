import {
	BaseControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function JetpackFieldWidth( { setAttributes, width } ) {
	return (
		<BaseControl
			help={ __(
				'Adjust the width of the field to include multiple fields on a single line.',
				'jetpack-forms'
			) }
			className="jetpack-field-label__width"
			__nextHasNoMarginBottom={ true }
		>
			<ToggleGroupControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				aria-label={ __( 'Field Width', 'jetpack-forms' ) }
				isBlock
				label={ __( 'Field Width', 'jetpack-forms' ) }
				onClick={ value => setAttributes( { width: value } ) }
				value={ width }
			>
				{ [ 25, 50, 75, 100 ].map( widthValue => {
					return (
						<ToggleGroupControlOption
							key={ widthValue }
							label={ `${ widthValue }%` }
							value={ widthValue }
						/>
					);
				} ) }
			</ToggleGroupControl>
		</BaseControl>
	);
}
