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

type ExportResponse = {
	download_url: string;
	count: number;
};

type ExportResponsesModalProps = {
	onRequestClose: () => void;
	onExport: () => Promise< ExportResponse >;
	autoConnectGdrive: boolean;
	isExporting?: boolean;
};

const ExportResponsesModal = ( {
	onRequestClose,
	onExport,
	autoConnectGdrive,
	isExporting,
}: ExportResponsesModalProps ) => {
	return (
		<Modal
			title={ __( 'Export responses', 'jetpack-forms' ) }
			onRequestClose={ onRequestClose }
			size="large"
		>
			<VStack spacing={ 8 }>
				<CSVExport onExport={ onExport } isExporting={ Boolean( isExporting ) } />
				<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
			</VStack>
		</Modal>
	);
};

export default ExportResponsesModal;
