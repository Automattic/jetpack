/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import fetch from 'unfetch';
import { __ } from '@wordpress/i18n';

function fetchSyncProgress( { apiRoot, apiNonce } ) {
	return callback =>
		fetch( `${ apiRoot }jetpack/v4/sync-progress`, {
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': apiNonce },
		} )
			.then( response => response.json() )
			.then( ( { data: syncProgress } ) => callback( syncProgress ) );
}

const CustomizeApp = ( { apiRoot, apiNonce } ) => {
	const [ syncProgress, setSyncProgress ] = useState( null );
	useEffect( () => {
		const intervalId = window.setInterval( () => {
			fetchSyncProgress( { apiRoot, apiNonce } )( setSyncProgress );
		}, 30000 );
		return () => clearInterval( intervalId );
	}, [ apiRoot, apiNonce ] );

	return createPortal(
		syncProgress !== 1000 && (
			<div
				className="jetpack-instant-search-customizer__portaled-wrapper"
				style={ { margin: '1em 0' } } // NOTE: Customize app doesn't have a style build step
			>
				{ __( 'Your site is currently being indexed for search…', 'jetpack' ) }
			</div>
		),
		document.querySelector(
			'#sub-accordion-section-jetpack_search>.customize-section-description-container'
		)
	);
};
export default CustomizeApp;
