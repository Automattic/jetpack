import apiFetch from '@wordpress/api-fetch';
import './replace-site-visibility.scss';

const { siteId = 0 } = typeof window === 'object' ? window.JETPACK_MU_WPCOM_MEDIA_URL_UPLOAD : {};

const replaceSiteVisibility = () => {
	apiFetch( {
		path: `/wpcom/v2/sites/${ siteId }/preview-links`,
	} ).then( value => console.log( value ) ); // eslint-disable-line no-console
};

document.addEventListener( 'DOMContentLoaded', function () {
	replaceSiteVisibility();
} );
