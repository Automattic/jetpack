import { JetpackFooter } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { forEach } from 'lodash';
import { config } from '../../';
import { STORE_NAME } from '../../state';
import CSVExport from './csv';
import GoogleDriveExport from './google-drive';

import './style.scss';

const ExportModal = ( { isVisible, onClose } ) => {
	const backdrop = useRef();

	const [ query, selected ] = useSelect(
		select => [
			select( STORE_NAME ).getResponsesQuery(),
			select( STORE_NAME ).getSelectedResponseIds(),
		],
		[]
	);

	useEffect( () => {
		backdrop.current?.addEventListener( 'click', event => {
			if ( event.target !== backdrop.current ) {
				return;
			}

			onClose();
		} );
	}, [ isVisible, onClose ] );

	const exportResponses = useCallback(
		( action, nonceName ) => {
			const data = new FormData();

			data.append( 'action', action );
			data.append( nonceName, config( 'exportNonce' ) );

			forEach( selected, id => data.append( 'selected[]', id ) );

			data.append( 'date', '' );
			data.append( 'post', 'all' );
			data.append( 'search', query.search || '' );
			data.append( 'status', query.status );

			return fetch( window.ajaxurl, { method: 'POST', body: data } );
		},
		[ query, selected ]
	);

	if ( ! isVisible ) {
		return null;
	}

	return (
		<div ref={ backdrop } className="jp-forms__export-modal">
			<div className="jp-forms__export-modal-wrapper">
				<div className="jp-forms__export-modal-header">
					<h1 className="jp-forms__export-modal-header-title">
						{ __( 'Export your Form Responses', 'jetpack-forms' ) }
					</h1>
					<p className="jp-forms__export-modal-header-subtitle">
						{ __( 'Choose your favorite file format or export destination:', 'jetpack-forms' ) }
					</p>
				</div>
				<div className="jp-forms__export-modal-content">
					<CSVExport onExport={ exportResponses } />
					<GoogleDriveExport onExport={ exportResponses } />
				</div>

				<JetpackFooter
					className="jp-forms__export-modal-footer"
					moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
				/>
			</div>
		</div>
	);
};

export default ExportModal;
