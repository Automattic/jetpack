/* global wp, _wpCustomizeSettings, Backbone */
( function ( wp, $ ) {
	// Open closure

	wp = wp || {};
	const api = wp.customize;

	/**
	 * Our very own customizer handler
	 */
	api.ColorsTool = api.Control.extend( {
		// some init vars
		patternPageSize: 3,
		palettes: [],
		patterns: [],
		paletteIndex: 0,
		patternIndex: 0,
		palettesAtATime: 6,
		fetchingPatterns: false,
		fetchingPalettes: false,
		backgroundChangeView: {},

		ready: function () {
			let hex, cat;
			const ct = this;

			// Some variables
			ct.opts = window.ColorsTool; // from wp_localize_script
			ct.tool = $( '#customize-control-colors-tool' );
			ct.topLabel = $( '.customize-control-colorsTool .customize-control-title:first' );
			ct.grid = $( '#color-grid' );
			ct.color = this.grid.find( 'li' );
			ct.bgPrompt = $( '#the-bg-picker-prompt' );
			ct.picker = $( '#the-picker' );
			ct.patternPicker = $( '#the-pattern-picker' );
			ct.reference = $( '#color-reference' );
			ct.palette = $( '.colour-lovers' );
			ct.suggestions = this.picker.find( '.color-suggestions' );
			ct.orig = ct.setting.get();
			ct.origBackground = this.coreBgImage();
			ct.topPatterns = ct.opts.topPatterns;

			ct.backgroundChangeView = new api.ColorsTool.BackgroundChangeView( {
				el: '#background-change',
				controller: this,
			} );

			// The main functions
			ct.colorPicker();
			ct.addChangeListener();

			// Since overrideCoreBg() may require wp.customize.state,
			// ensure execution order using `ready` bind.
			api.bind( 'ready', function () {
				ct.overrideCoreBg();
			} );

			ct.iris = ct.irisPicker();

			// set up the color grid.
			ct.color.each( function () {
				cat = $( this ).data( 'role' );

				if ( cat in ct.orig ) {
					hex = ct.sanitizeHex( ct.orig[ cat ] );
					ct.setColor( this, hex );
				}
			} );

			if ( ! ct.opts.themeSupport.customBackground ) {
				ct.grid.find( '.bg' ).addClass( 'bg-change-disable' );
				ct.tool.addClass( 'disable-background' );
			} else {
				ct.tool.addClass( 'enable-background' );
				ct.breakSectionTitle();
			}

			$( '.action-button-wrap' ).insertBefore( ct.topLabel );

			// Revert action
			// Updates the grid back to default colors
			$( '.revert' ).on( 'click', function () {
				const colors = ct.opts.defaultColors;

				ct.color.each( function () {
					const category = $( this ).data( 'role' );

					if ( category in colors ) {
						hex = ct.sanitizeHex( colors[ category ] );
						ct.setColor( this, hex );
					}
				} );

				ct.grid.trigger( 'color-change' );
				ct.coreBgImage( ct.opts.defaultImage );
				// Stat: 'revert-default'
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=revert-default&baba=' +
					Math.random();
			} );

			// open it if we came here with a #colors hash
			if ( window.location.hash === '#colors' ) {
				// Bump a stat for each time the Color tool is loaded from the Custom Design page (uses the hash).
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_theme-customizer-colors=1&baba=' +
					Math.random();
			}
		},

		coreBgImage: function ( value ) {
			if ( ! this.opts.themeSupport.customBackground ) {
				return false;
			}
			if ( typeof value === 'undefined' ) {
				return api( 'background_image' ).get();
			}
			api( 'background_image' ).set( value );
		},

		coreBgColor: function ( value ) {
			if ( ! this.opts.themeSupport.customBackground ) {
				return false;
			}
			if ( typeof value === 'undefined' ) {
				return api( 'background_color' ).get();
			}
			api( 'background_color' ).set( value );
		},

		resetHeaderTextColor: function () {
			const picker = $( '#customize-control-header_textcolor' ).find( 'input.wp-color-picker' );

			if ( picker.wpColorPicker ) {
				const color = picker.wpColorPicker( 'defaultColor' );

				if ( api( 'header_textcolor' ).get() !== 'blank' ) {
					picker.wpColorPicker( 'color', color );
					api( 'header_textcolor' ).set( '' );
				}
			}
		},

		breakSectionTitle: function () {
			this.topLabel.text( this.opts.backgroundTitle );
			this.grid
				.find( '.bg' )
				.after(
					'<li class="text-placeholder clrs"><div><span class="customize-control-title">' +
						this.opts.colorsTitle +
						'</span></div></li>'
				);
		},

		overrideCoreBg: function () {
			const ct = this;
			if ( ! this.opts.themeSupport.customBackground ) {
				return;
			}

			/**
			 * Background callback function.
			 *
			 * @param {string} to - set background image to this URL.
			 */
			function bgCallback( to ) {
				if ( to ) {
					ct.grid.find( '.bg' ).css( 'background-image', 'url(' + to + ')' );
					ct.bgPrompt.find( '.choose-pattern' ).css( 'background-image', 'url(' + to + ')' );

					if ( -1 !== to.indexOf( 'colourlovers' ) ) {
						api( 'background_repeat' ).set( 'repeat' );
					}
				} else {
					ct.grid.find( '.bg' ).css( 'background-image', '' );
					ct.bgPrompt.find( '.choose-pattern' ).css( 'background-image', '' );
				}
			}

			api( 'background_image' ).bind( bgCallback );
			bgCallback( _wpCustomizeSettings.settings.background_image.value );

			ct.bgPrompt
				.find( '.choose-color' )
				.css( 'background-color', ct.getColor( ct.grid.find( '.bg' ) ) );
		},

		/**
		 * Set up Iris Color Picker.
		 *
		 * @return {object} cp - Iris color picker.
		 */
		irisPicker: function () {
			const ct = this,
				container = $( '#iris' );

			if ( ! ( 'iris' in container ) ) {
				$( '.iris-launch' ).hide();
				return null;
			}

			// first bind click handlers
			$( '#pick-your-nose' ).click( function ( e ) {
				e.preventDefault();
				$( '#iris-container' ).show();

				// Stat: 'color-picker'
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=color-picker&baba=' +
					Math.random();
			} );

			return container.iris( {
				hide: false,
				width: 260,
				change: function ( event, ui ) {
					if ( ct.getColor( ct.activeColor ).toUpperCase() !== ui.color.toString().toUpperCase() ) {
						ct.setColor( ct.activeColor, ui.color.toString() );
						ct.grid.trigger( 'color-change', $( ct.activeColor ).data( 'role' ) );
					}
				},
			} );
		},

		status: function () {
			const ct = this;

			for ( let i = 0, _len = ct.color.length; i < _len; i++ ) {
				const $self = $( ct.color.get( i ) );

				if ( ct.getColor( $self ) !== ct.opts.defaultColors[ $self.data( 'role' ) ] ) {
					return 'saved';
				}
			}

			return 'default';
		},
		getColor: function ( el ) {
			let color = $( el ).data( 'color' );

			if ( typeof color === 'undefined' ) {
				color = $( el ).text();
				$( el ).data( 'color', color );
			}
			return color;
		},
		setColor: function ( el, color ) {
			$( el ).data( 'color', color ).css( 'background-color', color );
		},
		sanitizeHex: function ( hex ) {
			// @todo make more betterer at sanitizing. or just call it formatter.
			return '#' + hex.replace( /^#/, '' );
		},
		/**
		 * Color Grid & Picker
		 */
		colorPicker: function () {
			const ct = this;

			// Bind to click event on each color li
			ct.grid.on( 'click', 'li:not(.text-placeholder)', function () {
				if ( $( this ).hasClass( 'unavailable' ) ) {
					return;
				}

				ct.picker.hide();
				const self = $( this );

				// Check to see if the clicked element was already active
				if ( $( this ).hasClass( 'selected' ) ) {
					$( this ).removeClass( 'selected' );
					ct.picker.hide();
				}

				// Does the main work
				else {
					if ( ct.color.hasClass( 'selected' ) ) {
						// Remove class from other items
						ct.color.removeClass( 'selected' );
					} else {
						ct.picker.hide();
					}
					self.addClass( 'selected' );
					// Displays the color picker box
					ct.showColorChangeOptions( self );

					if (
						$( this ).hasClass( 'bg' ) === true &&
						$( this ).hasClass( 'bg-change-disable' ) === false
					) {
						ct.backgroundChangeView.open();
					}
				}
			} );

			// Apply a color suggestions to main grid
			ct.picker.find( '.color-suggestions' ).on( 'click', 'li', function () {
				const selected = ct.grid.find( '.selected' ),
					color = ct.getColor( this );

				ct.setColor( selected.get( 0 ), color );
				// Update hex reference
				$( '#hex-code' ).text( color );

				if ( ct.iris ) {
					$( '#iris-container' ).hide();
					ct.iris.iris( 'option', 'color', color );
				}

				// Trigger the color change event
				ct.grid.trigger( 'color-change', selected.data( 'role' ) );

				// Stat: 'suggestions'
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=suggestions&baba=' +
					Math.random();
			} );
		},

		showColorChangeOptions: function ( activeColor ) {
			const ct = this,
				self = $( activeColor ),
				selected_color = ct.getColor( self );

			// ct.bgPrompt.hide();
			ct.picker.show();
			// store so Iris knows who to talk to
			ct.activeColor = self.get( 0 );

			$( '.color-suggestions li' ).hide();
			ct.suggestions.spin( 'medium' );

			// send to Iris
			if ( ct.iris ) {
				ct.iris.iris( 'option', 'color', selected_color );
			}

			// Display which $cat we are editing
			const label = self.data( 'title' );
			if ( label !== undefined ) {
				ct.reference.html( label ).show();
			} else {
				ct.reference.hide();
			}

			const query_arguments = {
				action: 'color_recommendations',
				color: selected_color,
				role: self.data( 'role' ),
				limit: 14,
			};

			ct.color.each( function () {
				if ( ct.getColor( this ) !== selected_color ) {
					query_arguments[ 'colors[' + $( this ).data( 'role' ) + ']' ] = ct.getColor( this );
				}
			} );

			$.get(
				'/wp-admin/admin-ajax.php',
				query_arguments,
				function ( data ) {
					let color;
					const suggestions = $( '.color-suggestions li' );

					for ( let i = 0, _len = data.colors.length; i < _len; i++ ) {
						color = '#' + data.colors[ i ];
						ct.setColor( suggestions.get( i ), color );
						suggestions.eq( i ).show();
					}
					// Hide the spinner
					ct.suggestions.spin( false );
				},
				'json'
			);
		},

		addChangeListener: function () {
			const ct = this;

			// Binds to color-change
			ct.grid.on( 'color-change', function ( e, role ) {
				ct.setting( ct.currentPalette() );

				// Save the background color in the core custom background color setting too.
				if ( ct.status() === 'default' ) {
					ct.coreBgColor( '' );
				} else {
					ct.coreBgColor( ct.getColor( ct.grid.find( '.bg' ) ) );
				}

				// If the entire palette or background color has changed, reset the background image.
				if ( ! role || 'bg' === role ) {
					const backgroundImage = ct.coreBgImage();
					if (
						backgroundImage &&
						( backgroundImage.indexOf( 'colourlovers' ) !== -1 ||
							backgroundImage === ct.opts.defaultImage ||
							backgroundImage === ct.origBackground )
					) {
						ct.coreBgImage( '' );
					}

					ct.bgPrompt
						.find( '.choose-color' )
						.css( 'background-color', ct.getColor( ct.grid.find( '.bg' ) ) );
				}

				if ( ! ct.opts.themeSupport.customBackground ) {
					// todo: clean up bgPrompt
					ct.bgPrompt.find( '.choose-color' ).click();
				}
			} );
		},
		currentPalette: function () {
			const ct = this,
				colors = {};

			ct.grid.children().each( function () {
				colors[ $( this ).data( 'role' ) ] = ct.getColor( this );
			} );

			return colors;
		},
	} );

	/* Helper */
	const fetchImage = function ( url ) {
		const deferred = $.Deferred(),
			img = new Image();
		if ( ! url ) {
			deferred.reject();
		}
		img.onload = function () {
			deferred.resolve( this );
		};
		img.onerror = function () {
			deferred.reject();
		};
		img.src = url;
		return deferred.promise();
	};

	api.ColorsTool.BackgroundChangeView = wp.Backbone.View.extend( {
		template: wp.template( 'background-change' ),
		events: {
			'click .hide-image': 'hideImage',
			'click .select-image': 'openMediaManager',
			'click .done *': 'hide',
			'click .button.background-options': 'toggleOptions',
		},
		initialize: function () {
			for ( const func of [
				'updateImage',
				'updateBgSize',
				'updateRectangleStyle',
				'showPickerBorder',
				'hidePickerBorder',
			] ) {
				this[ func ] = this[ func ].bind( this );
			}
			this.controller = this.options.controller;
			api.bind( 'change', this.updateImage );
			this.render();
		},
		updateImage: function ( control ) {
			if ( control && control.id.indexOf( 'background' ) !== 0 ) {
				return;
			}

			const settings = api.get();
			this.currentBgImage = settings.background_image;
			this.currentBgColor = settings.background_color || this.controller.opts.defaultColors.bg;

			api.trigger( 'loading' );
			fetchImage( this.currentBgImage )
				.done( this.updateBgSize )
				.always( this.updateRectangleStyle );

			if ( this.currentBgImage ) {
				this.imgControls.show();
			} else {
				this.imgControls.hide();
				this.hideOptions();
			}
		},
		updateBgSize: function ( img ) {
			const ratio = img.width / img.height,
				rW = this.rectangle.width(),
				rH = this.rectangle.height(),
				isPattern = img.width < rW || img.height < rH;

			if ( isPattern ) {
				this.currentBgSize = '50%';
			} else {
				const edge = rW / rH,
					isLong = ratio > edge;

				this.currentBgSize = isLong ? 'auto 100%' : '100% auto';
			}
		},
		updateRectangleStyle: function () {
			const settings = api.get();

			api.trigger( 'loaded' );
			this.rectangle.css( {
				backgroundColor: this.currentBgColor,
				backgroundImage: "url('" + this.currentBgImage + "')",
				backgroundPositionX: settings.background_position_x,
				backgroundSize: this.currentBgSize || '100%',
			} );
		},
		render: function () {
			this.$el.html( this.template() );
			this.rectangle = this.$el.find( '.background-rectangle' ).add( '.color-grid.main li.bg' );
			this.imgControls = this.$el.find( '.button.background-options' );
			this.updateImage();
		},
		open: function () {
			this.$el.show();
			this.controller.grid.hide();
			this.controller.reference.hide();
			this.hidePickerBorder();
			this.rectangle.css( 'width', '100%' );
			Backbone.trigger( 'custom-colors:stat', 'colors-background', 'change-panel-opened' );
		},
		hide: function () {
			this.$el.hide();
			this.controller.grid.show();
			this.controller.reference.show();
			this.controller.picker.hide();
			this.controller.color.removeClass( 'selected' );
			this.showPickerBorder();
		},
		toggleOptions: function () {
			let v = this.optionsView;
			const button = this.$el.find( '.button.background-options' );

			if ( ! v ) {
				v = this.optionsView = new api.ColorsTool.BackgroundOptionsView( {
					el: '.view.background-options',
					changeView: this,
				} );
			}

			button.toggleClass( 'pressed' );
			if ( button.hasClass( 'pressed' ) ) {
				v.open();
			} else {
				v.close();
			}
		},
		hideOptions: function () {
			const button = this.$el.find( '.button.background-options' ),
				v = this.optionsView;
			if ( v ) {
				button.removeClass( 'pressed' );
				v.close();
			}
		},
		openMediaManager: function ( event ) {
			event.preventDefault();
			this.frame = wp.media( {
				title: this.controller.opts.mediaTitle,
				library: {
					type: 'image',
				},
				button: {
					text: this.controller.opts.mediaSelectButton,
					close: true,
				},
				multiple: false,
			} );
			this.frame.on(
				'select',
				function () {
					const attachment = this.frame.state().get( 'selection' ).first();
					api( 'background_image' ).set( attachment.get( 'url' ) );
					Backbone.trigger( 'custom-colors:stat', 'colors-background', 'image-chosen' );
				},
				this
			);
			this.frame.open();
		},
		showPickerBorder: function () {
			if ( ! this.borderWidth && this.borderWidth === '0px' ) {
				this.borderWidth = '1px'; // fallback
			}
			this.controller.picker.css( 'border-top-width', this.borderWidth );
		},
		hidePickerBorder: function () {
			const width = this.controller.picker.css( 'border-top-width' );
			if ( width !== '0px' ) {
				this.borderWidth = width;
			}
			this.controller.picker.css( 'border-top-width', 0 );
		},
		hideImage: function () {
			api( 'background_image' ).set( '' );
			Backbone.trigger( 'custom-colors:stat', 'colors-background', 'image-hidden' );
		},
	} );

	api.ColorsTool.BackgroundOptionsView = wp.Backbone.View.extend( {
		template: wp.template( 'background-options' ),
		events: {
			'click input': 'set',
			'click .hide-image': 'hideImage',
		},
		_defaults: {
			attachment: 'scroll',
			position_x: 'left',
			repeat: 'repeat',
		},
		states: function () {
			return Object.entries( this._defaults ).reduce( ( acc, [ key, val ] ) => {
				acc[ key ] = api( 'background_' + key ).get() || val;
				return acc;
			}, {} );
		},
		render: function () {
			this.$el.html( this.template() );
			for ( const [ key, value ] of Object.entries( this.states() ) ) {
				this.$el.find( 'input[name=' + key + '][value=' + value + ']' ).prop( 'checked', true );
			}
			this.setupIris();
			return this;
		},
		open: function () {
			if ( ! this.$el.html() ) {
				this.render();
			}
			this.$el.show();
			Backbone.trigger( 'custom-colors:stat', 'colors-background', 'options-panel-opened' );
		},
		close: function () {
			this.$el.hide();
		},
		set: function ( event ) {
			const input = $( event.currentTarget ),
				name = input.attr( 'name' ),
				checked = input.is( ':checked' ),
				value = checked ? input.val() : this._defaults[ name ];

			api( 'background_' + name ).set( value );
			Backbone.trigger( 'custom-colors:stat', 'colors-background', name );
		},
		hideImage: function () {
			this.options.changeView.hideImage();
		},
		setupIris: function () {
			const input = this.$el.find( '#underlying-color' ),
				label = this.$el.find( 'label[for=underlying-color]' ),
				target = this.$el.find( '.iris-container' ),
				ct = this.options.changeView.controller;

			label.css( 'background-color', api( 'background_color' ).get() );
			input.iris( {
				palettes: true,
				target: target,
				change: function ( event, ui ) {
					const color = ui.color.toString(),
						palette = ct.currentPalette();
					palette.bg = color;
					ct.setting( palette );
					api( 'background_color' ).set( color );
				},
			} );
			label.click( function () {
				input.iris( 'toggle' );
			} );
			api.bind( 'change', function ( control ) {
				if ( 'background_color' === control.id ) {
					label.css( 'background-color', control._value );
				}
			} );
		},
	} );

	Backbone.on( 'custom-colors:stat', function ( bucket, stat ) {
		const url =
			document.location.protocol +
			'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_' +
			bucket +
			'=' +
			stat +
			'&baba=' +
			Math.random();
		new Image().src = url;
	} );

	// let's use it.
	api.controlConstructor.colorsTool = api.ColorsTool;
} )( wp, jQuery ); // Close closure. She sells sea shells.
