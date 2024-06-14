/* jshint maxerr: 10000 */
( function ( wp, $, _, undef ) {
	// Open closure

	var api, fetchImage;
	wp = wp || {};
	api = wp.customize;

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
			var ct = this,
				hex,
				cat;

			// Some variables
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
			ct.opts = ColorsTool; // from wp_localize_script
			ct.orig = ct.opts.colors;
			ct.origBackground = api( 'background_image' ).get();
			ct.topPatterns = ct.opts.topPatterns;

			ct.backgroundChangeView = new api.ColorsTool.BackgroundChangeView( {
				el: '#background-change',
				controller: this,
			} );

			// The main functions
			ct.colorPicker();
			ct.dragColor();
			ct.addChangeListener();
			ct.initPalettes();

			if ( ! api.isNux ) {
				ct.initPatterns();
			}
			ct.iris = ct.irisPicker();
			ct.freeMode();
			ct.showHeaderTextColorControl();

			// set up the color grid.
			ct.color.each( function ( index ) {
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

			// Only show 'undo' button when a color change has occured
			// Helps clear confusion between revert and undo
			ct.grid.on( 'color-change', function () {
				$( '.action-button-wrap' ).addClass( 'undo' );
			} );

			// Revert action
			// Updates the grid back to default colors
			$( '.revert' ).on( 'click', function () {
				// pick the colors to restore to.
				var colors = $( this ).hasClass( 'revert-default' )
					? ct.opts.defaultColors
					: ct.opts.colors;

				ct.color.each( function ( index ) {
					cat = $( this ).data( 'role' );

					if ( cat in colors ) {
						hex = ct.sanitizeHex( colors[ cat ] );
						ct.setColor( this, hex );
					}
				} );

				ct.grid.trigger( 'color-change' );

				if ( $( this ).hasClass( 'revert-default' ) ) {
					api( 'background_image' ).set( ct.opts.defaultImage );
					// Stat: 'revert-default'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=revert-default&baba=' +
						Math.random();
				} else {
					api( 'background_image' ).set( ct.origBackground );
					// Stat: 'revert-undo'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=revert-undo&baba=' +
						Math.random();
				}

				$( '.action-button-wrap' ).removeClass( 'undo' );
			} );

			// open it if we came here with a #colors hash
			if ( window.location.hash === '#colors' ) {
				// Bump a stat for each time the Color tool is loaded from the Custom Design page (uses the hash).
				new Image().src =
					document.location.protocol +
					'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_theme-customizer-colors=1&baba=' +
					Math.random();
			}
		},

		// Sets up free mode UX
		freeMode: function () {
			if ( this.opts.isFreeMode ) {
				$( '#customize-controls' ).addClass( 'free-mode' );
			}
		},

		showHeaderTextColorControl: function () {
			var ct = this,
				toggleControl = function () {
					var headerControl = $( '.customize-control-header-text-color' );

					if ( ct.status() === 'default' ) {
						headerControl.show();
					} else {
						headerControl.hide();
					}
				};

			_.defer( function () {
				// Grab core's control
				$( '[data-id-from="accordion-section-colors"]' )
					.addClass( 'customize-control' )
					.addClass( 'customize-control-header-text-color' )
					.appendTo( '[data-id-from="accordion-section-colors_manager_tool"]' )
					.show()
					.removeClass( 'accordion-section-content accordion-section-colors' )
					.children( ':not(#customize-control-header_textcolor)' )
					.hide();

				toggleControl();
			} );

			api.bind( 'change', function ( control ) {
				if ( 'colors_manager[colors]' == control.id ) {
					toggleControl();

					// reset regardless of ct.status()
					ct.resetHeaderTextColor();
				}
			} );
		},

		resetHeaderTextColor: function () {
			var picker = $( '#customize-control-header_textcolor' ).find( 'input.wp-color-picker' ),
				color = picker.wpColorPicker( 'defaultColor' );

			if ( api( 'header_textcolor' ).get() !== 'blank' ) {
				picker.wpColorPicker( 'color', color );
				api( 'header_textcolor' ).set( '' );
			}
		},

		breakSectionTitle: function () {
			this.topLabel.text( this.opts.backgroundTitle );
			this.grid
				.find( '.bg' )
				.after(
					'<li class="text-placeholder"><div><span class="customize-control-title">' +
						this.opts.colorsTitle +
						'</span></div></li>'
				);
		},

		overrideCoreBg: function () {
			var ct = this;

			function bgCallback( to, from ) {
				if ( to ) {
					ct.grid.find( '.bg' ).css( 'background-image', 'url(' + to + ')' );
					ct.bgPrompt.find( '.choose-pattern' ).css( 'background-image', 'url(' + to + ')' );

					if ( -1 !== to.indexOf( 'colourlovers' ) ) {
						api( 'background_repeat' ).set( 'repeat' );
						// api( 'background_position_x' ).set( '' );
						// api( 'background_attachment' ).set( '' );
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

		initPatterns: function () {
			var ct = this;
			if (
				! ct.opts.themeSupport.customBackground ||
				ct.grid.find( '.bg' ).hasClass( 'unavailable' )
			) {
				return $( '#the-pattern-picker' ).hide();
			}

			ct.colorPatterns();

			// Apply patterns to background element
			// Binds to click event on each pattern anchor
			ct.patternPicker
				.on( 'click', '.pattern a', function ( e ) {
					e.preventDefault();

					api( 'background_image' ).set( $( this ).data( 'customizeImageValue' ) );

					if ( ct.backgroundChangeView.optionsView ) {
						ct.backgroundChangeView.optionsView.render();
					}

					// Stat: 'patterns'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=patterns&baba=' +
						Math.random();
				} )
				.on( 'click', '#less-patterns', function ( e ) {
					e.preventDefault();

					ct.showPatterns( ct.patternIndex - ct.patternPageSize * 2 );
				} )
				.on( 'click', '#more-patterns', function ( e ) {
					e.preventDefault();

					// Stat: 'more-patterns'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=more-patterns&baba=' +
						Math.random();

					if ( ct.patternIndex < ct.patterns.length ) {
						ct.showPatterns( ct.patternIndex );
					}

					if (
						( ! ct.fetchingPatterns && 0 == ct.patterns.length ) ||
						ct.patternIndex == ct.patterns.length - 5
					) {
						ct.fetchingPatterns = true;

						var query_arguments = {
							action: 'pattern_recommendations',
							limit: '30',
							offset: ct.patterns.length,
						};

						ct.color.each( function () {
							query_arguments[ 'colors[' + $( this ).data( 'role' ) + ']' ] = ct.getColor( this );
						} );

						$.get(
							'/wp-admin/admin-ajax.php',
							query_arguments,
							function ( data ) {
								if ( ! data.patterns.length ) {
									$( '#more-patterns' ).hide();
								}

								$.merge( ct.patterns, data.patterns );

								ct.fetchingPatterns = false;

								if ( 0 == ct.patternIndex ) {
									ct.showPatterns();
								}
							},
							'json'
						);
					}
				} );

			ct.overrideCoreBg();
		},

		initPalettes: function () {
			var ct = this;

			ct.colorPalettes();

			// hide core Colors
			$( '#accordion-section-colors' ).hide();

			$( '#more-palettes' )
				.on( 'click', function () {
					// Load palettes into a client-side cache 40 at a time
					// and refresh that cache one page before it's necessary.
					if ( ct.paletteIndex <= ct.palettes.length - ct.palettesAtATime ) {
						ct.showPalettes( ct.paletteIndex );
					}

					// Stat: 'more-palettes'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=more-palettes&baba=' +
						Math.random();

					if (
						! ct.fetchingPalettes &&
						ct.paletteIndex >= ct.palettes.length - ct.palettesAtATime * 2
					) {
						ct.fetchingPalettes = true;
						$.get(
							'/wp-admin/admin-ajax.php',
							{
								action: 'color_palettes',
								limit: '40',
								offset: ct.palettes.length,
							},
							function ( data ) {
								if ( ! data.palettes.length ) {
									return $( '#more-palettes' ).hide();
								}

								$.merge( ct.palettes, data.palettes );
								if (
									0 == ct.paletteIndex ||
									ct.paletteIndex >= ct.palettes.length - data.palettes.length - ct.palettesAtATime
								) {
									$( '#more-palettes' ).click();
								}
								ct.fetchingPalettes = false;
							},
							'json'
						);
					}
				} )
				.click();

			$( '#less-palettes' ).click( function () {
				ct.showPalettes( ct.paletteIndex - 2 * ct.palettesAtATime );
			} );

			// Calls generate palette code
			ct.generatePaletteFromHeader();
		},

		/**
		 * Generate a palette based on the current header image
		 * Uses the tonesque library for color sampling
		 */
		generatePaletteFromHeader: function () {
			var ct = this,
				text,
				colors,
				cat,
				generatePalette = $( '#generate-palette' ),
				checkValidImage = function ( value ) {
					var badValues = [ 'remove-header', 'random-uploaded-image', 'random-default-image' ];
					if ( value && ! _.contains( badValues, value ) ) {
						ct.opts.headerImage = value;
						generatePalette.show();
						return true;
					}
					generatePalette.hide();
					return false;
				};

			// Initialize from API
			ct.opts.headerImage = api.settings.settings.header_image.value;

			// Actions for the "Match header image" button
			api.bind( 'change', function ( control ) {
				if ( 'header_image' == control.id ) {
					checkValidImage( control._value );
				}
			} );

			// Check that we have a header image
			// otherwise hide the button
			checkValidImage( ct.opts.headerImage );

			// Store button text
			text = generatePalette.text();

			generatePalette.on( 'click', function () {
				// Don't do this if it's free mode
				if ( ct.opts.isFreeMode ) {
					return ct.buyNotice();
				}

				// Show processing message
				$( this ).text( ct.opts.genPalette );

				$.get(
					'/wp-admin/admin-ajax.php',
					{
						action: 'generate_palette',
						image: ct.opts.headerImage,
					},
					function ( data ) {
						colors = data[ 'colors' ];

						if ( colors ) {
							ct.color.each( function ( index ) {
								cat = $( this ).data( 'role' );

								if ( cat in colors ) {
									hex = ct.sanitizeHex( colors[ cat ] );
									ct.setColor( this, hex );
								}
							} );
						}

						ct.grid.trigger( 'color-change' );

						// Restore button text
						generatePalette.text( text );
					},
					'json'
				);
				// Stat: 'generate-palette'
				new Image().src =
					document.location.protocol +
					'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=generate-palette&baba=' +
					Math.random();
			} );
		},

		/**
		 * Set up Iris Color Picker
		 */
		irisPicker: function () {
			var ct = this,
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
					'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=color-picker&baba=' +
					Math.random();
			} );

			return container.iris( {
				hide: false,
				width: 260,
				change: function ( event, ui ) {
					if ( ct.getColor( ct.activeColor ).toUpperCase() != ui.color.toString().toUpperCase() ) {
						ct.setColor( ct.activeColor, ui.color.toString() );
						ct.grid.trigger( 'color-change', $( ct.activeColor ).data( 'role' ) );
					}
				},
			} );
		},

		status: function () {
			var ct = this;

			for ( var i = 0, _len = ct.color.length; i < _len; i++ ) {
				var $self = $( ct.color.get( i ) );

				if ( ct.getColor( $self ) != ct.opts.defaultColors[ $self.data( 'role' ) ] ) {
					return 'saved';
				}
			}

			return 'default';
		},
		getColor: function ( el ) {
			var color = $( el ).data( 'color' );

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
			var ct = this,
				tooltip = $( '#color-tooltip' ),
				other_colors,
				selected_color,
				label,
				bubble,
				width;

			// Bind to click event on each color li
			ct.grid.on( 'click', 'li:not(.text-placeholder)', function () {
				if ( $( this ).hasClass( 'unavailable' ) ) {
					return;
				}

				// If it's free mode and the theme supports background
				// allow users to use color suggestions and the picker
				if ( ct.opts.isFreeMode ) {
					if ( ! $( this ).hasClass( 'bg' ) || ! ct.opts.themeSupport.customBackground ) {
						return ct.buyNotice();
					}
				}

				ct.picker.hide();
				var self = $( this );

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
						$( '#colourlovers-palettes-container' ).hide();
					}
				}
			} );

			// Apply a color suggestions to main grid
			ct.picker.find( '.color-suggestions' ).on( 'click', 'li', function () {
				var selected = ct.grid.find( '.selected' ),
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
					'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=suggestions&baba=' +
					Math.random();
			} );
		},

		showColorChangeOptions: function ( activeColor ) {
			var ct = this,
				self = $( activeColor ),
				other_colors = [],
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
			label = self.data( 'title' );
			if ( label !== undefined ) {
				ct.reference.html( label ).show();
			} else {
				ct.reference.hide();
			}

			var query_arguments = {
				action: 'color_recommendations',
				color: selected_color,
				role: self.data( 'role' ),
				limit: 14,
			};

			ct.color.each( function () {
				if ( ct.getColor( this ) != selected_color ) {
					query_arguments[ 'colors[' + $( this ).data( 'role' ) + ']' ] = ct.getColor( this );
				}
			} );

			$.get(
				'/wp-admin/admin-ajax.php',
				query_arguments,
				function ( data ) {
					var suggestions = $( '.color-suggestions li' ),
						color;

					for ( var i = 0, _len = data.colors.length; i < _len; i++ ) {
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

		showBackgroundColorChangeOptions: function () {
			if ( this.opts.themeSupport.customBackground ) {
				if ( 0 == this.patterns.length ) {
					// Populates the patterns for the matching palette
					$( '#more-patterns' ).click();
				}
			} else {
				// todo: clean up bgPrompt
				this.bgPrompt.find( '.choose-color' ).click();
			}
		},

		showBackgroundPatternOptions: function () {
			// this.bgPrompt.hide();
			this.patternPicker.show();
			this.showPatterns();
		},

		/**
		 * Color Patterns
		 */
		colorPatterns: function () {
			this.showBackgroundPatternOptions();
		},

		/**
		 * Color Palettes
		 */
		colorPalettes: function () {
			var ct = this,
				palettes = {},
				color,
				role;

			$( '#colourlovers-palettes' ).on( 'click', '.colour-lovers', function () {
				// Don't apply non-featured palettes for free mode
				if ( ct.opts.isFreeMode && ! $( this ).hasClass( 'featured' ) ) {
					return ct.buyNotice();
				}

				// Populate an array with color values
				// taken from clicked palette
				$( this )
					.find( 'li' )
					.each( function () {
						color = ct.getColor( this );
						role = $( this ).attr( 'data-role' );
						palettes[ role ] = color;
					} );

				// Apply colors to our main grid
				ct.color.each( function ( index, item ) {
					ct.setColor( this, palettes[ $( this ).attr( 'data-role' ) ] );
				} );

				// Hide the hex reference on update
				$( '#hex-reference' ).hide();

				ct.grid.trigger( 'color-change' );
				// Clear the object free to be used again
				palettes = {};

				// Hide the picker if it's visible
				ct.grid.find( '.selected' ).removeClass( 'selected' );
				ct.picker.hide();

				// Track featured palettes separately
				if ( $( this ).hasClass( 'featured' ) ) {
					// Stat: 'featured-palettes'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=featured-palettes&baba=' +
						Math.random();
				} else {
					// Stat: 'palettes'
					new Image().src =
						document.location.protocol +
						'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=palettes&baba=' +
						Math.random();
				}
			} );
		},
		/**
		 * Drag & Drop for main grid
		 */
		dragColor: function () {
			var ct = this,
				old,
				color,
				toSwap;

			if ( this.opts.isFreeMode ) {
				return;
			}

			// Allow colors on main grid to be draggable
			ct.color
				.draggable( {
					revert: true,
					revertDuration: 0,
					zIndex: 1000,
					cursor: 'move',
					// On drag-stop do the color swap
					stop: function ( event, ui ) {
						if ( ct.color.hasClass( 'color-swap' ) ) {
							// Store the original color
							old = ct.getColor( this );
							toSwap = ct.grid.find( '.color-swap' );
							color = ct.getColor( toSwap.get( 0 ) );

							ct.setColor( this, color );
							ct.setColor( toSwap.get( 0 ), old );
							// Clean the added class at the end
							toSwap.removeClass( 'color-swap' );

							ct.grid.trigger( 'color-change', toSwap.data( 'role' ) );

							// Stat: 'drag-color'
							new Image().src =
								document.location.protocol +
								'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=drag-color&baba=' +
								Math.random();
						}
					},
				} )
				.droppable( {
					tolerance: 'pointer',
					// If you drop a color on top of another, give that color a class
					drop: function ( event, ui ) {
						$( this ).addClass( 'color-swap' );
					},
				} );
		},
		addChangeListener: function () {
			var ct = this;

			// Binds to color-change
			ct.grid.on( 'color-change', function ( e, role ) {
				ct.setting( ct.currentPalette() );

				// Save the background color in the core custom background color setting too.
				if ( ct.status() == 'default' ) {
					api( 'background_color' ).set( '' );
				} else {
					api( 'background_color' ).set( ct.getColor( ct.grid.find( '.bg' ) ) );
				}

				// If the entire palette or background color has changed, reset the background image.
				if ( ! role || 'bg' == role ) {
					var backgroundImage = api( 'background_image' ).get();
					if (
						backgroundImage &&
						( backgroundImage.indexOf( 'colourlovers' ) != -1 ||
							backgroundImage === ct.opts.defaultImage ||
							backgroundImage === ct.origBackground )
					) {
						api( 'background_image' ).set( '' );
					}

					ct.bgPrompt
						.find( '.choose-color' )
						.css( 'background-color', ct.getColor( ct.grid.find( '.bg' ) ) );
				}

				// Reset the suggested patterns.
				ct.patterns = [];
				ct.patternIndex = 0;
				// Generates the matching patterns for the color changes
				ct.showBackgroundColorChangeOptions();
			} );
		},
		currentPalette: function () {
			var ct = this,
				colors = {};

			ct.grid.children().each( function ( i, val ) {
				colors[ $( this ).data( 'role' ) ] = ct.getColor( this );
			} );

			return colors;
		},
		showPalettes: function ( paletteIndex ) {
			var ct = this,
				palette_container = $( '#colourlovers-palettes' ).html( '' );

			// Construct the color palettes
			for ( var i = paletteIndex, _len = paletteIndex + 6; i < _len; i++ ) {
				var new_palette = $( '<ul/>' )
					.addClass( 'color-grid colour-lovers' )
					.attr( 'title', ct.opts.dragHelp );

				for ( var color_key in ct.palettes[ i ].colors ) {
					var new_color = $( '<li />' )
						.addClass( color_key )
						.attr( 'data-role', color_key )
						.text( '#' + ct.palettes[ i ].colors[ color_key ] );

					ct.setColor( new_color, ct.sanitizeHex( ct.palettes[ i ].colors[ color_key ] ) );

					new_palette.append( new_color );
				}

				// Check if the palette is theme generated or not
				// Only show the registered colors if it's less than five
				if ( ! $.isNumeric( ct.palettes[ i ].id ) ) {
					var availableColors = new Array(),
						length;

					new_palette.addClass( 'featured' );

					for ( var colors in ct.palettes[ i ].colors ) {
						if ( ct.palettes[ i ].colors[ colors ] ) {
							availableColors.push( ct.palettes[ i ].colors[ colors ] );
						}
					}

					length = availableColors.length;

					// Remove the empty li(s)
					if ( length < 5 ) {
						var colorsList = new_palette.find( 'li' );

						// Controls the display of the palettes
						new_palette.addClass( 'items-' + length );

						colorsList.each( function () {
							if ( $( this ).text() == '#' ) {
								$( this ).remove();
							}
						} );
					}
				}

				palette_container.append( new_palette );
			}

			// Single colors from each palete can be
			// individually dragged to the main grid.
			palette_container.find( 'li' ).draggable( {
				revert: true,
				revertDuration: 0,
				zIndex: 1000,
				helper: 'clone',
				cursor: 'move',
				cursorAt: { top: 25 / 2, left: 25 / 2 },
				start: function ( event, ui ) {
					// need to make the droppable areas more tolerant for clones.
					ct.color.droppable( 'option', 'tolerance', 'touch' );
				},
				stop: function ( event, ui ) {
					var toSwap;
					if ( ct.color.hasClass( 'color-swap' ) ) {
						toSwap = ct.grid.find( '.color-swap' );
						// Change the color
						ct.setColor( toSwap.get( 0 ), ct.getColor( this ) );
						// Clean the added class at the end
						toSwap.removeClass( 'color-swap' );
						// revert to default tolerance
						ct.color.droppable( 'option', 'tolerance', 'intersect' );
						ct.grid.trigger( 'color-change', toSwap.data( 'role' ) );
					}
				},
			} );

			// Display pagination when applicable
			if ( paletteIndex < this.palettes.length ) {
				$( '#more-palettes' ).show();
			} else {
				$( '#more-palettes' ).hide();
			}

			if ( paletteIndex > 0 ) {
				$( '#less-palettes' ).show();
			} else {
				$( '#less-palettes' ).hide();
			}

			this.paletteIndex = paletteIndex + 6;
		},
		showPatterns: function ( patternIndex ) {
			if ( ! patternIndex ) {
				patternIndex = 0;
			}

			var pageSize = this.patternPageSize,
				pattern_container = this.patternPicker.find( 'ul' ).html( '' );

			if ( patternIndex >= this.patterns.length ) {
				// No patterns to show.
				if ( this.fetchingPatterns ) {
					pattern_container.spin();
				}
				// Use the most popular patterns
				else {
					this.patterns = this.topPatterns;
				}
			} else {
				pattern_container.show();
				this.patternPicker.find( '.noresults' ).hide();

				// Merge with top patterns
				// and keep previous session patterns
				// instead of forcing top patterns
				this.topPatterns = this.opts.topPatterns;
				$.extend( this.topPatterns, this.patterns );
				this.patterns = this.topPatterns;
			}

			for (
				var i = patternIndex, _len = Math.min( patternIndex + pageSize, this.patterns.length );
				i < _len;
				i++
			) {
				var pattern = $( '<li/> ' ).addClass( 'pattern' );
				var pattern_link = $( '<a/>' ).addClass( 'thumbnail' );
				var pattern_image = $( '<img/>' )
					.attr( 'src', this.patterns[ i ].preview_image_url )
					.addClass( 'pattern' );
				pattern_link.data( 'customizeImageValue', pattern_image.attr( 'src' ) );
				pattern_link.append( pattern_image );
				pattern.append( pattern_link );
				pattern_container.append( pattern );
			}

			// If we have enough patterns show pagination
			if ( patternIndex < this.patterns.length - pageSize ) {
				$( '#more-patterns' ).show();
			} else {
				$( '#more-patterns' ).hide();
			}

			// Show back button when we navigate patterns
			if ( patternIndex > 0 ) {
				$( '#less-patterns' ).show();
			} else {
				$( '#less-patterns' ).hide();
			}

			if ( this.patterns.length == 0 ) {
				patternIndex = 0;
			} else {
				this.patternIndex = patternIndex + pageSize;
			}
		},

		// Displays a notice when you access the paid features
		buyNotice: function () {
			var ct = this,
				container = $( '.accordion-section-colors_manager_tool' );

			// If the element is already present, show it
			if ( $( '.buy-custom-design' ).length ) {
				$( '.buy-custom-design' ).show();
			} else {
				$( '.customizer-controls-slider .accordion-section-colors_manager_tool' ).append(
					ct.opts.buyMessage
				);

				// Close notice
				$( '.buy-custom-design .back-to-colors' ).on( 'click', function () {
					$( '.buy-custom-design' ).hide();
				} );
			}

			if ( container.length ) {
				$( '.buy-custom-design' ).height( container.height() );
			}
		},
	} );

	/* Helper */
	fetchImage = function ( url ) {
		var deferred = $.Deferred(),
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
			_.bindAll(
				this,
				'updateImage',
				'updateBgSize',
				'updateRectangleStyle',
				'showPickerBorder',
				'hidePickerBorder'
			);
			this.controller = this.options.controller;
			api.bind( 'change', this.updateImage );
			this.render();
		},
		updateImage: function ( control ) {
			var settings;

			if ( control && control.id.indexOf( 'background' ) !== 0 ) {
				return;
			}

			settings = api.get();
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
			var ratio = img.width / img.height,
				rW = this.rectangle.width(),
				rH = this.rectangle.height(),
				isPattern = img.width < rW || img.height < rH;

			if ( isPattern ) {
				this.currentBgSize = '50%';
			} else {
				var edge = rW / rH,
					isLong = ratio > edge;

				this.currentBgSize = isLong ? 'auto 100%' : '100% auto';
			}
		},
		updateRectangleStyle: function () {
			var settings = api.get();

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
			$( '#colourlovers-palettes-container' ).show();
			this.showPickerBorder();
		},
		toggleOptions: function () {
			var button = this.$el.find( '.button.background-options' ),
				v = this.optionsView;

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
			var button = this.$el.find( '.button.background-options' ),
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
					var attachment = this.frame.state().get( 'selection' ).first();
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
			var width = this.controller.picker.css( 'border-top-width' );
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
			return _.reduce(
				this._defaults,
				function ( acc, val, key ) {
					acc[ key ] = api( 'background_' + key ).get() || val;
					return acc;
				},
				{}
			);
		},
		render: function () {
			this.$el.html( this.template() );
			_.each(
				this.states(),
				function ( value, key ) {
					this.$el.find( 'input[name=' + key + '][value=' + value + ']' ).prop( 'checked', true );
				},
				this
			);
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
			var input = $( event.currentTarget ),
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
			var input = this.$el.find( '#underlying-color' ),
				label = this.$el.find( 'label[for=underlying-color]' ),
				target = this.$el.find( '.iris-container' ),
				ct = this.options.changeView.controller;

			label.css( 'background-color', api( 'background_color' ).get() );
			input.iris( {
				palettes: true,
				target: target,
				change: function ( event, ui ) {
					var color = ui.color.toString(),
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
				if ( 'background_color' == control.id ) {
					label.css( 'background-color', control._value );
				}
			} );
		},
	} );

	Backbone.on( 'custom-colors:stat', function ( bucket, stat ) {
		var url =
			document.location.protocol +
			'//stats.wordpress.com/g.gif?v=wpcom-no-pv&x_' +
			bucket +
			'=' +
			stat +
			'&baba=' +
			Math.random();
		new Image().src = url;
	} );

	// let's use it.
	api.controlConstructor.colorsTool = api.ColorsTool;
} )( wp, jQuery, _, undefined ); // Close closure. She sells sea shells.
