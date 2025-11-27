/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useExportResponses from '../../hooks/use-export-responses.ts';
import useInboxData from '../../hooks/use-inbox-data.ts';
import ExportResponsesModal from './modal.tsx';

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
	const isDisabled = isEmpty || userCanExport === false;

	if ( userCanExport === false ) {
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
				disabled={ isDisabled }
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
