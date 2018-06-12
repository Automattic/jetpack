(function( wp, $, api ){
	api.controlConstructor.jetpackCss = api.Control.extend({
		modes: {
			'default': 'text/css',
			'less': 'text/x-less',
			'sass': 'text/x-scss'
		},
		_updating: false,
		/**
		 * Fires when our control is ready for action. Gets everything set up.
		 * @return {null}
		 */
		ready: function() {
			this.opts = window._jp_css_settings;
			// add our textarea
			this.$input = $( '<textarea />', {
				name: this.setting.id,
				'class': 'for-codemirror hidden'
			} ).val( this.setting() );
			this.container.append( this.$input );

			// keep the textarea and the setting synced up
			api( this.setting.id, _.bind( function( setting ){
				var element = new api.Element( this.$input );
				this.elements = [ element ];
				element.sync( setting );
				element.set( setting() );
			}, this ) );

			// should we use CodeMirror?
			if ( this.opts.useRichEditor ) {
				this.initCodeMirror();
			} else {
				this.$input.removeClass( 'hidden' );
			}

			api.bind( 'ready', _.bind( this.addLabels, this ) );
		},
		/**
		 * Set up our CodeMirror instance
		 * @return {null}
		 */
		initCodeMirror: function() {
			this.editor = window.CodeMirror.fromTextArea( this.$input.get(0), {
				mode: this.getMode(),
				lineNumbers: true,
				tabSize: 2,
				indentWithTabs: true,
				lineWrapping: true
			} );

			this.addListeners();
		},
		/**
		 * Adds various listeners for CodeMirror to render and keep in sync
		 * with the textarea.
		 */
		addListeners: function() {
			var edited = false;

			// refresh the CodeMirror instance's rendering because it's initially hidden
			// 250ms because that's the open animation duration
			$( '#accordion-section-custom_css > .accordion-section-title' ).click( _.bind( _.debounce( this.editor.refresh, 250 ), this.editor ) );
			// also refresh when focusing
			this.editor.on( 'focus', function( editor ) {
				editor.refresh();
			});

			// when the CodeMirror instance changes, mirror to the textarea,
			// where we have our "true" change event handler bound. This allows both to function.
			this.editor.on( 'change', _.bind( function( editor ) {
				this._updating = true;
				this.$input.val( editor.getValue() ).trigger( 'change' );
				this._updating = false;

				if ( ! edited ) {
					window.ga && window.ga( 'send', 'event', 'Customizer', 'Typed Custom CSS' );
					edited = true;
				}
			}, this ) );

			this.editor.on( 'focus', function() {
				window.ga && window.ga( 'send', 'event', 'Customizer', 'Focused CSS Editor' );
			} );

			// when others update the control, update CodeMirror
			this.setting.bind( 'change', _.bind( this.externalChange, this ) );
		},
		/**
		 * Get the mode of the currently active preprocessor (if any),
		 * falling back to text/css
		 * @return {string} mode for CodeMirror
		 */
		getMode: function() {
			var mode = api( 'jetpack_custom_css[preprocessor]' )();
			if ( '' === mode || ! this.modes[ mode ] ) {
				mode = 'default';
			}
			return this.modes[ mode ];
		},
		/**
		 * If another control updates our setting, re-render the CodeMirror instance
		 * @return {null}
		 */
		externalChange: function() {
			// only if the change wasn't internal
			if( ! this._updating ) {
				this.editor.setValue( this.setting() );
			}
		},
		/**
		 * Callback for when the CSS panel opens to refresh the CodeMirror rendering
		 * @param  {string} id The panel being opened
		 * @return {null}
		 */
		refresh: function( id ) {
			if ( 'accordion-section-custom_css' === id ) {
				setTimeout( _.bind( function(){
					this.editor.refresh();
				}, this), 300 );
			}
		},
		/**
		 * Add some labels that the default checkbox controls don't allow.
		 * Add CSS Revisions and CSS Help links.
		 */
		addLabels: function() {
			this.addTitle( 'jetpack_css_mode_control', this.opts.l10n.mode );
			this.addTitle( 'jetpack_mobile_css_control', this.opts.l10n.mobile );
			this.addDesc( 'wpcom_custom_css_content_width_control', this.opts.l10n.contentWidth );
			var widthControl = this._getControl( 'wpcom_custom_css_content_width_control' );
			if ( widthControl ) {
				widthControl.find( 'input' ).after( '<span>px</span>' );
			}
			$( '<div />', {
				id: 'css-help-links',
				'class': 'css-help'
			}).appendTo( this.container );
			$( '<a />', {
				id: 'help-link',
				target: '_blank',
				href: this.opts.cssHelpUrl,
				text: this.opts.l10n.css_help_title
			}).prependTo( '#css-help-links' );

			// Only show the revisions link if there are revisions
			if ( this.opts.areThereCssRevisions ) {
				$( '<a />', {
					id: 'revisions-link',
					target: '_blank',
					href: this.opts.revisionsUrl,
					text: this.opts.l10n.revisions
				}).prependTo( '#css-help-links' );
			}
		},
		/**
		 * Add a title to a control
		 * @param {string} controlId Control ID
		 * @param {string} title     A title to add
		 */
		addTitle: function( controlId, title ) {
			var control = this._getControl( controlId );
			if ( control ) {
				control.prepend( '<span class="customize-control-title">' + title + '<span>' );
			}
		},
		/**
		 * Add a description to a control
		 * @param {string} controlId Control ID
		 * @param {string} desc      A description to add
		 */
		addDesc: function( controlId, desc ) {
			var control = this._getControl( controlId );
			if ( control ) {
				control.append( '<span class="description">' + desc + '<span>' );
			}
		},
		/**
		 * Helper function to qet a control by ID
		 * @param  {string} controlId Control ID
		 * @return {object}           jQuery object of the container
		 */
		_getControl: function( controlId ) {
			var control = api.control.value( controlId );
			if ( control ) {
				return control.container;
			}
			return null;
		}
	});

})( this.wp, jQuery, this.wp.customize );
