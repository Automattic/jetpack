import { getThreatType, type Threat } from '@automattic/jetpack-scan';
import {
	type Field,
	type FieldType,
	type Filter,
	type SortDirection,
	type SupportedLayouts,
	type View,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import ThreatSeverityBadge from '../threat-severity-badge';
import {
	THREAT_FIELD_EXTENSION,
	THREAT_FIELD_ICON,
	THREAT_FIELD_SAFETY,
	THREAT_FIELD_UPDATE,
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
	// TODO: Add types
	const baseView = {
		sort: {
			field: 'type',
			direction: 'desc' as SortDirection,
		},
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
			fields: [
				THREAT_FIELD_SAFETY,
				THREAT_FIELD_TYPE,
				THREAT_FIELD_EXTENSION,
				THREAT_FIELD_UPDATE,
			],
			layout: {
				primaryField: THREAT_FIELD_SAFETY,
			},
		},
		list: {
			...baseView,
			fields: [ THREAT_FIELD_SAFETY, THREAT_FIELD_TYPE, THREAT_FIELD_UPDATE ],
			layout: {
				primaryField: THREAT_FIELD_EXTENSION,
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
		const result = [
			{
				id: THREAT_FIELD_SAFETY,
				label: __( 'Safety', 'jetpack' ),
				// getValue?
				render( { item } ) {
					if ( item.threats.length === 0 ) {
						return <Icon icon={ check } size={ 20 } />;
						// TODO: Icons for checked/clean, unchecked, or threats
					}
				},
			},
			{
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack' ),
				elements: THREAT_TYPES,
				// getValue?
				render( { item } ) {
					// TODO: We could just captilize the first letter of type, or have a utility function to do this
					switch ( item.type ) {
						case 'core':
							return 'Core';
						case 'plugins':
							return 'Plugins';
						case 'themes':
							return 'Themes';
						case 'file':
							return 'File';
						default:
							return '';
					}
				},
			},
			{
				id: THREAT_FIELD_EXTENSION,
				label: __( 'Extension', 'jetpack' ),
				// enableGlobalSearch: true,
				// enableHiding: true,
				// getValue?
				render( { item } ) {
					return item.name ? item.name : '';
					// TODO: Account for file and db?
				},
			},
			{
				id: THREAT_FIELD_UPDATE,
				label: __( 'Update Available', 'jetpack' ),
				// getValue?
				render() {
					return <Icon icon={ check } size={ 20 } />;
					// TODO: Is this possible to determine?
				},
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack' ),
				enableHiding: false,
				// getValue?
				render() {
					return (
						<div className={ styles.threat__media }>
							<Icon icon={ check } size={ 20 } />
							{ /* TODO: Use utility function to get icon based on type, might need ot modify props */ }
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
	// TODO: Do we need this? dataset doesn't come with an id for each

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
