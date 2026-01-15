/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';
import CreateFormButton from '../components/create-form-button/index.tsx';
import { EmptyWrapper } from '../components/empty-responses/index.tsx';
import FormsResponsesTabs from '../components/forms-responses-tabs/index.tsx';
import Page from '../components/page/index.tsx';
import useFormsData from '../hooks/use-forms-data.ts';
import { defaultLayouts, useView } from './views.ts';
import './style.scss';
import type { FormListItem } from '../hooks/use-forms-data.ts';

/**
 * Forms dashboard "Forms" route.
 *
 * @return {JSX.Element|null} The Forms list page, or null when redirecting.
 */
export default function FormsDashboardForms(): JSX.Element | null {
	const navigate = useNavigate();
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	const isCentralFormManagementDisabled = isCentralFormManagementEnabled === false;

	const dateSettings = getDateSettings();
	const [ view, setView ] = useView();
	const { records, isLoading, totalItems, totalPages } = useFormsData(
		view.page,
		view.perPage,
		view.search
	);

	useEffect( () => {
		if ( isCentralFormManagementDisabled ) {
			navigate( '/responses', { replace: true } );
		}
	}, [ isCentralFormManagementDisabled, navigate ] );

	const statusLabel = useCallback( ( status: string ) => {
		switch ( status ) {
			case 'publish':
				return __( 'Published', 'jetpack-forms' );
			case 'draft':
				return __( 'Draft', 'jetpack-forms' );
			case 'pending':
				return __( 'Pending review', 'jetpack-forms' );
			case 'future':
				return __( 'Scheduled', 'jetpack-forms' );
			case 'private':
				return __( 'Private', 'jetpack-forms' );
			default:
				return status;
		}
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Form name', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.title,
				render: ( { item }: { item: FormListItem } ) =>
					item.title || __( '(no title)', 'jetpack-forms' ),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'entries',
				label: __( 'Entries', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.entriesCount ?? 0,
				render: ( { item }: { item: FormListItem } ) => item.entriesCount ?? 0,
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.status,
				render: ( { item }: { item: FormListItem } ) => statusLabel( item.status ),
				enableSorting: false,
			},
			{
				id: 'modified',
				label: __( 'Last updated', 'jetpack-forms' ),
				render: ( { item }: { item: FormListItem } ) =>
					dateI18n( dateSettings.formats.datetime, item.modified ),
				enableSorting: false,
			},
		],
		[ dateSettings.formats.datetime, statusLabel ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'edit-form',
				isPrimary: false,
				label: __( 'Edit', 'jetpack-forms' ),
				supportsBulk: false,
				async callback( items: FormListItem[] ) {
					const [ item ] = items;
					if ( ! item ) {
						return;
					}
					const fallbackEditUrl = `post.php?post=${ item.id }&action=edit&post_type=jetpack_form`;
					const editUrl = item.editUrl || fallbackEditUrl;
					const url = new URL( editUrl, window.location.origin );
					window.location.href = url.toString();
				},
			},
		],
		[]
	);

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	type DataViewsView = Parameters< typeof DataViews >[ 0 ][ 'view' ];

	const onChangeView = useCallback( ( newView: DataViewsView ) => setView( newView ), [ setView ] );

	const headerActions = useMemo( () => [ <CreateFormButton key="create" /> ], [] );
	const getItemId = useCallback( ( item: FormListItem ) => String( item.id ), [] );

	// Avoid rendering if the flag is off (we'll redirect).
	if ( isCentralFormManagementDisabled ) {
		return null;
	}

	return (
		<div className="jp-forms-layout__surface is-stage">
			<Page
				title={
					<div className="jp-forms-page-header-title">
						<JetpackLogo showText={ false } width={ 20 } />
						{ __( 'Forms', 'jetpack-forms' ) }
					</div>
				}
				subTitle={ __( 'View and manage all your forms in one place.', 'jetpack-forms' ) }
				tabs={ <FormsResponsesTabs /> }
				actions={ headerActions }
				hasPadding={ false }
			>
				<DataViews
					paginationInfo={ paginationInfo }
					fields={ fields }
					actions={ actions }
					data={ records || [] }
					isLoading={ isLoading }
					empty={
						<EmptyWrapper
							heading={ __( "You're set up. No forms yet.", 'jetpack-forms' ) }
							body={ __(
								'Create a shared form pattern to manage and reuse it across your site.',
								'jetpack-forms'
							) }
							actions={
								<CreateFormButton
									label={ __( 'Create a new form', 'jetpack-forms' ) }
									variant="primary"
								/>
							}
						/>
					}
					view={ view as unknown as DataViewsView }
					onChangeView={ onChangeView }
					getItemId={ getItemId }
					defaultLayouts={ defaultLayouts }
				>
					<div className="jp-forms-filters-bar">
						<div className="jp-forms-filters-bar__chips">
							<DataViews.FiltersToggled className="jp-forms-filters-container" />
						</div>
						<div className="jp-forms-filters-bar__controls">
							<DataViews.Search />
							<DataViews.FiltersToggle />
							<DataViews.ViewConfig />
						</div>
					</div>
					<div className="jp-forms-dataviews-layout-container">
						<DataViews.Layout />
						<DataViews.Footer />
					</div>
				</DataViews>
			</Page>
		</div>
	);
}
