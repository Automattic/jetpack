/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { usePerNetworkCustomization } from './use-per-network-customization';

/**
 * Customization Toggle component for the social preview modal.
 *
 * @return - Customization Toggle component.
 */
export function CustomizationToggle() {
	const { isEnabled, toggle } = usePerNetworkCustomization();

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ _x( 'Customize', 'Verb: Customize the social preview', 'jetpack-publicize-pkg' ) }
			onChange={ toggle }
			value={ isEnabled ? 'each' : 'all' }
			hideLabelFromVision
		>
			<ToggleGroupControlOption
				label={ _x(
					'For all',
					'An option to customize for all networks',
					'jetpack-publicize-pkg'
				) }
				value="all"
			/>
			<ToggleGroupControlOption
				label={ _x(
					'For each',
					'An option to customize for each network',
					'jetpack-publicize-pkg'
				) }
				value="each"
			/>
		</ToggleGroupControl>
	);
}
