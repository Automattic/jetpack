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

const CreateFormDropdownItem = () => {
	const { openNewForm } = useCreateForm();

	const analyticsEvent = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
			button: 'forms',
		} );
	}, [] );

	const onClick = useCallback( () => {
		openNewForm( {
			analyticsEvent,
		} );
	}, [ openNewForm, analyticsEvent ] );

	return {
		icon: plus,
		onClick,
		title: __( 'Create form', 'jetpack-forms' ),
	};
};

const ExportDropdownItem = ( { onClick }: { onClick: () => void } ) => {
	return {
		icon: download,
		onClick,
		title: __( 'Export', 'jetpack-forms' ),
	};
};

const ActionsDropdownMenu = ( { exportData }: ActionsDropdownMenuProps ) => {
	const { showExportModal, openModal, closeModal, onExport, autoConnectGdrive } =
		useExportResponses();

	return (
		<>
			<DropdownMenu
				controls={ [
					...( exportData.show ? [ ExportDropdownItem( { onClick: openModal } ) ] : [] ),
					CreateFormDropdownItem(),
				] }
				icon={ menu }
			/>

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
