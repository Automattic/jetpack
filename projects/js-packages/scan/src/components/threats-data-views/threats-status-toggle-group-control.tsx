import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { type View } from '@wordpress/dataviews';
import { useMemo, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { type Threat, type ThreatStatus } from '@automattic/jetpack-scan';
import styles from './styles.module.scss';

/**
 * ToggleGroupControl component for filtering threats by status.
 * @param {object}     props              - Component props.
 * @param { Threat[]}  props.data         - Threats data.
 * @param { View }     props.view         - The current view.
 * @param { Function } props.onChangeView - Callback function to handle view changes.
 * @return {JSX.Element|null} The component or null.
 */
export default function ThreatsStatusToggleGroupControl( {
	data,
	view,
	onChangeView,
}: {
	data: Threat[];
	view: View;
	onChangeView: ( newView: View ) => void;
} ): JSX.Element {
	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {number} activeThreatsCount   - Count of active threats.
	 * @member {number} historicThreatsCount - Count of historic threats.
	 */
	const {
		activeThreatsCount,
		historicThreatsCount,
	}: {
		activeThreatsCount: number;
		historicThreatsCount: number;
	} = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				if ( threat.status ) {
					if ( threat.status === 'current' ) {
						acc.activeThreatsCount++;
					} else {
						acc.historicThreatsCount++;
					}
				}
				return acc;
			},
			{
				activeThreatsCount: 0,
				historicThreatsCount: 0,
			}
		);
	}, [ data ] );

	/**
	 * Callback function to handle the status change filter.
	 *
	 * @param {string} newStatus - The new status filter value.
	 */
	const onStatusFilterChange = useCallback(
		( newStatus: string ) => {
			const updatedFilters = view.filters.filter( filter => filter.field !== 'status' );

			if ( newStatus === 'active' ) {
				updatedFilters.push( {
					field: 'status',
					operator: 'isAny',
					value: [ 'current' ],
				} );
			} else if ( newStatus === 'historic' ) {
				updatedFilters.push( {
					field: 'status',
					operator: 'isAny',
					value: [ 'fixed', 'ignored' ],
				} );
			}

			onChangeView( {
				...view,
				filters: updatedFilters,
			} );
		},
		[ view, onChangeView ]
	);

	/**
	 * Memoized function to determine if a status filter is selected.
	 *
	 * @param {Array} threatStatuses - List of threat statuses.
	 */
	const isStatusFilterSelected = useMemo(
		() => ( threatStatuses: ThreatStatus[] ) =>
			view.filters.some(
				filter =>
					filter.field === 'status' &&
					Array.isArray( filter.value ) &&
					filter.value.length === threatStatuses.length &&
					threatStatuses.every( threatStatus => filter.value.includes( threatStatus ) )
			),
		[ view.filters ]
	);

	const selectedValue = useMemo( () => {
		if ( isStatusFilterSelected( [ 'current' ] ) ) {
			return 'active' as const;
		}
		if ( isStatusFilterSelected( [ 'fixed', 'ignored' ] ) ) {
			return 'historic' as const;
		}
		return '' as const;
	}, [ isStatusFilterSelected ] );

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
							value="active"
							label={ sprintf(
								/* translators: %d: number of active threats */ __(
									'Active threats (%d)',
									'jetpack-scan'
								),
								activeThreatsCount
							) }
						/>
						<ToggleGroupControlOption
							value="historic"
							label={ sprintf(
								/* translators: %d: number of historic threats */
								__( 'History (%d)', 'jetpack-scan' ),
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
