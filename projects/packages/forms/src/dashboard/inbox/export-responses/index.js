/**
 * External dependencies
 */
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { Modal, Button, __experimentalVStack as VStack } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { config } from '../..';
import { store as dashboardStore } from '../../store';
import CSVExport from './csv';
import GoogleDriveExport from './google-drive';

import './style.scss';

const ExportResponsesButton = () => {
	const [ showExportModal, setShowExportModal ] = useState( false );
	const userCanExport = useSelect(
		select => select( coreStore ).canUser( 'update', 'settings' ),
		[]
	);
	const { selected, currentQuery } = useSelect( select => {
		const { getSelectedResponsesFromCurrentDataset, getCurrentQuery } = select( dashboardStore );
		return { selected: getSelectedResponsesFromCurrentDataset(), currentQuery: getCurrentQuery() };
	}, [] );
	const openModal = useCallback( () => setShowExportModal( true ), [ setShowExportModal ] );
	const closeModal = useCallback( () => setShowExportModal( false ), [ setShowExportModal ] );
	const [ autoConnectGdrive, setAutoConnectGdrive ] = useState( false );
	const onExport = useCallback(
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

	useEffect( () => {
		const url = new URL( window.location.href );

		if ( url.searchParams.get( 'connect-gdrive' ) === 'true' ) {
			setAutoConnectGdrive( true );
			openModal();
			// Update the URL to remove the query param
			url.searchParams.delete( 'connect-gdrive' );
			window.history.replaceState( {}, '', url );
		}
	}, [ openModal ] );

	if ( ! userCanExport ) {
		return null;
	}

	return (
		<>
			<Button className="export-button" variant="primary" onClick={ openModal }>
				{ __( 'Export', 'jetpack-forms' ) }
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
						<CSVExport onExport={ onExport } />
						<GoogleDriveExport onExport={ onExport } autoConnect={ autoConnectGdrive } />
					</VStack>
				</Modal>
			) }
		</>
	);
};

export default ExportResponsesButton;
