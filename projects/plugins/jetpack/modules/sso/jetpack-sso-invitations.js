/* global jetpack_sso_wpcom_invitations */
jQuery( document ).ready( function ( $ ) {
	// $nonce = $( '#jetpack-sso-invite-nonce' ).val();
	$( '.sso-disconnected-user' ).click( function ( e ) {
		const { nonce, ajax_url } = jetpack_sso_wpcom_invitations;
		var $this = $( this );
		var user_id = $this.attr( 'data-user-id' );
		$this.html( 'Inviting' );
		$this.prop( 'disabled', true );
		e.preventDefault();
		var data = { action: 'jetpack_invite_user_to_wpcom', user_id, 'ajax-nonce': nonce };
		$.post( ajax_url, data ).done( function () {
			window.location.reload();
		} );
	} );
} );
