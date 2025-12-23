/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';
import CreateFormButton from '../components/create-form-button/index.tsx';
import Page from '../components/page';
import ViewToggle from '../components/page/view-toggle.tsx';
import useFormStats from '../hooks/use-form-stats';
import useFormsData from '../hooks/use-forms-data';
import FormStatsPanel from './stats-panel';

const defaultView = {
	type: 'table',
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	order: 'desc' as const,
	orderBy: 'modified',
};

const defaultLayouts = {
	table: {},
};

const getItemId = ( item: { id: number } ) => String( item.id );

/**
 * DataViews screen listing reusable forms.
 *
 * @return {JSX.Element} Forms view.
 */
export default function FormsView() {
	const [ view, setView ] = useState( defaultView );
	const navigate = useNavigate();
	const isCFMEnabled = useConfigValue( 'isCFMEnabled' );

	const { records, isLoading, totalItems, totalPages } = useFormsData( view );
	const [ selection, setSelection ] = useState< string[] >( [] );

	const selectedFormId = selection.length === 1 ? Number( selection[ 0 ] ) : null;
	const selectedForm = records?.find( record => record.id === selectedFormId );
	const stats = useFormStats( selectedFormId );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Form title', 'jetpack-forms' ),
				render: ( { item } ) => item.title?.rendered || __( '(Untitled)', 'jetpack-forms' ),
				getValue: ( { item } ) => item.title?.rendered || '',
				enableSorting: false,
			},
			{
				id: 'modified',
				label: __( 'Last modified', 'jetpack-forms' ),
				render: ( { item } ) => dateI18n( 'M j, Y', item.modified ),
				enableSorting: true,
			},
			{
				id: 'responses_count',
				label: __( 'Responses', 'jetpack-forms' ),
				render: ( { item } ) => item.responses_count ?? 0,
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-forms' ),
				render: ( { item } ) => item.status,
				enableSorting: false,
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'edit-form',
				label: __( 'Edit form', 'jetpack-forms' ),
				isPrimary: true,
				callback: ( items: Record< string, string >[] ) => {
					const [ item ] = items;
					if ( item?.edit_link ) {
						window.location.href = item.edit_link;
					}
				},
			},
			{
				id: 'view-responses',
				label: __( 'View responses', 'jetpack-forms' ),
				isPrimary: false,
				callback: items => {
					const [ item ] = items;
					navigate( `/responses?form=${ item.id }` );
				},
			},
			{
				id: 'view-stats',
				label: __( 'View stats', 'jetpack-forms' ),
				isPrimary: false,
				callback: items => {
					const [ item ] = items;
					setSelection( [ String( item.id ) ] );
				},
			},
		],
		[ navigate ]
	);

	const headerActions = useMemo( () => {
		const actionsArray = [];
		if ( isCFMEnabled ) {
			actionsArray.push( <ViewToggle key="toggle" /> );
		}
		actionsArray.push( <CreateFormButton key="create" /> );
		return actionsArray;
	}, [ isCFMEnabled ] );

	if ( isCFMEnabled === false ) {
		return (
			<Page
				title={ __( 'Forms', 'jetpack-forms' ) }
				subTitle={ __( 'Reusable forms are not available on this site.', 'jetpack-forms' ) }
				actions={ [ <CreateFormButton key="create-fallback" /> ] }
			>
				<p>{ __( 'Central form management is currently disabled.', 'jetpack-forms' ) }</p>
			</Page>
		);
	}

	return (
		<>
			<div className="jp-forms-layout__surface is-stage">
				<Page
					title={
						<div className="jp-forms-page-header-title">
							<JetpackLogo showText={ false } width={ 20 } />
							{ __( 'Forms', 'jetpack-forms' ) }
						</div>
					}
					subTitle={ __( 'Create, edit, and monitor your reusable forms.', 'jetpack-forms' ) }
					actions={ headerActions }
					hasPadding={ false }
				>
					<DataViews
						data={ records }
						isLoading={ isLoading }
						view={ view }
						onChangeView={ setView }
						fields={ fields }
						actions={ actions }
						getItemId={ getItemId }
						defaultLayouts={ defaultLayouts }
						selection={ selection }
						onChangeSelection={ setSelection }
						paginationInfo={ paginationInfo }
					>
						<div className="jp-forms-view-actions">
							<div className="jp-forms-forms-view__search">
								<DataViews.Search />
							</div>
							<DataViews.ViewConfig />
						</div>
						<DataViews.Layout />
						<DataViews.Footer />
					</DataViews>
				</Page>
			</div>
			{ selectedForm && (
				<div className="jp-forms-layout__surface is-inspector">
					<FormStatsPanel
						formTitle={ selectedForm.title?.rendered }
						stats={ stats.data }
						isLoading={ stats.isLoading }
					/>
				</div>
			) }
		</>
	);
}
