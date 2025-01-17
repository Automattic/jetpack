import {
	GooglePhotosMedia,
	OpenverseMedia,
	PexelsMedia,
} from '@automattic/jetpack-shared-extension-utils';
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const getExternalLibrary = slug => {
	switch ( slug ) {
		case 'google_photos':
			return GooglePhotosMedia;
		case 'openverse':
			return OpenverseMedia;
		case 'pexels':
			return PexelsMedia;
		default:
			return null;
	}
};

const WpcomExternalMediaImport = () => {
	const [ selectedSource, setSelectedSource ] = useState( null );
	const ExternalLibrary = getExternalLibrary( selectedSource );

	const handleSelect = media => {
		console.log( media ); // eslint-disable-line no-console
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
		const element = document.getElementById( 'wpcom-external-media-import' );
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

	return <ExternalLibrary onSelect={ handleSelect } onClose={ closeLibrary } />;
};

const container = document.getElementById( 'wpcom-external-media-import-modal' );
if ( container ) {
	const root = ReactDOM.createRoot( container );
	root.render( <WpcomExternalMediaImport /> );
}
