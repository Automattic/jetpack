/* global wp, _, _wpCustomizeSettings, Backbone */
( function ( wp, $, _ ) {
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
			ct.initPalettes();

			if ( ! api.isNux ) {
				ct.initPatterns();
			}
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
			let color;
			const picker = $( '#customize-control-header_textcolor' ).find( 'input.wp-color-picker' );

			if ( picker.wpColorPicker ) {
				picker.wpColorPicker( 'defaultColor' );

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

		initPatterns: function () {
			const ct = this;
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

					ct.coreBgImage( $( this ).data( 'customizeImageValue' ) );

					if ( ct.backgroundChangeView.optionsView ) {
						ct.backgroundChangeView.optionsView.render();
					}

					// Stat: 'patterns'
					new Image().src =
						document.location.protocol +
						'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=patterns&baba=' +
						Math.random();
				} )
				.on( 'click', '#less-patterns', function ( e ) {
					e.preventDefault();

					ct.showPatterns( ct.patternIndex - ct.patternPageSize * 2 );
				} )
				.on( 'click', '#more-patterns', function ( e ) {
					e.preventDefault();

					ct.handleMorePatternsClick();
				} );

			// Since the `overrideCoreBg()` may require wp.customize.state,
			// Ensure the execution order using `ready` bind.
			api.bind( 'ready', function () {
				ct.overrideCoreBg();
			} );
		},

		handleMorePatternsClick: function () {
			const ct = this;

			// Stat: 'more-patterns'
			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=more-patterns&baba=' +
				Math.random();

			if ( ct.patternIndex < ct.patterns.length ) {
				ct.showPatterns( ct.patternIndex );
			}

			if (
				( ! ct.fetchingPatterns && 0 === ct.patterns.length ) ||
				ct.patternIndex === ct.patterns.length - 5
			) {
				ct.fetchingPatterns = true;

				const query_arguments = {
					action: 'pattern_recommendations',
					limit: '30',
					offset: ct.patterns.length,
				};

				ct.color.each( function () {
					query_arguments[ 'colors[' + $( this ).data( 'role' ) + ']' ] = ct.getColor( this );
				} );

				$.get(
					wp.ajax.settings.url,
					query_arguments,
					function ( data ) {
						if ( ! data.patterns.length ) {
							$( '#more-patterns' ).hide();
						}

						$.merge( ct.patterns, data.patterns );

						ct.fetchingPatterns = false;

						if ( 0 === ct.patternIndex ) {
							ct.showPatterns();
						}
					},
					'json'
				);
			}
		},

		hideSectionAndKeepHidden: function ( id ) {
			const section = api.section( id );
			if ( ! section ) {
				return;
			}
			section.active( false );
			api.section.bind( 'change', function ( changed ) {
				if ( changed.id === id && changed.active() === true ) {
					section.active( false );
				}
			} );
		},

		initPalettes: function () {
			const ct = this;

			ct.colorPalettes();

			// hide core Colors & Background
			this.hideSectionAndKeepHidden( 'colors' );
			this.hideSectionAndKeepHidden( 'background_image' );

			const morePaletteClickHandler = function () {
				// Load palettes into a client-side cache 40 at a time
				// and refresh that cache one page before it's necessary.
				const lastIndex = Math.max( ct.palettes.length, ct.palettes.length - ct.palettesAtATime );
				if ( lastIndex > ct.paletteIndex ) {
					ct.showPalettes( ct.paletteIndex );
				}

				// Stat: 'more-palettes'
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=more-palettes&baba=' +
					Math.random();

				if (
					! ct.fetchingPalettes &&
					ct.paletteIndex >= ct.palettes.length - ct.palettesAtATime * 2
				) {
					ct.fetchingPalettes = true;
					$.get(
						wp.ajax.settings.url,
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
								0 === ct.paletteIndex ||
								ct.paletteIndex >= ct.palettes.length - data.palettes.length - ct.palettesAtATime
							) {
								morePaletteClickHandler();
							}
							ct.fetchingPalettes = false;
						},
						'json'
					);
				}
			};

			$( '#more-palettes' ).on( 'click', morePaletteClickHandler );
			morePaletteClickHandler();

			$( '#less-palettes' ).click( function () {
				ct.showPalettes( ct.paletteIndex - 2 * ct.palettesAtATime );
			} );

			// Calls generate palette code
			ct.generatePaletteFromHeader();
		},

		/**
		 * Generate a palette based on the current header image
		 * Uses the tonesque library for color sampling.
		 *
		 * @return {object} $generatePalette - the palette generator JQuery object.
		 */
		generatePaletteFromHeader: function () {
			let colors, cat;
			const ct = this,
				generatePalette = $( '#generate-palette' ),
				checkValidImage = function ( value ) {
					const badValues = [ 'remove-header', 'random-uploaded-image', 'random-default-image' ];
					if ( value && ! _.contains( badValues, value ) ) {
						ct.opts.headerImage = value;
						generatePalette.show();
						return true;
					}
					generatePalette.hide();
					return false;
				};

			// Initialize from API
			if ( ! api.settings.settings.header_image ) {
				return generatePalette.hide();
			}
			ct.opts.headerImage = api.settings.settings.header_image.value;

			// Actions for the "Match header image" button
			api.bind( 'change', function ( control ) {
				if ( 'header_image' === control.id ) {
					checkValidImage( control._value );
				}
			} );

			// Check that we have a header image
			// otherwise hide the button
			checkValidImage( ct.opts.headerImage );

			// Store button text
			const text = generatePalette.text();

			return generatePalette.on( 'click', function () {
				// Show processing message
				$( this ).text( ct.opts.genPalette );

				$.get(
					'/wp-admin/admin-ajax.php',
					{
						action: 'generate_palette',
						image: ct.opts.headerImage,
					},
					function ( data ) {
						colors = data.colors;

						if ( colors ) {
							ct.color.each( function () {
								let hex;
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
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=generate-palette&baba=' +
					Math.random();
			} );
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
						$( '#colourlovers-palettes-container' ).hide();
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

		showBackgroundColorChangeOptions: function () {
			if ( this.opts.themeSupport.customBackground ) {
				if ( 0 === this.patterns.length ) {
					// Populates the patterns for the matching palette
					this.handleMorePatternsClick();
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
			let palettes = {},
				color,
				role;
			const ct = this;

			$( '#colourlovers-palettes' ).on( 'click', '.colour-lovers', function () {
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
				ct.color.each( function () {
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
						'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=featured-palettes&baba=' +
						Math.random();
				} else {
					// Stat: 'palettes'
					new Image().src =
						document.location.protocol +
						'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_customizer-colors-actions=palettes&baba=' +
						Math.random();
				}
			} );
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

				// Reset the suggested patterns.
				ct.patterns = [];
				ct.patternIndex = 0;
				// Generates the matching patterns for the color changes
				ct.showBackgroundColorChangeOptions();
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
		showPalettes: function ( paletteIndex ) {
			const ct = this,
				palette_container = $( '#colourlovers-palettes' ).html( '' );

			// Construct the color palettes
			for ( let i = paletteIndex, _len = paletteIndex + 6; i < _len; i++ ) {
				if ( undefined === ct.palettes[ i ] ) {
					continue;
				}
				const new_palette = $( '<ul/>' ).addClass( 'color-grid colour-lovers' );

				for ( const color_key in ct.palettes[ i ].colors ) {
					const new_color = $( '<li />' )
						.addClass( color_key )
						.attr( 'data-role', color_key )
						.text( '#' + ct.palettes[ i ].colors[ color_key ] );

					ct.setColor( new_color, ct.sanitizeHex( ct.palettes[ i ].colors[ color_key ] ) );

					new_palette.append( new_color );
				}

				// Check if the palette is theme generated or not
				// Only show the registered colors if it's less than five
				if ( ! $.isNumeric( ct.palettes[ i ].id ) ) {
					const availableColors = new Array();

					new_palette.addClass( 'featured' );

					for ( const colors in ct.palettes[ i ].colors ) {
						if ( ct.palettes[ i ].colors[ colors ] ) {
							availableColors.push( ct.palettes[ i ].colors[ colors ] );
						}
					}

					const length = availableColors.length;

					// Remove the empty li(s)
					if ( length < 5 ) {
						const colorsList = new_palette.find( 'li' );

						// Controls the display of the palettes
						new_palette.addClass( 'items-' + length );

						colorsList.each( function () {
							if ( $( this ).text() === '#' ) {
								$( this ).remove();
							}
						} );
					}
				}

				palette_container.append( new_palette );
			}

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

			const pageSize = this.patternPageSize,
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
				let i = patternIndex, _len = Math.min( patternIndex + pageSize, this.patterns.length );
				i < _len;
				i++
			) {
				const pattern = $( '<li/> ' ).addClass( 'pattern' );
				const pattern_link = $( '<a/>' ).addClass( 'thumbnail' );
				const pattern_image = $( '<img/>' )
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

			if ( this.patterns.length === 0 ) {
				patternIndex = 0;
			} else {
				this.patternIndex = patternIndex + pageSize;
			}
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
			$( '#colourlovers-palettes-container' ).show();
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
} )( wp, jQuery, _ ); // Close closure. She sells sea shells.
