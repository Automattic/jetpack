/**
 * External dependencies
 */
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CSVExport from '../../inbox/export-responses/csv';
import GoogleDriveExport from '../../inbox/export-responses/google-drive';

type ExportResponsesModalProps = {
	onRequestClose: () => void;
	onExport: ( action: string, nonceName: string ) => Promise< Response >;
	autoConnectGdrive: boolean;
};

const ExportResponsesModal = ( {
	onRequestClose,
	onExport,
	autoConnectGdrive,
}: ExportResponsesModalProps ) => {
	return (
		<Modal
			title={ __( 'Export responses', 'jetpack-forms' ) }
			onRequestClose={ onRequestClose }
			size="large"
		>
			<VStack spacing={ 8 }>
				<CSVExport onExport={ onExport } />
				<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
			</VStack>
		</Modal>
	);
};

export default ExportResponsesModal;
