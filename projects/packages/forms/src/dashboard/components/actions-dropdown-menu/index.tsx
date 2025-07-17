/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { DropdownMenu } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { menu, plus, download } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useCreateForm from '../../hooks/use-create-form';
import useExportResponses from '../../hooks/use-export-responses';
import ExportResponsesModal from '../export-responses-modal';

type ActionsDropdownMenuProps = {
	exportData: { show: boolean };
};

const ActionsDropdownMenu = ( { exportData }: ActionsDropdownMenuProps ) => {
	const { openNewForm } = useCreateForm();
	const { showExportModal, openModal, closeModal, onExport, autoConnectGdrive, exportLabel } =
		useExportResponses();

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

	const controls = [
		...( exportData.show
			? [
					{
						icon: download,
						onClick: openModal,
						title: exportLabel,
					},
			  ]
			: [] ),
		{
			icon: plus,
			onClick: onCreateFormClick,
			title: __( 'Create form', 'jetpack-forms' ),
		},
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
