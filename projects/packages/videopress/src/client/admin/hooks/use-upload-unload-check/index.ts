/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import useVideos from '../use-videos';

const useUploadUnloadCheck = () => {
	const { isUploading } = useVideos();

	useEffect( () => {
		if ( ! isUploading ) {
			return;
		}

		const beforeUnloadListener = event => {
			event.preventDefault();
			// Note: The message only shows on older browsers, with a standard non-customizable message on current browsers
			// ref https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#compatibility_notes
			event.returnValue = __(
				'Leaving will cancel the upload. Are you sure you want to exit?',
				'jetpack-videopress-pkg'
			);
			return;
		};

		window.addEventListener( 'beforeunload', beforeUnloadListener );

		return () => {
			window.removeEventListener( 'beforeunload', beforeUnloadListener );
		};
	}, [ isUploading ] );
};

export default useUploadUnloadCheck;
