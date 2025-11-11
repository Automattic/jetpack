/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ExportResponsesModal from '../../components/export-responses-modal';
import useExportResponses from '../../hooks/use-export-responses';
import useInboxData from '../../hooks/use-inbox-data';

import './style.scss';

const ExportResponsesButton = ( { isPrimary = false }: { isPrimary?: boolean } ) => {
	const {
		showExportModal,
		openModal,
		closeModal,
		userCanExport,
		onExport,
		autoConnectGdrive,
		exportLabel,
	} = useExportResponses();
	const { totalItems, isLoadingData } = useInboxData();
	const isEmpty = isLoadingData || totalItems === 0;

	if ( ! userCanExport ) {
		return null;
	}

	return (
		<>
			<Button
				size="compact"
				variant={ isPrimary ? 'primary' : 'secondary' }
				icon={ download }
				onClick={ openModal }
				accessibleWhenDisabled
				disabled={ isEmpty }
				label={ isEmpty ? __( 'Nothing to export.', 'jetpack-forms' ) : '' }
				showTooltip={ isEmpty }
			>
				{ exportLabel }
			</Button>

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

export default ExportResponsesButton;
