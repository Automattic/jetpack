import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { DropdownOption } from '../search-bar';

// ToggleGroupControl and SelectControl treat '' as "no selection", so the "All" option needs a stand-in.
const ALL_VALUE = '__all';
export const toControlValue = ( value: string ) => ( value === '' ? ALL_VALUE : value );
export const fromControlValue = ( value: string ) => ( value === ALL_VALUE ? '' : value );

export type CampaignsFilterType = '' | 'active' | 'created' | 'finished' | 'rejected';

interface Props {
	campaignsFilter: CampaignsFilterType;
	handleChangeFilter: ( type: CampaignsFilterType ) => void;
	options: DropdownOption[];
}

/**
 *
 * @param props
 */
export default function CampaignsFilter( props: Props ) {
	const { handleChangeFilter, campaignsFilter, options } = props;

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			hideLabelFromVision
			label={ __( 'Campaign status', 'jetpack-blaze' ) }
			value={ toControlValue( campaignsFilter ) }
			onChange={ value =>
				handleChangeFilter( fromControlValue( String( value ) ) as CampaignsFilterType )
			}
		>
			{ options.map( option => (
				<ToggleGroupControlOption
					key={ option.value }
					value={ toControlValue( option.value ) }
					label={ option.label }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
