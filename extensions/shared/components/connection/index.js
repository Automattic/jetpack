/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import { Button } from '@wordpress/components';
import getJetpackData from '../../get-jetpack-data';

export const Connection = ( { onClick } ) => {
	return <Button onClick={ onClick }>{ __( 'Connect', 'jetpack' ) }</Button>;
};

export default compose( [
	withSelect( ( select, { serviceSlug } ) => {
		const onClick = () => {
			void analytics.tracks.recordEvent( 'jetpack_editor_connection_click', {
				serviceSlug,
			} );

			const data = getJetpackData();
			const service = data.externalServices[ serviceSlug ]
				? data.externalServices[ serviceSlug ]
				: null;
			if ( ! service ) {
				alert( __( "Sorry couldn't find a service called " + serviceSlug, 'jetpack' ) );
				return;
			}

			window.open( service.connect_URL, '_blank', 'toolbar=0,location=0,menubar=0' );
		};

		return {
			onClick,
		};
	} ),
] )( Connection );
