import { sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { getExternalLibrary } from '../../shared';

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

	const handleSelect = media => {
		if ( ! media || media.length === 0 ) {
			return;
		}

		showNotice(
			sprintf(
				/* translators: %d is the number of the media file */
				_n(
					'%d media file imported successfully.',
					'%d media files imported successfully.',
					media.length,
					'jetpack-external-media'
				),
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

	return <ExternalLibrary multiple onSelect={ handleSelect } onClose={ closeLibrary } />;
};

const container = document.getElementById( JETPACK_EXTERNAL_MEDIA_IMPORT_PAGE_MODAL );
if ( container ) {
	const root = ReactDOM.createRoot( container );
	root.render( <JetpackExternalMediaImport /> );
}
