import { sprintf, __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { getExternalLibrary, getExternalSource } from '../../shared';

const JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_CONTAINER = 'jetpack-external-media-import';
const JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_MODAL = 'jetpack-external-media-import-modal';

const JetpackExternalMediaImport = () => {
	const [ selectedSource, setSelectedSource ] = useState( null );
	const ExternalLibrary = getExternalLibrary( selectedSource );

	const showNotice = message => {
		const notice = document.createElement( 'div' );
		notice.className = 'notice notice-success';
		notice.innerHTML = `<p>${ message }</p>`;

		// Add the success notice after the page title
		const heading = document.querySelector(
			`#${ JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_CONTAINER } > h1`
		);
		if ( heading ) {
			heading.parentNode.insertBefore( notice, heading.nextSibling );
		}
	};

	const selectButtonText = ( selectedImages, isCopying ) => {
		if ( isCopying ) {
			return sprintf(
				/* translators: %1$d is the number of media that were selected. */
				__( 'Importing… %1$d media', 'jetpack-external-media' ),
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

		showNotice(
			sprintf(
				/* translators: %d is the number of the media */
				__( '%d media imported successfully.', 'jetpack-external-media' ),
				media.length
			)
		);
	};

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
	}, [] );

	if ( ! ExternalLibrary ) {
		return null;
	}

	return (
		<ExternalLibrary
			externalSource={ getExternalSource( selectedSource ) }
			multiple
			isImport
			selectButtonText={ selectButtonText }
			onSelect={ handleSelect }
			onClose={ closeLibrary }
		/>
	);
};

const container = document.getElementById( JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_MODAL );
if ( container ) {
	const root = ReactDOM.createRoot( container );
	root.render( <JetpackExternalMediaImport /> );
}
