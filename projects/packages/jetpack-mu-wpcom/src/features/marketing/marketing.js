/* global wpcomMarketing */

import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import wpcomRequest from 'wpcom-proxy-request';
import { wpcomTrackEvent } from '../../common/tracks';

const callbacks = {
	enableActivityPub: async e => {
		e.preventDefault();
		const defaultText = e.target.innerText;
		e.target.innerText = __( 'Joining…', 'jetpack-mu-wpcom' );
		e.target.classList.add( 'disabled' );

		const response = await wpcomRequest( {
			path: `/sites/${ wpcomMarketing.siteId }/activitypub/status`,
			apiNamespace: 'wpcom/v2',
			apiVersion: '2',
			body: {
				enabled: true,
			},
			method: 'POST',
		} );
		if ( response.enabled ) {
			window.location.href = e.target.href;
		} else {
			e.target.innerText = defaultText;
			e.target.classList.remove( 'disabled' );
		}
	},
};

domReady( () => {
	document.querySelectorAll( '.wpcom-marketing-tools-feature a' ).forEach( feature => {
		feature.addEventListener( 'click', e => {
			wpcomTrackEvent( e.target.dataset.event );
			if ( e.target.dataset.callback && e.target.dataset.callback in callbacks ) {
				callbacks[ e.target.dataset.callback ]( e );
			}
		} );
	} );
} );
