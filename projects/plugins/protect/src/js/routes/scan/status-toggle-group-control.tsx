import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import styles from './styles.module.scss';

/**
 * ToggleGroupControl component for filtering threats by status.
 * @param {object}   props                      - Component props.
 * @param {number}   props.activeThreatsCount   - Count of active threats.
 * @param {number}   props.historicThreatsCount - Count of historic threats.
 * @param {string}   props.selectedValue        - The selected value.
 * @param {Function} props.onStatusFilterChange - Callback function to handle status filter changes.
 *
 * @return {JSX.Element|null} The component or null.
 */
export default function StatusToggleGroupControl( {
	activeThreatsCount = 1,
	historicThreatsCount = 1,
	selectedValue = 'active',
	onStatusFilterChange,
}: {
	activeThreatsCount?: number;
	historicThreatsCount?: number;
	selectedValue?: string;
	onStatusFilterChange?: ( newStatus: string ) => void;
} ): JSX.Element {
	if ( ! ( activeThreatsCount + historicThreatsCount ) ) {
		return null;
	}

	try {
		return (
			<div>
				<div className={ styles[ 'toggle-group-control' ] }>
					<ToggleGroupControl
						value={ selectedValue }
						onChange={ onStatusFilterChange }
						isBlock
						hideLabelFromVision
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value={ 'active' }
							label={ sprintf(
								/* translators: %d: number of active threats */ __(
									'Active threats (%d)',
									'jetpack-protect'
								),
								activeThreatsCount
							) }
						/>
						<ToggleGroupControlOption
							value={ 'historic' }
							label={ sprintf(
								/* translators: %d: number of historic threats */
								__( 'History (%d)', 'jetpack-protect' ),
								historicThreatsCount
							) }
						/>
					</ToggleGroupControl>
				</div>
			</div>
		);
	} catch {
		return null;
	}
}
