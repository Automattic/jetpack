/**
 * External dependencies
 */
import React from 'react';

const AdminNotices = React.createClass( {
	componentDidMount() {
		const $adminNotices = jQuery( this.refs.adminNotices );

		let $vpNotice = jQuery( '.vp-notice' );
		if ( $vpNotice.length > 0 ) {
			$vpNotice.each( function () {
				let $notice = jQuery( this ).addClass( 'dops-notice is-warning' ).removeClass( 'wrap vp-notice' );
				$notice.wrapInner( '<div class="dops-notice__content">' );
				$notice.find( 'a' ).addClass( 'dops-notice__action' ).appendTo( $notice );
				$notice.find( '.vp-message' ).removeClass( 'vp-message' ).addClass( 'dops-notice__text' );
				$notice.find( 'h3' ).replaceWith( function () { return jQuery( '<strong />', { html: this.innerHTML } ); } );
				$notice.find( 'p' ).replaceWith( function () { return jQuery( '<div/>', { html: this.innerHTML } ); } );
				$notice.prependTo( $adminNotices ).show();
			} );
		}

		let $wcNotice = jQuery( '.woocommerce-message' );
		if ( $wcNotice.length > 0 ) {
			$wcNotice.each( function () {
				let $notice = jQuery( this ).addClass( 'dops-notice is-basic' ).removeClass( 'updated wc-connect' );
				$notice.find( '.button-primary' ).addClass( 'dops-notice__action' ).removeClass( 'button-primary' ).detach().appendTo( $notice );
				$notice.find( 'p' ).not( '.submit' ).wrapAll( '<div class="dops-notice__text"/>' );
				let $dopsNotice = $notice.find( '.dops-notice__text' );
				$dopsNotice.find( 'p' ).replaceWith( function () { return jQuery( '<div/>', { html: this.innerHTML, class: 'dops-notice__moved_text' } ); } );
				$dopsNotice.find( 'br' ).remove();
				$notice.find( '.button-secondary' ).removeClass( 'button-secondary' ).detach().appendTo( $dopsNotice );
				$notice.find( '.submit' ).remove();
				$notice.find( '.woocommerce-message-close' ).removeClass( 'woocommerce-message-close' ).addClass( 'dops-notice__action' );
				$notice.prependTo( $adminNotices ).wrapInner( '<div class="dops-notice__content">' ).show();
				$notice.find( '.dops-notice__action' ).not( ':first' ).removeClass( 'dops-notice__action' ).detach().appendTo( $notice.find( '.dops-notice__text' ) );
			} );
		}
	},

	render() {
		return ( <div ref="adminNotices" aria-live="polite"></div> )
	}
} );

export default AdminNotices;
