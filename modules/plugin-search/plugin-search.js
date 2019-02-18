
( function( $, jpsh ) {
	const $pluginFilter = $( '#plugin-filter' );

	$pluginFilter.on( 'click', 'button#plugin-select-activate', function( event ) {
		event.preventDefault();
		ajaxActivateModule( $( this ).data( 'module' ) );
	} );

	const replaceCardBottom = function() {
		document
			.querySelector( '.plugin-card-jetpack-plugin-search' )
			.querySelector( '.plugin-card-bottom' )
			.outerHTML =
			`<div class="jetpack-plugin-search__bottom">
				<img src="${ jpsh.logo }" width="32" />
				<p>${ jpsh.legend }</p>
				<a href="#" className="jetpack-plugin-search__dismiss">${ jpsh.hideText }</a>
			</div>`;
	};

	// Listen for new results
	const resultsObserver = new MutationObserver( function( mutationsList ) {
		for ( const mutation of mutationsList ) {
			if (
				'childList' === mutation.type &&
				1 === document.querySelectorAll( '.plugin-card-jetpack-plugin-search' ).length
			) {
				replaceCardBottom();
			}
		}
	} );

	resultsObserver.observe( document.getElementById( 'plugin-filter' ), { childList: true } );

	function ajaxActivateModule( moduleName ) {
		const body = {};
		const $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
		body[ moduleName ] = true;
		$moduleBtn.toggleClass( 'install-now updating-message' );
		$moduleBtn.prop( 'disabled', true );
		$moduleBtn.text( jpsh.activatingString );
		$.ajax( {
			url: jpsh.rest_url,
			method: 'post',
			beforeSend: function( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', jpsh.nonce );
			},
			data: window.JSON.stringify( body ),
			contentType: 'application/json',
			dataType: 'json'
		} ).done( function() {
			updateButton();
		} ).error( function() {
			$moduleBtn.toggleClass( 'install-now updating-message' );
		} );
	}

	// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
	function updateButton() {
		const $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
		const configure_url = $moduleBtn.data( 'configure-url' );
		$moduleBtn.prop( 'onclick', null ).off( 'click' );
		$moduleBtn.toggleClass( 'install-now updating-message' );
		$moduleBtn.text( jpsh.activatedString );
		setTimeout( function() {
			$moduleBtn.replaceWith( '<a id="plugin-select-settings" class="button" href="' + configure_url + '">' + jpsh.manageSettingsString + '</a>' );
		}, 1000 );
	}
} )( jQuery, window.jetpackPluginSearch );
