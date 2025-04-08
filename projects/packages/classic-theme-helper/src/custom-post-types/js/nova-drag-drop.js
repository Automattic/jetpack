/* eslint-disable no-undef */
/* global _novaDragDrop */

( function ( $ ) {
	let list;

	/**
	 * Initialize the drag and drop functionality.
	 */
	function init() {
		list = $( '#the-list' );
		dragMenus();
		addNonce();
		addSubmitButton();
		changeToPost();
	}

	/**
	 * Allow the menu items to be dragged.
	 */
	function dragMenus() {
		list.sortable( {
			cancel: '.no-items, .inline-edit-row',
			stop: function ( event, ui ) {
				if ( ui.item.is( ':first-child' ) ) {
					return list.sortable( 'cancel' );
				}
				//
				reOrder();
			},
		} );
	}

	/**
	 * Allow the menu items to be reordered.
	 */
	function reOrder() {
		list.find( '.menu-label-row' ).each( function () {
			const term_id = $( this ).data( 'term_id' );
			$( this )
				.nextUntil( '.menu-label-row' )
				.each( function ( i ) {
					const row = $( this );
					row.find( '.menu-order-value' ).val( i );
					row.find( '.nova-menu-term' ).val( term_id );
				} );
		} );
	}

	/**
	 * Ensure the submit button is added to the page.
	 */
	function addSubmitButton() {
		$( '.tablenav' ).prepend(
			'<input type="submit" class="button-primary button-reorder alignright" value="' +
				_novaDragDrop.reorder +
				'" name="' +
				_novaDragDrop.reorderName +
				'" />'
		);
	}

	/**
	 * Add the nonce to the form.
	 */
	function addNonce() {
		$( '#posts-filter' ).append(
			'<input type="hidden" name="' +
				_novaDragDrop.nonceName +
				'" value="' +
				_novaDragDrop.nonce +
				'" />'
		);
	}

	/**
	 * Change the form method to POST.
	 */
	function changeToPost() {
		$( '#posts-filter' ).attr( 'method', 'post' );
	}

	// do it
	$( document ).ready( init );
} )( jQuery );
