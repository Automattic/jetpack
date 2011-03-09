(function($) {
	$( document ).ready(function() {
		function enable_share_button() {
			$( '.preview a.sharing-anchor' ).unbind( 'mouseenter mouseenter' ).hover( function() {
				if ( $( this ).data( 'hasappeared' ) !== true ) {
					var item     = $( this ).parents( 'li:first' ).find( '.inner' );
					var original = $( this ).parents( '.share-custom' );
					
					// Create a timer to make the area appear if the mouse hovers for a period
					var timer = setTimeout( function() {
	
						$( item ).css( {
							left: $( original ).position().left + 'px',
							top: $( original ).position().top + $( original ).height() + 3 + 'px'
						} ).slideDown( 200, function() {
							// Mark the item as have being appeared by the hover
							$( original ).data( 'hasappeared', true ).data( 'hasoriginal', true ).data( 'hasitem', false );
							
							// Remove all special handlers
							$( item ).mouseleave( handler_item_leave ).mouseenter( handler_item_enter );
							$( original ).mouseleave( handler_original_leave ).mouseenter( handler_original_enter );
							
							// Add a special handler to quickly close the item
							$( original ).click( close_it );
						} );
						
						// The following handlers take care of the mouseenter/mouseleave for the share button and the share area - if both are left then we close the share area
						var handler_item_leave = function() {
							$( original ).data( 'hasitem', false );
							
							if ( $( original ).data( 'hasoriginal' ) === false ) {
								var timer = setTimeout( close_it, 800 );
								$( original ).data( 'timer2', timer );
							}
						};
	
						var handler_item_enter = function() {
							$( original ).data( 'hasitem', true );
							clearTimeout( $( original ).data( 'timer2' ) );
						} 
						
						var handler_original_leave = function() {
							$( original ).data( 'hasoriginal', false );
							
							if ( $( original ).data( 'hasitem' ) === false ) {
								var timer = setTimeout( close_it, 800 );
								$( original ).data( 'timer2', timer );
							}
						};
						
						var handler_original_enter = function() {
							$( original ).data( 'hasoriginal', true );
							clearTimeout( $( original ).data( 'timer2' ) );
						};
		
						var close_it = function() {
							item.slideUp( 200 );
	
							// Clear all hooks
							$( original ).unbind( 'mouseleave', handler_original_leave ).unbind( 'mouseenter', handler_original_enter );
							$( item ).unbind( 'mouseleave', handler_item_leave ).unbind( 'mouseenter', handler_item_leave );
							$( original ).data( 'hasappeared', false );
							$( original ).unbind( 'click', close_it );
							return false;
						};
					}, 200 );
					
					// Remember the timer so we can detect it on the mouseout
					$( this ).data( 'timer', timer );
				}
			}, function() {
				// Mouse out - remove any timer
				clearTimeout( $( this ).data( 'timer' ) );
				$( this ).data( 'timer', false );
			} );
		}
		
		function update_preview() {
			var item;
			
			// Clear the live preview
			$( '#live-preview ul.preview li' ).remove();
			
			// Add label
			if ( $( '#save-enabled-shares input[name=visible]' ).val() != '' || $( '#save-enabled-shares input[name=hidden]' ).val() != '' )
				$( '#live-preview ul.preview' ).append( $( '#live-preview ul.archive .sharing-label' ).clone() );

			// Re-insert all the enabled items
			$( 'ul.services-enabled li' ).each( function() {
				if ( $( this ).hasClass( 'service' ) ) {
					var service = $( this ).attr( 'id' );

					$( '#live-preview ul.preview' ).append( $( '#live-preview ul.archive .preview-' + service ).clone() );
				}
			} );
			
			// Add any preview items
			if ( $( '#save-enabled-shares input[name=hidden]' ).val() != '' ) {
				// Add share button
				$( '#live-preview ul.preview' ).append( $( '#live-preview ul.archive .share-custom' ).clone() );
				$( '#live-preview ul.preview li.share-custom ul li' ).remove();
				
				// Add rest of the items
				$( 'ul.services-hidden li' ).each( function( pos, item ) {
					if ( $( this ).hasClass( 'service' ) ) {
						var service = $( this ).attr( 'id' );
						
						$( '#live-preview ul.preview li.share-custom ul' ).append( $( '#live-preview ul.archive .preview-' + service ).clone() );
						
						if ( pos % 2 == 1 )
							$( '#live-preview ul.preview li.share-custom ul' ).append( '<li class="share-end"></div>' );
					}
				} );
				
				enable_share_button();
			}

			// Button style
			if ( $( 'select[name=button_style]' ).val() == 'icon' )
				$( '#live-preview ul.preview .option' ).html( '&nbsp;' );   // Remove the text
			else if ( $( 'select[name=button_style]' ).val() == 'text' ) {
				$( '#live-preview ul.preview li.advanced' ).each( function() {
					if ( $( this ).find( '.option' ).hasClass( 'option-smart-on' ) === false && $( this ).find( '.option' ).hasClass( 'option-smart-like' ) === false )
						$( this ).attr( 'class', 'advanced preview-item' );
				} );
			}
		}

		function sharing_option_changed() {
			var item = this;

			// Loading icon
			$( this ).parents( 'li:first' ).css( 'backgroundImage', 'url("' + sharing_loading_icon + '")' );
			
			// Save
			$( this ).parents( 'form' ).ajaxSubmit( function( response ) {
				if ( response.indexOf( '<!---' ) >= 0 ) {
					var button = response.substring( 0, response.indexOf( '<!--->' ) );
					var preview = response.substring( response.indexOf( '<!--->' ) + 6 );
				
					if ( $( item ).is( ':submit' ) === true ) {
						// Update the DOM using a bit of cut/paste technology
		
						$( item ).parents( 'li:first' ).replaceWith( button );
							
						init_handlers();
					}

					$( '#live-preview ul.archive li.preview-' + $( item ).parents( 'form' ).find( 'input[name=service]' ).val() ).replaceWith( preview );
				}
				
				// Update preview
				update_preview();
				
				// Restore the icon
				$( item ).parents( 'li:first' ).removeAttr( 'style' );
			} );

			if ( $( item ).is( ':submit' ) === true )
				return false;
			return true;
		}

		function save_services() {
			$( '#enabled-services h3 img' ).show();
			
			// Update the display to reflect the changes
			$( '#enabled-services li' ).addClass( 'options' );
			$( '#available-services li' ).removeClass( 'options' );

			// Toggle various dividers/help texts
			if ( $( '#enabled-services ul.services-enabled li.service' ).length > 0 ) {
				$( '#drag-instructions' ).hide();
			}
			else {
				$( '#drag-instructions' ).show();
			}
			
			if ( $( '#enabled-services li.service' ).length > 0 ) {
				$( '#live-preview .services h2' ).hide();
			}
			else {
				$( '#live-preview .services h2' ).show();
			}
			
			// Gather the modules
			var visible = [], hidden = [];
			
			$( 'ul.services-enabled li' ).each( function() {
				if ( $( this ).hasClass( 'service' ) ) {
					// Ready for saving
					visible[visible.length] = $( this ).attr( 'id' );
				}
			} );

			$( 'ul.services-hidden li' ).each( function() {
				if ( $( this ).hasClass( 'service' ) ) {
					// Ready for saving
					hidden[hidden.length] = $( this ).attr( 'id' );
				}
			} );

			// Set the hidden element values
			$( '#save-enabled-shares input[name=visible]' ).val( visible.join( ',' ) );
			$( '#save-enabled-shares input[name=hidden]' ).val( hidden.join( ',' ) );
			
			update_preview();
			
			// Save it
			$( '#save-enabled-shares' ).ajaxSubmit( function() {
				$( '#enabled-services h3 img' ).hide();
			} );
		}

		$( '#enabled-services .services ul' ).sortable( {
			receive: function( event, ui ) {
				save_services();
			},
			stop: function() {
				save_services();
				$( 'li.service' ).enableSelection();   // Fixes a problem with Chrome
			},
			over: function( event, ui ) {
				$( this ).find( 'ul' ).addClass( 'dropping' );

				// Ensure the 'end-fix' is at the end
				$( '#enabled-services li.end-fix' ).remove()
				$( '#enabled-services ul' ).append( '<li class="end-fix"></li>' );
			},
			out: function( event, ui ) {
				$( this ).find( 'ul' ).removeClass( 'dropping' );

				// Ensure the 'end-fix' is at the end
				$( '#enabled-services li.end-fix' ).remove()
				$( '#enabled-services ul' ).append( '<li class="end-fix"></li>' );
			},
			helper: function( event, ui ) {
				ui.find( '.advanced-form' ).hide();
				
				return ui.clone();
			},
			start: function( event, ui ) {
				// Make sure that the advanced section is closed
				$( '.advanced-form' ).hide();
				$( 'li.service' ).disableSelection();   // Fixes a problem with Chrome
			},
			placeholder: 'dropzone',
			opacity: 0.8,
			delay: 150,
			forcePlaceholderSize: true,
			items: 'li',
			connectWith: '#available-services ul, #enabled-services .services ul',
			cancel: '.advanced-form'
		} );

		$( '#available-services ul' ).sortable( {
			opacity: 0.8,
			delay: 150,
			cursor: 'move',
			connectWith: '#enabled-services .services ul',
			placeholder: 'dropzone',
			forcePlaceholderSize: true,
			start: function() {
				$( '.advanced-form' ).hide();
			}
		} );
		
		// Advanced options toggle
		$( '.options-toggle' ).live( 'click', function() {
			var was_visible = $( this ).parents( 'li:first' ).find( '.advanced-form' ).is( ':visible' );
			
			// Hide everything
			$( '.advanced-form' ).slideUp( 200 );

			if ( !was_visible )
				$( this ).parents( 'li:first' ).find( '.advanced-form' ).slideDown( 200 );
		} );
		
		// Live preview 'hidden' button
		$( '.preview-hidden a' ).click( function() {
			$( this ).parent().find( '.preview' ).toggle();
			return false;
		} );
		
		// Add service
		$( '#new-service form' ).ajaxForm( {
				beforeSubmit: function() {
					$( '#new-service-form .error' ).hide();
					$( '#new-service-form img' ).show();
					$( '#new-service-form input[type=submit]' ).attr( 'disabled', true );
				},
				success: function( response ) {
					$( '#new-service-form img' ).hide();
					
					if ( response == '1' ) {
						$( '#new-service-form .inerror' ).removeClass( 'inerror' ).addClass( 'error' );
						$( '#new-service-form .error' ).show();
						$( '#new-service-form input[type=submit]' ).attr( 'disabled', false );
					}
					else {
						document.location.reload();
					}
				}
			}
		);
		
		function init_handlers() {
			// Hook up all advanced options
			$( '.advanced-form form input[type=checkbox]' ).unbind( 'click' ).click( sharing_option_changed );
			$( '.advanced-form form select' ).unbind( 'change' ).change( sharing_option_changed );
			$( '.advanced-form form input[type=submit]' ).unbind( 'click' ).click( sharing_option_changed );
			
			$( '.advanced-form form a.remove' ).unbind( 'click' ).click( function() {
				var form = $( this ).parents( 'form' );
				
				form.find( 'input[name=action]' ).val( 'sharing_delete_service' );
	
				// Loading icon
				$( this ).parents( 'li:first' ).css( 'backgroundImage', 'url("' + sharing_loading_icon + '")' );
				
				// Save
				$( this ).parents( 'form' ).ajaxSubmit( function( response ) {
					// Remove the item
					form.parents( 'li:first' ).fadeOut( function() {
						$( this ).remove();
						
						// Update preview
						update_preview();
					} );
				} );
				
				return false;
			} );
		}
		
		$( 'select[name=button_style]' ).change( function() {
			update_preview();
			return true;
		} );
		
		$( 'input[name=sharing_label]' ).blur( function() {
			$('#live-preview ul.preview li.sharing-label').html( $( '<div/>' ).text( $( this ).val() ).html() );
		} );
		
		init_handlers();
		enable_share_button();
	} );
})( jQuery );
