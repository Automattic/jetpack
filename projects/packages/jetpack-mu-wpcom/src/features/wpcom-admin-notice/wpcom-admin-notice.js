import { wpcomTrackEvent } from '../../common/tracks';

const recordEvent = event => {
	if ( event ) {
		const { user } = window.wpcomAdminNotice;
		wpcomTrackEvent( event.name, event.props, user.ID, user.username );
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	const notice = document.getElementById( 'wpcom-admin-notice' );
	const data = window.wpcomAdminNotice;
	if ( ! notice || ! data ) {
		return;
	}

	recordEvent( data.tracks?.display );

	// Delegated: core adds the dismiss button after this runs.
	notice.addEventListener( 'click', event => {
		if ( event.target.closest( '.notice-dismiss' ) ) {
			const body = new FormData();
			body.append( 'action', 'wpcom_dismiss_sidebar_notice' );
			body.append( 'id', data.id );
			body.append( 'feature_class', data.featureClass );
			body.append( '_ajax_nonce', data.dismissNonce );
			fetch( window.ajaxurl, { method: 'POST', body } );

			recordEvent( data.tracks?.dismiss );
		} else if ( event.target.closest( 'a' ) ) {
			recordEvent( data.tracks?.click );
		}
	} );
} );
