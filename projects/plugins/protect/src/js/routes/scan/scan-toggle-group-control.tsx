import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useHistoryQuery from '../../data/scan/use-history-query';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import styles from './styles.module.scss';

/**
 * ToggleGroupControl component for filtering threats by status.
 *
 * @return {JSX.Element|null} The component or null.
 */
export default function ScanToggleGroupControl(): JSX.Element {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: status } = useScanStatusQuery();
	const { data: history } = useHistoryQuery();
	const numActiveThreats = status ? status.threats.length : 0;
	const numHistoricThreats = history ? history.threats.length : 0;

	const selectedValue = location.pathname.includes( '/history' ) ? 'historic' : 'active';

	const onChange = useCallback(
		( value: string ) => {
			navigate( value === 'active' ? '/scan' : '/scan/history' );
		},
		[ navigate ]
	);

	if ( ! ( numHistoricThreats + numActiveThreats ) ) {
		return null;
	}

	try {
		return (
			<div>
				<div className={ styles[ 'toggle-group-control' ] }>
					<ToggleGroupControl
						value={ selectedValue }
						onChange={ onChange }
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
								numActiveThreats
							) }
						/>
						<ToggleGroupControlOption
							value={ 'historic' }
							label={ sprintf(
								/* translators: %d: number of historic threats */
								__( 'History (%d)', 'jetpack-protect' ),
								numHistoricThreats
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
