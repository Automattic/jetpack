import { type ScanReportExtension } from '@automattic/jetpack-scan';
import { Tooltip } from '@wordpress/components';
import {
	type SupportedLayouts,
	type View,
	type Field,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { __, _n } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import ShieldIcon from '../shield-icon';
import {
	FIELD_NAME,
	FIELD_VERSION,
	FIELD_ICON,
	FIELD_STATUS,
	FIELD_TYPE,
	STATUS_TYPES,
	TYPES,
	ICONS,
} from './constants';
import styles from './styles.module.scss';

/**
 * DataViews component for displaying a scan report.
 *
 * @param {object}   props                   - Component props.
 * @param {string}   props.dataSource        - Data source.
 * @param {Array}    props.data              - Scan report data.
 * @param {Function} props.onChangeSelection - Callback function run when an item is selected.
 *
 * @return {JSX.Element} The ScanReport component.
 */
export default function ScanReport( { dataSource, data, onChangeSelection } ): JSX.Element {
	const baseView = {
		search: '',
		filters: [],
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
			fields: [ FIELD_TYPE, FIELD_NAME, FIELD_VERSION ],
			titleField: FIELD_STATUS,
			showMedia: false,
		},
		list: {
			...baseView,
			fields: [ FIELD_STATUS, FIELD_VERSION, FIELD_TYPE ],
			titleField: FIELD_NAME,
			mediaField: FIELD_ICON,
			showMedia: true,
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
		const iconHeight = 20;
		const result: Field< ScanReportExtension >[] = [
			{
				id: FIELD_STATUS,
				elements: STATUS_TYPES,
				label: __( 'Status', 'jetpack-components' ),
				enableHiding: false,
				getValue( { item } ) {
					if ( item.checked ) {
						if ( item.threats.length > 0 ) {
							return 'threat';
						}
						return 'checked';
					}
					return 'unchecked';
				},
				render( { item }: { item: ScanReportExtension } ) {
					const scanApi = 'scan_api' === dataSource;
					let variant: 'info' | 'warning' | 'success' = 'info';
					let text = __(
						'This item was added to your site after the most recent scan. We will check for threats during the next scheduled one.',
						'jetpack-components'
					);

					if ( item.checked ) {
						if ( item.threats.length > 0 ) {
							variant = 'warning';
							text = _n(
								'Vulnerability detected.',
								'Vulnerabilities detected.',
								item.threats.length,
								'jetpack-components'
							);

							if ( scanApi ) {
								text = _n(
									'Threat detected.',
									'Threats detected.',
									item.threats.length,
									'jetpack-components'
								);
							}
						} else {
							variant = 'success';
							text = __(
								'No known vulnerabilities found that affect this version.',
								'jetpack-components'
							);

							if ( scanApi ) {
								text = __(
									'No known threats found that affect this version.',
									'jetpack-components'
								);
							}
						}
					}

					return (
						<Tooltip className={ styles.tooltip } text={ text }>
							<div className={ styles.icon }>
								<ShieldIcon variant={ variant } height={ iconHeight } />
							</div>
						</Tooltip>
					);
				},
			},
			{
				id: FIELD_TYPE,
				label: __( 'Type', 'jetpack-components' ),
				elements: TYPES,
				enableHiding: false,
			},
			{
				id: FIELD_NAME,
				label: __( 'Name', 'jetpack-components' ),
				enableHiding: false,
				enableGlobalSearch: true,
				getValue( { item }: { item: ScanReportExtension } ) {
					return item.name ? item.name : '';
				},
			},
			{
				id: FIELD_VERSION,
				label: __( 'Version', 'jetpack-components' ),
				enableHiding: false,
				enableSorting: false,
				enableGlobalSearch: true,
				getValue( { item }: { item: ScanReportExtension } ) {
					return item.version ? item.version : '';
				},
			},
			...( view.type === 'list'
				? [
						{
							id: FIELD_ICON,
							label: __( 'Icon', 'jetpack-components' ),
							enableSorting: false,
							enableHiding: false,
							getValue( { item }: { item: ScanReportExtension } ) {
								return ICONS[ item.type ] || '';
							},
							render( { item }: { item: ScanReportExtension } ) {
								return (
									<div className={ styles.threat__media }>
										<Icon icon={ ICONS[ item.type ] } />
									</div>
								);
							},
						},
				  ]
				: [] ),
		];

		return result;
	}, [ view, dataSource ] );

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
	const getItemId = useCallback(
		( item: ScanReportExtension ) => `${ item.type }_${ item.slug }_${ item.version }`,
		[]
	);

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
