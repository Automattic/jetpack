/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { download } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ExportResponsesModal from '../../components/export-responses-modal';
import useExportResponses from '../../hooks/use-export-responses';

import './style.scss';

const ExportResponsesButton = () => {
	const {
		showExportModal,
		openModal,
		closeModal,
		userCanExport,
		onExport,
		autoConnectGdrive,
		exportLabel,
	} = useExportResponses();

	if ( ! userCanExport ) {
		return null;
	}

	return (
		<>
			<Button __next40pxDefaultSize variant="secondary" icon={ download } onClick={ openModal }>
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
