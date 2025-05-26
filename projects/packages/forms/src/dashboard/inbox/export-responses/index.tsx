/**
 * External dependencies
 */
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { Modal, Button, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useExportResponses from '../../hooks/use-export-responses';
import CSVExport from './csv';
import GoogleDriveExport from './google-drive';

import './style.scss';

const ExportResponsesButton = () => {
	const { showExportModal, openModal, closeModal, userCanExport, onExport, autoConnectGdrive } =
		useExportResponses();

	if ( ! userCanExport ) {
		return null;
	}

	return (
		<>
			<Button
				className="export-button jp-forms__export-button--large-green"
				variant="secondary"
				icon={ download }
				onClick={ openModal }
			>
				{ __( 'Export', 'jetpack-forms' ) }
			</Button>
			{ showExportModal && (
				<Modal
					title={ __( 'Export your Form Responses', 'jetpack-forms' ) }
					onRequestClose={ closeModal }
					size="large"
				>
					<VStack spacing={ 8 }>
						<p className="jp-forms__export-modal-header-subtitle">
							{ __( 'Choose your favorite file format or export destination:', 'jetpack-forms' ) }
						</p>
						<CSVExport onExport={ onExport } />
						<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
					</VStack>
				</Modal>
			) }
		</>
	);
};

export default ExportResponsesButton;
