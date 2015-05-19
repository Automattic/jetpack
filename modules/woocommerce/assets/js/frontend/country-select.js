/*global wc_country_select_params */
jQuery( function( $ ) {

	// wc_country_select_params is required to continue, ensure the object exists
	if ( typeof wc_country_select_params === 'undefined' ) {
		return false;
	}

	function getEnhancedSelectFormatString() {
		var formatString = {
			formatMatches: function( matches ) {
				if ( 1 === matches ) {
					return wc_country_select_params.i18n_matches_1;
				}

				return wc_country_select_params.i18n_matches_n.replace( '%qty%', matches );
			},
			formatNoMatches: function() {
				return wc_country_select_params.i18n_no_matches;
			},
			formatAjaxError: function( jqXHR, textStatus, errorThrown ) {
				return wc_country_select_params.i18n_ajax_error;
			},
			formatInputTooShort: function( input, min ) {
				var number = min - input.length;

				if ( 1 === number ) {
					return wc_country_select_params.i18n_input_too_short_1;
				}

				return wc_country_select_params.i18n_input_too_short_n.replace( '%qty%', number );
			},
			formatInputTooLong: function( input, max ) {
				var number = input.length - max;

				if ( 1 === number ) {
					return wc_country_select_params.i18n_input_too_long_1;
				}

				return wc_country_select_params.i18n_input_too_long_n.replace( '%qty%', number );
			},
			formatSelectionTooBig: function( limit ) {
				if ( 1 === limit ) {
					return wc_country_select_params.i18n_selection_too_long_1;
				}

				return wc_country_select_params.i18n_selection_too_long_n.replace( '%qty%', limit );
			},
			formatLoadMore: function( pageNumber ) {
				return wc_country_select_params.i18n_load_more;
			},
			formatSearching: function() {
				return wc_country_select_params.i18n_searching;
			}
		};

		return formatString;
	}

	// Select2 Enhancement if it exists
	if ( $().select2 ) {
		var wc_country_select_select2 = function() {
			$( 'select.country_select:visible, select.state_select:visible' ).each( function() {
				var select2_args = $.extend({
					placeholder: $( this ).attr( 'placeholder' ),
					placeholderOption: 'first',
					width: '100%'
				}, getEnhancedSelectFormatString() );

				$( this ).select2( select2_args );
			});
		};

		wc_country_select_select2();

		$( 'body' ).bind( 'country_to_state_changed', function() {
			wc_country_select_select2();
		});
	}

	/* State/Country select boxes */
	var states_json = wc_country_select_params.countries.replace( /&quot;/g, '"' ),
		states = $.parseJSON( states_json );

	$( 'body' ).on( 'change', 'select.country_to_state, input.country_to_state', function() {

		var country = $( this ).val(),
			$statebox = $( this ).closest( 'div' ).find( '#billing_state, #shipping_state, #calc_shipping_state' ),
			$parent = $statebox.parent(),
			input_name = $statebox.attr( 'name' ),
			input_id = $statebox.attr( 'id' ),
			value = $statebox.val(),
			placeholder = $statebox.attr( 'placeholder' );

		if ( states[ country ] ) {
			if ( $.isEmptyObject( states[ country ] ) ) {

				$statebox.parent().hide().find( '.select2-container' ).remove();
				$statebox.replaceWith( '<input type="hidden" class="hidden" name="' + input_name + '" id="' + input_id + '" value="" placeholder="' + placeholder + '" />' );

				$( 'body' ).trigger( 'country_to_state_changed', [country, $( this ).closest( 'div' )] );

			} else {

				var options = '',
					state = states[ country ];

				for( var index in state ) {
					if ( state.hasOwnProperty( index ) ) {
						options = options + '<option value="' + index + '">' + state[ index ] + '</option>';
					}
				}

				$statebox.parent().show();

				if ( $statebox.is( 'input' ) ) {
					// Change for select
					$statebox.replaceWith( '<select name="' + input_name + '" id="' + input_id + '" class="state_select" placeholder="' + placeholder + '"></select>' );
					$statebox = $( this ).closest( 'div' ).find( '#billing_state, #shipping_state, #calc_shipping_state' );
				}

				$statebox.html( '<option value="">' + wc_country_select_params.i18n_select_state_text + '</option>' + options );
				$statebox.val( value ).change();

				$( 'body' ).trigger( 'country_to_state_changed', [country, $( this ).closest( 'div' )] );

			}
		} else {
			if ( $statebox.is( 'select' ) ) {

				$parent.show().find( '.select2-container' ).remove();
				$statebox.replaceWith( '<input type="text" class="input-text" name="' + input_name + '" id="' + input_id + '" placeholder="' + placeholder + '" />' );

				$( 'body' ).trigger( 'country_to_state_changed', [country, $( this ).closest( 'div' )] );

			} else if ( $statebox.is( '.hidden' ) ) {

				$parent.show().find( '.select2-container' ).remove();
				$statebox.replaceWith( '<input type="text" class="input-text" name="' + input_name + '" id="' + input_id + '" placeholder="' + placeholder + '" />' );

				$( 'body' ).trigger( 'country_to_state_changed', [country, $( this ).closest( 'div' )] );

			}
		}

		$( 'body' ).trigger( 'country_to_state_changing', [country, $( this ).closest( 'div' )] );

	});

	$(function() {
		$( ':input.country_to_state' ).change();
	});

});
