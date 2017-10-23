(function( wp, $, api ){

	/**
	 * Add some labels that the default checkbox controls don't allow.
	 * Add CSS Revisions and CSS Help links.
	 */
	function addLabels() {
		addTitle( 'jetpack_css_mode_control', window._jp_css_settings.l10n.mode );
		addTitle( 'jetpack_mobile_css_control', window._jp_css_settings.l10n.mobile );
		addDesc( 'wpcom_custom_css_content_width_control', window._jp_css_settings.l10n.contentWidth );
		var widthControl = _getControl( 'wpcom_custom_css_content_width_control' );
		if ( widthControl ) {
			widthControl.find( 'input' ).after( '<span>px</span>' );
		}

		$( '<a />', {
			id: 'help-link',
			target: '_blank',
			href: window._jp_css_settings.cssHelpUrl,
			text: window._jp_css_settings.l10n.css_help_title
		}).prependTo( '#css-help-links' );

		// Only show the revisions link if there are revisions
		if ( window._jp_css_settings.areThereCssRevisions ) {
			$( '<a />', {
				id: 'revisions-link',
				target: '_blank',
				href: window._jp_css_settings.revisionsUrl,
				text: window._jp_css_settings.l10n.revisions
			}).prependTo( '#css-help-links' );
		}
	}

	/**
	 * Add a title to a control
	 * @param {string} controlId Control ID
	 * @param {string} title     A title to add
	 */
	function addTitle( controlId, title ) {
		var control = _getControl( controlId );
		if ( control ) {
			control.prepend( '<span class="customize-control-title">' + title + '<span>' );
		}
	}

	/**
	 * Add a description to a control
	 * @param {string} controlId Control ID
	 * @param {string} desc      A description to add
	 */
	function addDesc( controlId, desc ) {
		var control = _getControl( controlId );
		if ( control ) {
			control.append( '<span class="description">' + desc + '<span>' );
		}
	}

	/**
	 * Helper function to qet a control by ID
	 * @param  {string} controlId Control ID
	 * @return {object}           jQuery object of the container
	 */
	function _getControl ( controlId ) {
		var control = api.control.value( controlId );
		if ( control ) {
			return control.container;
		}
		return null;
	}

	$('#customize-controls').on( 'change', '#_customize-input-jetpack_css_preprocessors_control', function(){
		var preprocessor_modes = {
				default : 'text/css',
				less    : 'text/x-less',
				sass    : 'text/x-scss'
			},
			curr = $(this).val(),
			new_mode = 'text/css';

		if ( 'undefined' !== typeof preprocessor_modes[ curr ] ) {
			new_mode = preprocessor_modes[ curr ];
		}

		api.control( 'custom_css' ).deferred.codemirror.done( function( cm ) {
			cm.setOption( 'mode', new_mode );
			if ( 'text/css' === new_mode ) {
				cm.setOption( 'lint', true );
				cm.setOption( 'gutters', [ 'CodeMirror-lint-markers' ] );
			} else {
				cm.setOption( 'lint', false );
				cm.setOption( 'gutters', [] );
			}
		} );
	});

	$(document).ready( function(){
		addLabels();
	});

})( this.wp, jQuery, this.wp.customize );
