/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { DropdownMenu } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { menu, plus, download, plugins } from '@wordpress/icons';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import useCreateForm from '../../hooks/use-create-form.ts';
import useExportResponses from '../../hooks/use-export-responses.ts';
import useInboxData from '../../hooks/use-inbox-data.ts';
import { ExportResponsesModal } from '../export-responses/index.tsx';

type ActionsDropdownMenuProps = {
	exportData: { show: boolean };
};

const ActionsDropdownMenu = ( { exportData }: ActionsDropdownMenuProps ) => {
	const { openNewForm } = useCreateForm();
	const { showExportModal, openModal, closeModal, onExport, autoConnectGdrive, exportLabel } =
		useExportResponses();
	const navigate = useNavigate();
	const { totalItems, isLoadingData } = useInboxData();
	const hasItems = ! isLoadingData && totalItems > 0;

	const analyticsEvent = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
			button: 'forms',
		} );
	}, [] );

	const onCreateFormClick = useCallback( () => {
		openNewForm( {
			analyticsEvent,
		} );
	}, [ openNewForm, analyticsEvent ] );

	const onIntegrationsClick = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_button_click', {
			origin: 'dashboard',
		} );
		navigate( '/integrations' );
	}, [ navigate ] );

	const controls = [
		{
			icon: plus,
			onClick: onCreateFormClick,
			title: __( 'Create form', 'jetpack-forms' ),
		},
		{
			icon: plugins,
			onClick: onIntegrationsClick,
			title: __( 'Integrations', 'jetpack-forms' ),
		},
		...( exportData.show && hasItems
			? [
					{
						icon: download,
						onClick: openModal,
						title: exportLabel,
					},
			  ]
			: [] ),
	];

	return (
		<>
			<DropdownMenu controls={ controls } icon={ menu } />
			{ showExportModal && (
				<ExportResponsesModal
					onRequestClose={ closeModal }
					onExport={ onExport }
					autoConnectGdrive={ autoConnectGdrive }
				/>
			) }
		</>
	);
};

export default ActionsDropdownMenu;
