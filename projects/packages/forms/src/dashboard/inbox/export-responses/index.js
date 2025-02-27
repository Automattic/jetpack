/**
 * External dependencies
 */
import { JetpackFooter } from '@automattic/jetpack-components';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { Modal, Button, __experimentalVStack as VStack } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { config } from '../..';
import { STORE_NAME } from '../../state';
import CSVExport from './csv';
import GoogleDriveExport from './google-drive';

import './style.scss';

const ExportResponses = () => {
	const [ showExportModal, setShowExportModal ] = useState( false );
	const userCanExport = useSelect(
		select => select( coreStore ).canUser( 'update', 'settings' ),
		[]
	);
	const { selected, currentQuery } = useSelect( select => {
		const { getSelectedResponsesFromCurrentDataset, getCurrentQuery } = select( STORE_NAME );
		return { selected: getSelectedResponsesFromCurrentDataset(), currentQuery: getCurrentQuery() };
	}, [] );
	const openModal = useCallback( () => setShowExportModal( true ), [ setShowExportModal ] );
	const closeModal = useCallback( () => setShowExportModal( false ), [ setShowExportModal ] );
	const exportResponses = useCallback(
		( action, nonceName ) => {
			const data = new FormData();
			data.append( 'action', action );
			data.append( nonceName, config( 'exportNonce' ) );
			selected.forEach( id => data.append( 'selected[]', id ) );
			data.append( 'post', currentQuery.parent || 'all' );
			data.append( 'search', currentQuery.search || '' );
			data.append( 'status', currentQuery.status );
			if ( currentQuery.before && currentQuery.after ) {
				data.append( 'before', currentQuery.before );
				data.append( 'after', currentQuery.after );
			}
			return fetch( window.ajaxurl, { method: 'POST', body: data } );
		},
		[ currentQuery, selected ]
	);
	if ( ! userCanExport ) {
		return null;
	}
	return (
		<>
			<Button className="export-button" variant="primary" onClick={ openModal }>
				{ selected?.length
					? __( 'Export selected', 'jetpack-forms' )
					: __( 'Export', 'jetpack-forms' ) }
			</Button>
			{ showExportModal && (
				<Modal
					title={ __( 'Export your Form Responses', 'jetpack-forms' ) }
					onRequestClose={ closeModal }
					size="large"
				>
					<VStack spacing={ 8 }>
						<p className="jp-forms__export-modal-header-subtitle">
							{ __( 'Choose your favorite file format or export destination:', 'jetpack-forms' ) }
						</p>
						<CSVExport onExport={ exportResponses } />
						<GoogleDriveExport onExport={ exportResponses } />
						<JetpackFooter
							className="jp-forms__export-modal-footer"
							moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
						/>
					</VStack>
				</Modal>
			) }
		</>
	);
};

export default ExportResponses;
