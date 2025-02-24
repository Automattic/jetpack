import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { sprintf, __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactDOM from 'react-dom/client';
import { getExternalLibrary, getExternalSource } from '../../shared';

const JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_CONTAINER = 'jetpack-external-media-import';
const JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_MODAL = 'jetpack-external-media-import-modal';
const JETPACK_EXTERNAL_MEDIA_IMPORT_NOTICE = 'jetpack-external-media-import-notice';

const Notice = ( { message, onDismiss } ) => (
	<div className="notice notice-success is-dismissible">
		<p>{ message }</p>
		<button type="button" className="notice-dismiss" onClick={ onDismiss }>
			<span className="screen-reader-text">
				{ __( 'Dismiss this notice.', 'jetpack-external-media' ) }
			</span>
		</button>
	</div>
);

const JetpackExternalMediaImport = () => {
	const [ selectedSource, setSelectedSource ] = useState( null );
	const [ noticeMessage, setNoticeMessage ] = useState( '' );
	const { tracks } = useAnalytics();
	const ExternalLibrary = getExternalLibrary( selectedSource );

	const selectButtonText = ( selectedImages, isCopying ) => {
		if ( isCopying ) {
			return sprintf(
				/* translators: %1$d is the number of media that were selected. */
				__( 'Importing %1$d media…', 'jetpack-external-media' ),
				selectedImages
			);
		}

		return selectedImages
			? sprintf(
					/* translators: %1$d is the number of media that were selected. */
					__( 'Import %1$d media', 'jetpack-external-media' ),
					selectedImages
			  )
			: __( 'Import media', 'jetpack-external-media' );
	};

	const handleSelect = media => {
		if ( ! media || media.length === 0 ) {
			return;
		}

		setNoticeMessage(
			sprintf(
				/* translators: %d is the number of the media */
				__( '%d media imported successfully.', 'jetpack-external-media' ),
				media.length
			)
		);
	};

	const handleDismissNotice = () => setNoticeMessage( '' );

	const closeLibrary = event => {
		if ( event ) {
			event.stopPropagation();

			// The DateTime picker is triggering a modal close when selected. We don't want this to close the modal
			if ( event.target.closest( '.jetpack-external-media-header__dropdown' ) ) {
				return;
			}
		}

		setSelectedSource( null );
	};

	useEffect( () => {
		const element = document.getElementById( JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_CONTAINER );
		const handleClick = event => {
			const slug = event.target.dataset.slug;
			if ( slug ) {
				setSelectedSource( slug );
				tracks.recordEvent( 'jetpack_external_media_import_media_page_import_click', {
					media_source: slug,
				} );
			}
		};

		if ( element ) {
			element.addEventListener( 'click', handleClick );
		}

		return () => {
			if ( element ) {
				element.removeEventListener( 'click', handleClick );
			}
		};
	}, [ tracks ] );

	return (
		<>
			{ ExternalLibrary && (
				<ExternalLibrary
					externalSource={ getExternalSource( selectedSource ) }
					multiple
					isImport
					selectButtonText={ selectButtonText }
					onSelect={ handleSelect }
					onClose={ closeLibrary }
				/>
			) }
			{ noticeMessage &&
				createPortal(
					<Notice message={ noticeMessage } onDismiss={ handleDismissNotice } />,
					document.getElementById( JETPACK_EXTERNAL_MEDIA_IMPORT_NOTICE )
				) }
		</>
	);
};

const container = document.getElementById( JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_MODAL );
if ( container ) {
	const root = ReactDOM.createRoot( container );
	root.render( <JetpackExternalMediaImport /> );
}
