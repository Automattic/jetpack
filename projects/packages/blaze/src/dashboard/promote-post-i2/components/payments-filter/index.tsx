import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useMediaQuery } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { DropdownOption, FilterSelect } from '../search-bar';
import './style.scss';

export type PaymentsFilterType = 'unified' | 'currentSite';

interface Props {
	options: DropdownOption[];
	paymentsFilter: PaymentsFilterType;
	handleChangeFilter: ( flag: boolean ) => void;
}

/**
 *
 * @param props
 */
export default function PaymentsFilter( props: Props ) {
	const { handleChangeFilter, paymentsFilter, options } = props;
	const isDesktop = useMediaQuery( '(min-width: 1300px)' );
	const label = __( 'Payments to show', 'jetpack-blaze' );

	return (
		<div className="promote-post-i2__search-bar-wrapper payments">
			{ isDesktop ? (
				<ToggleGroupControl
					__next40pxDefaultSize
					hideLabelFromVision
					label={ label }
					value={ paymentsFilter }
					onChange={ value => handleChangeFilter( value === 'currentSite' ) }
				>
					{ options.map( option => (
						<ToggleGroupControlOption
							key={ option.value }
							value={ option.value }
							label={ option.label }
						/>
					) ) }
				</ToggleGroupControl>
			) : (
				<FilterSelect
					className="promote-post-i2__search-bar-dropdown payment-filter"
					label={ label }
					options={ options }
					value={ paymentsFilter }
					onChange={ option => handleChangeFilter( option.value === 'currentSite' ) }
				/>
			) }
		</div>
	);
}
