import { type Threat } from '@automattic/jetpack-scan';
import { Tooltip } from '@wordpress/components';
import {
	type SupportedLayouts,
	type View,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import ShieldAlertIcon from '../shield-alert';
import ShieldCheckIcon from '../shield-check';
import {
	THREAT_FIELD_NAME,
	THREAT_FIELD_VERSION,
	THREAT_FIELD_ICON,
	THREAT_FIELD_SAFETY,
	THREAT_FIELD_TYPE,
	THREAT_TYPES,
	THREAT_ICONS,
} from './constants';
import styles from './styles.module.scss';

/**
 * DataViews component for displaying a scan report.
 *
 * @param {object}   props                   - Component props.
 * @param {Array}    props.data              - Threats data.
 * @param {Array}    props.filters           - Initial DataView filters.
 * @param {Function} props.onChangeSelection - Callback function run when an item is selected.
 *
 * @return {JSX.Element} The ScanReport component.
 */
export default function ScanReport( { data, filters, onChangeSelection } ): JSX.Element {
	const baseView = {
		search: '',
		filters: filters || [],
		page: 1,
		perPage: 20,
	};

	/**
	 * DataView default layouts.
	 *
	 * This property provides layout information about the view types that are active. If empty, enables all layout types (see “Layout Types”) with empty layout data.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#defaultlayouts-record-string-view
	 */
	const defaultLayouts: SupportedLayouts = {
		table: {
			...baseView,
			fields: [ THREAT_FIELD_SAFETY, THREAT_FIELD_TYPE, THREAT_FIELD_NAME, THREAT_FIELD_VERSION ],
			layout: {
				primaryField: THREAT_FIELD_SAFETY,
			},
		},
		list: {
			...baseView,
			fields: [ THREAT_FIELD_SAFETY, THREAT_FIELD_NAME, THREAT_FIELD_VERSION ],
			layout: {
				primaryField: THREAT_FIELD_TYPE,
				mediaField: THREAT_FIELD_ICON,
			},
		},
	};

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		...defaultLayouts.table,
	} );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-object
	 */
	const fields = useMemo( () => {
		const defaultIconDimension = { width: '16', height: '19.14' };

		const result = [
			{
				id: THREAT_FIELD_SAFETY,
				label: __( 'Safety', 'jetpack' ),
				render( { item } ) {
					if ( item.checked ) {
						if ( item.threats.length > 0 ) {
							return (
								<Tooltip className={ styles.tooltip } text={ __( 'Threat detected.', 'jetpack' ) }>
									<div className={ styles.icon }>
										<ShieldAlertIcon color={ '#F0B849' } { ...defaultIconDimension } />
									</div>
								</Tooltip>
							);
						}
						return (
							<Tooltip
								className={ styles.tooltip }
								text={ __( 'No known threats found that affect this version.', 'jetpack' ) }
							>
								<div className={ styles.icon }>
									<ShieldCheckIcon color={ '#069E08' } { ...defaultIconDimension } />
								</div>
							</Tooltip>
						);
					}
					return (
						<Tooltip
							className={ styles.tooltip }
							text={ __(
								'This item was added to your site after the most recent scan. We will check for threats during the next scheduled one.',
								'jetpack'
							) }
						>
							<div className={ styles.icon }>
								<ShieldCheckIcon color={ '#A7AAAD' } { ...defaultIconDimension } />
							</div>
						</Tooltip>
					);
				},
			},
			{
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack' ),
				elements: THREAT_TYPES,
				render( { item } ) {
					return item.type ? item.type.charAt( 0 ).toUpperCase() + item.type.slice( 1 ) : '';
				},
			},
			{
				id: THREAT_FIELD_NAME,
				label: __( 'Name', 'jetpack' ),
				enableGlobalSearch: true,
				render( { item } ) {
					return item.name ? item.name : '';
				},
			},
			{
				id: THREAT_FIELD_VERSION,
				label: __( 'Version', 'jetpack' ),
				enableGlobalSearch: true,
				render( { item } ) {
					return item.version ? item.version : '';
				},
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack' ),
				render( { item } ) {
					return (
						<div className={ styles.threat__media }>
							<Icon icon={ THREAT_ICONS[ item.type ] } />
						</div>
					);
				},
			},
		];

		return result;
	}, [] );

	/**
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 *
	 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dataviews/src/filter-and-sort-data-view.ts
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

	/**
	 * Callback function to update the view state.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#onchangeview-function
	 */
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	return (
		<DataViews
			data={ processedData }
			defaultLayouts={ defaultLayouts }
			fields={ fields }
			getItemId={ getItemId }
			onChangeSelection={ onChangeSelection }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			view={ view }
		/>
	);
}
