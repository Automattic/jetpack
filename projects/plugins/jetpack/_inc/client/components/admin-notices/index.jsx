import React from 'react';

class AdminNotices extends React.Component {
	componentDidMount() {
		const $adminNotices = jQuery( this.refs.adminNotices );
		const dismiss =
			'<span role="button" tabindex="0" class="dops-notice__dismiss"><svg class="gridicon gridicons-cross" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg><span class="screen-reader-text"/></span>';

		const $vpDeactivationNotice = jQuery( '.vp-deactivated' );
		if ( $vpDeactivationNotice.length > 0 ) {
			$vpDeactivationNotice.each( function () {
				const $notice = jQuery( this )
					.addClass( 'dops-notice is-success is-dismissable' )
					.removeClass( 'wrap vp-notice notice notice-success' );
				const icon =
					'<span class="dops-notice__icon-wrapper"><svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 19.414l-6.707-6.707 1.414-1.414L9 16.586 20.293 5.293l1.414 1.414"/></svg></span>';
				$notice.wrapInner( '<span class="dops-notice__content">' );
				$notice.find( '.dops-notice__content' ).before( icon ).css( 'display', 'block' );
				$notice.find( '.dops-notice__content' ).after( dismiss );
				$notice.find( 'h2' ).replaceWith( function () {
					return jQuery( '<strong />', { html: this.innerHTML } );
				} );
				$notice.find( 'p' ).replaceWith( function () {
					return jQuery( '<div/>', { html: this.innerHTML } );
				} );
				$notice.prependTo( $adminNotices ).css( 'display', 'flex' );
			} );
		}

		const $vpNotice = jQuery( '.vp-notice' );
		if ( $vpNotice.length > 0 ) {
			$vpNotice.each( function () {
				const $notice = jQuery( this );
				// If the notice doesn't have an icon, it's one of the old VP notices.
				if ( 0 === $notice.find( '.dops-notice__icon' ).length ) {
					const $success = $notice.hasClass( 'vp-registered' );
					const $warningOrSuccess = $success ? 'is-success' : 'is-error';
					$notice.addClass( 'dops-notice vp-notice-jp ' + $warningOrSuccess );
					$notice.wrapInner( '<span class="dops-notice__content">' );
					const icon = $success
						? '<span class="dops-notice__icon-wrapper"><svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 19.414l-6.707-6.707 1.414-1.414L9 16.586 20.293 5.293l1.414 1.414"/></svg></span>'
						: '<span class="dops-notice__icon-wrapper"><svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"/></svg></span>';
					$notice.find( '.dops-notice__content' ).before( icon );
					$notice.find( '.vp-message' ).removeClass( 'vp-message' ).addClass( 'dops-notice__text' );
					$notice.find( 'h3' ).replaceWith( function () {
						return jQuery( '<strong />', { html: this.innerHTML } );
					} );
					$notice.find( 'p' ).replaceWith( function () {
						return jQuery( '<div/>', { html: this.innerHTML } );
					} );
					$notice.css( 'display', 'flex' );
				}
				$notice.find( 'a[href*="admin.php?page=vaultpress"]' ).remove();
				$notice.prependTo( $adminNotices ).removeClass( 'wrap vp-notice' );
			} );
		}

		const $wcNotice = jQuery( '.woocommerce-message' );
		if ( $wcNotice.length > 0 ) {
			$wcNotice.each( function () {
				const $notice = jQuery( this )
					.addClass( 'dops-notice' )
					.removeClass( 'updated wc-connect' );
				$notice
					.find( '.button-primary' )
					.addClass( 'dops-notice__action' )
					.removeClass( 'button-primary' )
					.detach()
					.appendTo( $notice );
				$notice.find( 'p' ).not( '.submit' ).wrapAll( '<span class="dops-notice__text"/>' );
				const $dopsNotice = $notice.find( '.dops-notice__text' );
				$dopsNotice.find( 'p' ).replaceWith( function () {
					return jQuery( '<div/>', { html: this.innerHTML, class: 'dops-notice__moved_text' } );
				} );
				$dopsNotice.find( 'br' ).remove();
				$notice
					.find( '.button-secondary' )
					.removeClass( 'button-secondary' )
					.detach()
					.appendTo( $dopsNotice );
				$notice.find( '.submit' ).remove();
				$notice
					.find( '.woocommerce-message-close' )
					.removeClass( 'woocommerce-message-close notice-dismiss' )
					.addClass( 'dops-notice__action' );
				$notice
					.wrapInner( '<span class="dops-notice__content">' )
					.prependTo( $adminNotices )
					.css( 'display', 'flex' );
				$notice
					.find( '.dops-notice__action' )
					.not( ':first' )
					.removeClass( 'dops-notice__action' )
					.detach()
					.appendTo( $notice.find( '.dops-notice__text' ) );
				$notice.find( '.dops-notice__action:first' ).detach().appendTo( $notice );
			} );
		}

		// Hide the rest of the core notices, they don't look very good above the react app.
		const $allNotices = jQuery( '.notice' );
		if ( $allNotices.length > 0 ) {
			$allNotices.each( function () {
				const $notice = jQuery( this );
				$notice.hide();
			} );
		}

		if ( $adminNotices.length > 0 ) {
			jQuery( '.dops-notice__dismiss' ).on( 'click', function () {
				jQuery( this ).parent().closest( 'div' ).hide();
			} );
		}
	}

	render() {
		return <div id="jp-admin-notices" ref="adminNotices" aria-live="polite" />;
	}
}

export default AdminNotices;
