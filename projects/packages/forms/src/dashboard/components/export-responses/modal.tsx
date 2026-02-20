/**
 * External dependencies
 */
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import CSVExport from './csv.tsx';
import GoogleDriveExport from './google-drive.tsx';
import type { SelectIntegrations } from '../../../store/integrations/index.ts';
import type { Integration } from '../../../types/index.ts';

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
