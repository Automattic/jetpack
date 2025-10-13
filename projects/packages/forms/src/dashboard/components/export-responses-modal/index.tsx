/**
 * External dependencies
 */
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { INTEGRATIONS_STORE } from '../../../store/integrations';
import CSVExport from '../../inbox/export-responses/csv';
import GoogleDriveExport from '../../inbox/export-responses/google-drive';
import type { SelectIntegrations } from '../../../store/integrations';
import type { Integration } from '../../../types';

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
	const { integrations } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		return {
			integrations: store.getIntegrations() || [],
		};
	}, [] ) as { integrations: Integration[] };

	const isGoogleDriveEnabled = integrations.some(
		integration => integration.id === 'google-drive'
	);
	return (
		<Modal
			title={ __( 'Export responses', 'jetpack-forms' ) }
			onRequestClose={ onRequestClose }
			size="large"
		>
			<VStack spacing={ 8 }>
				<CSVExport onExport={ onExport } />
				{ isGoogleDriveEnabled && (
					<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
				) }
			</VStack>
		</Modal>
	);
};

export default ExportResponsesModal;
