/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import { Button } from '@wordpress/components';
import getJetpackData from '../../get-jetpack-data';

// copy / paste from calypso
const getScreenCenterSpecs = ( width, height ) => {
	let screenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : window.screenY,
		screenLeft = typeof window.screenLeft !== 'undefined' ? window.screenLeft : window.screenX;

	return [
		'width=' + width,
		'height=' + height,
		'top=' + ( screenTop + window.innerHeight / 2 - height / 2 ),
		'left=' + ( screenLeft + window.innerWidth / 2 - width / 2 ),
	].join();
};

export const Connection = ( { onClick } ) => {
	return <Button onClick={ onClick }>{ __( 'Connect', 'jetpack' ) }</Button>;
};

export default compose( [
	withSelect( ( select, { connectUrl, serviceSlug, instanceId } ) => {
		const createDriveConnection = async ( keyring_id, instance_id ) => {
			try {
				const sheetsResponse = await apiFetch( {
					path: '/wpcom/v2/external-connections/google-sheets',
					method: 'POST',
					data: { keyring_id, instance_id },
				} );

				console.log( sheetsResponse );
			} catch {}
		};

		const onClick = () => {
			void analytics.tracks.recordEvent( 'jetpack_editor_connection_click', {
				serviceSlug,
			} );

			window.open(
				connectUrl,
				'_blank',
				'toolbar=0,location=0,menubar=0,' + getScreenCenterSpecs( 700, 700 )
			);

			// opener:
			window.onmessage = function( { data } ) {
				if ( data.keyring_id ) {
					createDriveConnection( data.keyring_id, instanceId );
				}
			};
		};

		return {
			onClick,
		};
	} ),
] )( Connection );
