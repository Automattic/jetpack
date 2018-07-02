/* global jetpackSimplePaymentsWidget */
/* eslint no-var: 0, no-console: 0 */

( function( $ ) {
	var products = jetpackSimplePaymentsWidget.products;
	var strings = jetpackSimplePaymentsWidget.strings;
	var $widgetsArea = $( '#widgets-right' );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-add-product', function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		showForm( $widget );
	} );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-edit-product', function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		showForm( $widget );
	} );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-cancel-form', function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		hideForm( $widget );
	} );

	function getWidgetContainer( element ) {
		return element.closest( '.jetpack-simple-payments-widget-container' );
	}

	function showForm( $widget ) {
		$( '.jetpack-simple-payments-widget-form', $widget ).show();
	}

	function hideForm( $widget ) {
		$( '.jetpack-simple-payments-widget-form', $widget ).hide();
	}
}( jQuery ) );
