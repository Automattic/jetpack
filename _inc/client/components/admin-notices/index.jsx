/**
 * External dependencies
 */
import React from 'react';

const AdminNotices = React.createClass( {
	componentDidMount() {
		const $adminNotices = jQuery( this.refs.adminNotices );

		const $vpNotice = jQuery( '.vp-notice' );
		if ( $vpNotice.length > 0 ) {
			$vpNotice.each( function() {
				let $notice = jQuery( this ).addClass( 'dops-notice is-warning vp-notice-jp' ).removeClass( 'wrap vp-notice' );
				const icon = '<svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path></g></svg>';
				$notice.wrapInner( '<span class="dops-notice__content">' );
				$notice.find( '.dops-notice__content' ).before( icon );
				$notice.find( '.vp-message' ).removeClass( 'vp-message' ).addClass( 'dops-notice__text' );
				$notice.find( 'h3' ).replaceWith( function() { return jQuery( '<strong />', { html: this.innerHTML } ); } );
				$notice.find( 'p' ).replaceWith( function() { return jQuery( '<div/>', { html: this.innerHTML } ); } );
				$notice.find( 'a[href*="admin.php?page=vaultpress"]' ).remove();
				$notice.prependTo( $adminNotices ).css( 'display', 'flex' );
			} );
		}

		const $wcNotice = jQuery( '.woocommerce-message' );
		if ( $wcNotice.length > 0 ) {
			$wcNotice.each( function() {
				const $notice = jQuery( this ).addClass( 'dops-notice' ).removeClass( 'updated wc-connect' );
				$notice.find( '.button-primary' ).addClass( 'dops-notice__action' ).removeClass( 'button-primary' ).detach().appendTo( $notice );
				$notice.find( 'p' ).not( '.submit' ).wrapAll( '<span class="dops-notice__text"/>' );
				const $dopsNotice = $notice.find( '.dops-notice__text' );
				$dopsNotice.find( 'p' ).replaceWith( function() { return jQuery( '<div/>', { html: this.innerHTML, class: 'dops-notice__moved_text' } ); } );
				$dopsNotice.find( 'br' ).remove();
				$notice.find( '.button-secondary' ).removeClass( 'button-secondary' ).detach().appendTo( $dopsNotice );
				$notice.find( '.submit' ).remove();
				$notice.find( '.woocommerce-message-close' ).removeClass( 'woocommerce-message-close notice-dismiss' ).addClass( 'dops-notice__action' );
				$notice.wrapInner( '<span class="dops-notice__content">' ).prependTo( $adminNotices ).css( 'display', 'flex' );
				$notice.find( '.dops-notice__action' ).not( ':first' ).removeClass( 'dops-notice__action' ).detach().appendTo( $notice.find( '.dops-notice__text' ) );
				$notice.find( '.dops-notice__action:first' ).detach().appendTo( $notice );
			} );
		}
	},

	render() {
		return ( <div ref="adminNotices" aria-live="polite"></div> );
	}
} );

export default AdminNotices;
