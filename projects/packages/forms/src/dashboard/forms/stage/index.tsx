/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import CreateFormButton from '../../components/create-form-button/index.tsx';
import EmptyForms from '../../components/empty-forms/index.tsx';
import FormsStatsSidebar from '../../components/forms-stats-sidebar/index.tsx';
import FormsViewToggleButton from '../../components/forms-view-toggle-button/index.tsx';
import IntegrationsButton from '../../components/integrations-button/index.tsx';
import Page from '../../components/page/index.tsx';
import useFormsData from '../../hooks/use-forms-data.ts';
import { defaultLayouts, useView } from '../views.ts';
import type { FormSummary } from '../../hooks/use-forms-data.ts';

/**
 * Forms list DataViews implementation.
 *
 * @return {import('react').JSX.Element} The DataViews component for Forms.
 */
export default function FormsStage() {
	const [ view, setView ] = useView();
	const dateSettings = getDateSettings();
	const [ selectedFormId, setSelectedFormId ] = useState< string | null >( null );
	const navigate = useNavigate();
	const enableIntegrationsTab = useConfigValue( 'isIntegrationsEnabled' );

	const { records, isLoading, totalItems, totalPages } = useFormsData(
		view.page,
		view.perPage,
		view.search
	);

	const handleOpenStats = useCallback(
		( formId: string ) => () => setSelectedFormId( formId ),
		[]
	);

	const handleViewResponses = useCallback(
		( formId: string ) => () => navigate( `/responses?form=${ encodeURIComponent( formId ) }` ),
		[ navigate ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Form', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormSummary } ) => item.title,
				render: ( { item }: { item: FormSummary } ) => (
					<button
						type="button"
						className="jp-forms-forms-title-button button-link"
						onClick={ handleOpenStats( String( item.id ) ) }
					>
						{ item.title || __( '(no title)', 'jetpack-forms' ) }
					</button>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'modified',
				label: __( 'Last modified', 'jetpack-forms' ),
				render: ( { item }: { item: FormSummary } ) =>
					dateI18n( dateSettings.formats.datetime, item.modified ),
				enableSorting: false,
			},
			{
				id: 'responses',
				label: __( 'Responses', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormSummary } ) => item.responsesCount ?? 0,
				render: ( { item }: { item: FormSummary } ) => item.responsesCount ?? 0,
				enableSorting: false,
			},
			{
				id: 'actions',
				label: __( 'Actions', 'jetpack-forms' ),
				enableSorting: false,
				render: ( { item }: { item: FormSummary } ) => {
					const editUrl = `post.php?post=${ item.id }&action=edit&post_type=jetpack_form`;

					return (
						<div className="jp-forms-forms-actions">
							<a href={ editUrl } className="jp-forms-forms-actions__link">
								{ __( 'Edit form', 'jetpack-forms' ) }
							</a>
							<button
								type="button"
								className="jp-forms-forms-actions__link button-link"
								onClick={ handleViewResponses( String( item.id ) ) }
							>
								{ __( 'View responses', 'jetpack-forms' ) }
							</button>
							<button
								type="button"
								className="jp-forms-forms-actions__link button-link"
								onClick={ handleOpenStats( String( item.id ) ) }
							>
								{ __( 'View stats', 'jetpack-forms' ) }
							</button>
						</div>
					);
				},
			},
		],
		[ dateSettings.formats.datetime, handleOpenStats, handleViewResponses ]
	);

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	// The admin-ui DataViews View type does not exactly match our lightweight
	// view shape used for the Forms list, so we keep the runtime behavior but
	// relax the TypeScript typing here.
	const onChangeView = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		( newView: any ) => setView( newView ),
		[ setView ]
	);

	const headerActions = useMemo( () => {
		const actions = [ <FormsViewToggleButton key="toggle-view" /> ];

		if ( enableIntegrationsTab ) {
			actions.push( <IntegrationsButton key="integrations" /> );
		}

		actions.push( <CreateFormButton key="create" /> );

		return actions;
	}, [ enableIntegrationsTab ] );

	const getItemId = useCallback( ( item: FormSummary ) => String( item.id ), [] );

	const pageContent = (
		<Page
			title={
				<div className="jp-forms-page-header-title">
					<JetpackLogo showText={ false } width={ 20 } />
					{ __( 'Forms', 'jetpack-forms' ) }
				</div>
			}
			subTitle={ __( 'Below is a list of all your reusable forms.', 'jetpack-forms' ) }
			actions={ headerActions }
			hasPadding={ false }
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				data={ records || [] }
				isLoading={ isLoading }
				empty={ <EmptyForms /> }
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				view={ view as any }
				onChangeView={ onChangeView }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
			>
				<div className="jp-forms-view-actions">
					<div
						style={ {
							display: 'flex',
							gap: '8px',
							justifyContent: 'flex-end',
						} }
					>
						<DataViews.Search />
						<DataViews.ViewConfig />
					</div>
				</div>
				<div className="jp-forms-dataviews-layout-container">
					<DataViews.Layout />
					<DataViews.Footer />
				</div>
			</DataViews>
		</Page>
	);

	return (
		<>
			<div className="jp-forms-layout__surface is-stage is-forms-stage">{ pageContent }</div>
			<FormsStatsSidebar
				formId={ selectedFormId ?? '' }
				isOpen={ !! selectedFormId }
				onClose={ handleOpenStats( '' ) }
			/>
		</>
	);
}
