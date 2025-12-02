/**
 * External dependencies
 */
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useFormsData from '../../hooks/use-forms-data.js';
import {
	viewFormAction,
	editFormAction,
	duplicateFormAction,
	deleteFormAction,
} from './actions.js';
import { useView, defaultLayouts } from './views.js';

const EMPTY_ARRAY = [];

/**
 * Get form ID for DataViews.
 *
 * @param {object} item - Form item.
 * @return {string} Form ID as string.
 */
const getItemId = item => {
	return item.id.toString();
};

/**
 * The DataViews implementation for Forms.
 *
 * @return {import('react').JSX.Element} The DataViews component.
 */
export default function FormsView() {
	const [ view, setView ] = useView();
	const dateSettings = getDateSettings();

	// Ensure view type is always table
	const tableView = {
		...view,
		type: 'table',
	};

	const { forms, isLoadingForms, totalItems, totalPages } = useFormsData( {
		per_page: tableView.perPage || 20,
		page: tableView.page || 1,
		search: tableView.search || '',
		orderby: tableView.sort?.field || 'modified',
		order: tableView.sort?.direction || 'desc',
	} );

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Form', 'jetpack-forms' ),
				render: ( { item } ) => {
					const title =
						decodeEntities( item.title.rendered ) || __( '(Untitled)', 'jetpack-forms' );
					const editUrl = `/wp-admin/post.php?post=${ item.id }&action=edit`;
					return (
						<a href={ editUrl } className="jp-forms__form-title-link">
							{ title }
						</a>
					);
				},
				getValue: ( { item } ) => {
					return decodeEntities( item.title.rendered ) || __( '(Untitled)', 'jetpack-forms' );
				},
				enableSorting: false,
				enableHiding: true,
			},
			{
				id: 'responses',
				label: __( 'Responses', 'jetpack-forms' ),
				render: ( { item } ) => {
					return item.meta._jetpack_form_response_count || 0;
				},
				getValue: ( { item } ) => {
					return item.meta._jetpack_form_response_count || 0;
				},
				enableSorting: false,
			},
			{
				id: 'modified',
				label: __( 'Last Modified', 'jetpack-forms' ),
				render: ( { item } ) => {
					return dateI18n( dateSettings.formats.datetime, item.modified );
				},
				getValue: ( { item } ) => {
					return item.modified;
				},
				enableSorting: true,
			},
			{
				id: 'date',
				label: __( 'Created', 'jetpack-forms' ),
				render: ( { item } ) => {
					return dateI18n( dateSettings.formats.datetime, item.date );
				},
				getValue: ( { item } ) => {
					return item.date;
				},
				enableSorting: true,
			},
		],
		[ dateSettings.formats.datetime ]
	);

	const actions = useMemo(
		() => [ viewFormAction, editFormAction, duplicateFormAction, deleteFormAction ],
		[]
	);

	const handleViewChange = useCallback(
		newView => {
			// Always force table view
			setView( {
				...newView,
				type: 'table',
			} );
		},
		[ setView ]
	);

	return (
		<div className="jp-forms__forms__dataviews">
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ forms || EMPTY_ARRAY }
				isLoading={ isLoadingForms }
				view={ tableView }
				onChangeView={ handleViewChange }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
			/>
		</div>
	);
}
