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
	const { totalItemsTrash, isLoadingData } = useInboxData();

	if ( ! userCanExport ) {
		return null;
	}

	const isEmpty = ! isLoadingData && totalItemsTrash === 0;

	return (
		<>
			<Button
				__next40pxDefaultSize
				className="export-button jp-forms__export-button--large-green"
				variant="secondary"
				icon={ download }
				onClick={ openModal }
				disabled={ isEmpty }
				label={ isEmpty ? __( 'Nothing to export in current view.', 'jetpack-forms' ) : '' }
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
