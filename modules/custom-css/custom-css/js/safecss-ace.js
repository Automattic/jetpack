(function(global, $){
	// shared scope insied IIFE in case it's needed.
	var editor;

	var syncCSS = function () {
		$( "#safecss" ).val( editor.getSession().getValue() );
	};

	var loadAce = function() {
		// Set up ACE editor
		ace.config.set( 'modePath', safecssAceSrcPath );
		ace.config.set( 'workerPath', safecssAceSrcPath );
		ace.config.set( 'themePath', safecssAceSrcPath );

		editor = ace.edit( 'safecss-ace' );
		// Globalize it so we can access it other places
		global.safecss_editor = editor;
		// Word-wrap, othewise the initial comments are borked.
		editor.getSession().setUseWrapMode(true);
		// This adds an annoying vertical line to the editor; get rid of it.
		editor.setShowPrintMargin( false );
		// Grab straight from the textarea
		editor.getSession().setValue( $("#safecss").val() );
		// kill the spinner
		jQuery.fn.spin && $("#safecss-container").spin( false );

		var preprocessorField = $( '#custom_css_preprocessor' );
		function setCSSMode( preprocessor ) {
			switch ( preprocessor ) {
				case 'less':
					var mode = ace.require( 'ace/mode/less' ).Mode;
				break;
				case 'sass':
					var mode = ace.require( 'ace/mode/scss' ).Mode;
				break;
				default:
					var mode = ace.require( 'ace/mode/css' ).Mode;
				break;
			}

			editor.getSession().setMode( new mode() );
		}

		setCSSMode( preprocessorField.val() );
		preprocessorField.on( 'change', function () {
			setCSSMode( $( this ).val() );
		} );

		// When submitting, make sure to include the updated CSS
		// The Ace editor unfortunately doesn't handle this for us
		$( '#safecssform' ).submit(syncCSS);
	}

	// exit if we're on IE <= 7
	if ( ( $.browser.msie && parseInt( $.browser.version, 10 ) <= 7 ) || navigator.userAgent.match(/iPad/i) != null ) {
		$("#safecss-container").hide();
		$("#safecss").removeClass('hide-if-js');
		return false;
	}
	// syntaxy goodness.
	else {
		$( '#safecss-ace, #safecss-container' ).css( 'height', 
			Math.max( 250, $( window ).height() - $( '#safecss-container' ).offset().top - $( '#wpadminbar' ).height() )
		);

		$(global).load(loadAce);
	}

	$( '#preview' ).on( 'click', syncCSS );
})(this, jQuery);