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
				__next40pxDefaultSize
				className="export-button jp-forms__export-button--large-green"
				variant="secondary"
				icon={ download }
				onClick={ openModal }
			>
				{ __( 'Export', 'jetpack-forms' ) }
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
