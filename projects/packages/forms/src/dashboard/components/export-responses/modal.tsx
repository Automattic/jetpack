/**
 * External dependencies
 */
import {
	Modal,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import { store as dashboardStore } from '../../store/index.js';
import CSVExport from './csv.tsx';
import GoogleDriveExport from './google-drive.tsx';
import type { SelectIntegrations } from '../../../store/integrations/index.ts';
import type { FormResponse, Integration } from '../../../types/index.ts';

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

	// Inspect the current selection so we can inform the user when their
	// hand-picked rows include test responses (which would otherwise be
	// excluded automatically).
	const selectedTestCount = useSelect( select => {
		const ids = (
			select( dashboardStore ) as {
				getSelectedResponsesFromCurrentDataset: () => Array< string | number >;
			}
		 ).getSelectedResponsesFromCurrentDataset();
		const core = select( coreStore ) as {
			getEntityRecord: (
				kind: string,
				name: string,
				id: number
			) => FormResponse | null | undefined;
		};
		return ids.reduce< number >( ( count, id ) => {
			const record = core.getEntityRecord( 'postType', 'feedback', Number( id ) );
			return record?.is_test ? count + 1 : count;
		}, 0 );
	}, [] );

	const isGoogleDriveEnabled = integrations.some(
		integration => integration.id === 'google-drive'
	);
	return (
		<Modal
			title={ __( 'Export responses', 'jetpack-forms' ) }
			onRequestClose={ onRequestClose }
			size="large"
		>
			<VStack spacing={ 6 }>
				{ selectedTestCount > 0 && (
					<Notice.Root intent="info">
						<Notice.Description>
							{ sprintf(
								/* translators: %d: number of selected test responses. */
								_n(
									'Your selection includes %d test response from form preview. It will be included in the export.',
									'Your selection includes %d test responses from form preview. They will be included in the export.',
									selectedTestCount,
									'jetpack-forms'
								),
								selectedTestCount
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				<CSVExport onExport={ onExport } />
				{ isGoogleDriveEnabled && (
					<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
				) }
			</VStack>
		</Modal>
	);
};

export default ExportResponsesModal;
