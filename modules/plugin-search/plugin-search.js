/**
 * Handles the activation of a Jetpack feature, dismissing the card, and replacing the bottom row
 * of the card with customized content.
 */

/* global jetpackPluginSearch, JSON, console */

/**
 * Replace bottom row of the card to insert logo, text and link to dismiss the card.
 */
var replaceCardBottom = function() {
	var hint = document.querySelector( '.plugin-card-jetpack-plugin-search' );
	if ( 'object' === typeof hint && null !== hint ) {
		hint.querySelector( '.plugin-card-bottom' ).outerHTML =
			'<div class="jetpack-plugin-search__bottom"><img src="' + jetpackPluginSearch.logo + '" width="32" />' +
				'<p class="jetpack-plugin-search__text">' + jetpackPluginSearch.legend + '</p>' +
			'</div>';

		// Remove link and parent li from action links and move it to bottom row
		var dismissLink = document.querySelector( '.jetpack-plugin-search__dismiss' );
		dismissLink.parentNode.parentNode.removeChild( dismissLink.parentNode );
		document
			.querySelector( '.jetpack-plugin-search__bottom' )
			.appendChild( dismissLink );
	}
};

/**
 * Check if plugin card list nodes changed. If there's a Jetpack PSH card, replace the bottom row.
 * @param {array} mutationsList
 */
var replaceOnNewResults = function( mutationsList ) {
	mutationsList.forEach( function( mutation ) {
		if (
			'childList' === mutation.type &&
			1 === document.querySelectorAll( '.plugin-card-jetpack-plugin-search' ).length
		) {
			replaceCardBottom();
		}
	} );
};

// Listen for changes in plugin search results
var resultsObserver = new MutationObserver( replaceOnNewResults );
resultsObserver.observe( document.getElementById( 'plugin-filter' ), { childList: true } );

// Replace PSH bottom row on page load
document.addEventListener( 'DOMContentLoaded', replaceCardBottom );

( function( $, jpsh ) {

	var $pluginFilter = $( '#plugin-filter' );

	$pluginFilter.on( 'click', '.jetpack-plugin-search__dismiss', function( event ) {
		event.preventDefault();
		dismiss( $( this ).data( 'module' ) );
	} );

	$pluginFilter.on( 'click', 'button#plugin-select-activate', function( event ) {
		event.preventDefault();
		ajaxActivateModule( $( this ).data( 'module' ) );
	} );

	function dismiss( moduleName ) {
		document.getElementById( 'the-list' ).removeChild( document.querySelector( '.plugin-card-jetpack-plugin-search' ) );
		$.ajax( {
			url: jpsh.base_rest_url + '/hints',
			method: 'post',
			beforeSend: function( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', jpsh.nonce );
			},
			data: JSON.stringify( {
				hint: moduleName
			} ),
			contentType: 'application/json',
			dataType: 'json'
		} ).done( function() {
			//
		} ).error( function( data ) {
			console.warn( 'error', data );
		} );
	}

	function ajaxActivateModule( moduleName ) {
		var $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
		$moduleBtn.toggleClass( 'install-now updating-message' );
		$moduleBtn.prop( 'disabled', true );
		$moduleBtn.text( jpsh.activating );
		var data = {};
		data[ moduleName ] = true;
		$.ajax( {
			url: jpsh.base_rest_url + '/settings',
			method: 'post',
			beforeSend: function( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', jpsh.nonce );
			},
			data: JSON.stringify( data ),
			contentType: 'application/json',
			dataType: 'json'
		} ).done( function() {
			updateButton( moduleName );
		} ).error( function() {
			$moduleBtn.toggleClass( 'install-now updating-message' );
		} );
	}

	// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
	function updateButton( moduleName ) {
		$.ajax( {
			url: jpsh.base_rest_url + '/module/' + moduleName,
			method: 'get',
			beforeSend: function( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', jpsh.nonce );
			},
			dataType: 'json'
		} ).done( function( response ) {
			console.log( response );
			var $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
			$moduleBtn.prop( 'onclick', null ).off( 'click' );
			$moduleBtn.toggleClass( 'install-now updating-message' );
			$moduleBtn.text( jpsh.activated );
			setTimeout( function() {
				var url = 'https://jetpack.com/redirect/?source=plugin-hint-learn-' + moduleName,
					label = jpsh.getStarted;
				if ( response.options && 0 < response.options.length ) {
					url = $moduleBtn.data( 'configure-url' );
					label = jpsh.manageSettings;
				}
				$moduleBtn.replaceWith( '<a id="plugin-select-settings" class="button jetpack-plugin-search__primary" href="' + url + '">' + label + '</a>' );
			}, 1000 );

		} );

	}
} )( jQuery, jetpackPluginSearch );
