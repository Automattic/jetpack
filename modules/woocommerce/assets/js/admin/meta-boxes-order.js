/*global woocommerce_admin_meta_boxes, woocommerce_admin, accounting */
jQuery( function ( $ ) {

	/**
	 * Order Data Panel
	 */
	var wc_meta_boxes_order = {
		states: null,
		init: function() {
			if ( ! ( typeof woocommerce_admin_meta_boxes_order === 'undefined' || typeof woocommerce_admin_meta_boxes_order.countries === 'undefined' ) ) {
				/* State/Country select boxes */
				this.states = $.parseJSON( woocommerce_admin_meta_boxes_order.countries.replace( /&quot;/g, '"' ) );
			}

			$( '.js_field-country' ).select2().change( this.change_country );
			$( '.js_field-country' ).trigger( 'change', [ true ] );
			$( 'body' ).on( 'change', 'select.js_field-state', this.change_state );
			$( '#woocommerce-order-actions input, #woocommerce-order-actions a' ).click(function() {
				window.onbeforeunload = '';
			});
			$( 'a.edit_address' ).click( this.edit_address );
			$( 'button.billing-same-as-shipping' ).on( 'click', this.copy_billing_to_shipping );
			$( 'button.load_customer_billing' ).on( 'click', this.load_billing );
			$( 'button.load_customer_shipping' ).on( 'click', this.load_shipping );
		},

		change_country: function( e, stickValue ) {
			// Check for stickValue before using it
			if ( typeof stickValue === 'undefined' ){
				stickValue = false;
			}

			// Prevent if we don't have the metabox data
			if ( wc_meta_boxes_order.states === null ){
				return;
			}

			var $this = $( this ),
				country = $this.val(),
				$state = $this.parents( '.edit_address' ).find( ':input.js_field-state' ),
				$parent = $state.parent(),
				input_name = $state.attr( 'name' ),
				input_id = $state.attr( 'id' ),
				value = $this.data( 'woocommerce.stickState-' + country ) ? $this.data( 'woocommerce.stickState-' + country ) : $state.val(),
				placeholder = $state.attr( 'placeholder' );

			if ( stickValue ){
				$this.data( 'woocommerce.stickState-' + country, value );
			}

			// Remove the previous DOM element
			$parent.show().find( '.select2-container' ).remove();

			if ( ! $.isEmptyObject( wc_meta_boxes_order.states[ country ] ) ) {
				var $states_select = $( '<select name="' + input_name + '" id="' + input_id + '" class="js_field-state select short" placeholder="' + placeholder + '"></select>' ),
					state = wc_meta_boxes_order.states[ country ];

				$states_select.append( $( '<option value="">' + woocommerce_admin_meta_boxes_order.i18n_select_state_text + '</option>' ) );

				$.each( state, function( index, name ) {
					$states_select.append( $( '<option value="' + index + '">' + state[ index ] + '</option>' ) );
				} );

				$states_select.val( value );

				$state.replaceWith( $states_select );

				$states_select.show().select2().hide().change();
			} else {
				$state.replaceWith( '<input type="text" class="js_field-state" name="' + input_name + '" id="' + input_id + '" value="' + value + '" placeholder="' + placeholder + '" />' );
			}

			$( 'body' ).trigger( 'contry-change.woocommerce', [country, $( this ).closest( 'div' )] );
		},

		change_state: function() {
			// Here we will find if state value on a select has changed and stick it to the country data
			var $this = $( this ),
				state = $this.val(),
				$country = $this.parents( '.edit_address' ).find( ':input.js_field-country' ),
				country = $country.val();

			$country.data( 'woocommerce.stickState-' + country, state );
		},

		init_tiptip: function() {
			$( '#tiptip_holder' ).removeAttr( 'style' );
			$( '#tiptip_arrow' ).removeAttr( 'style' );
			$( '.tips' ).tipTip({
				'attribute': 'data-tip',
				'fadeIn': 50,
				'fadeOut': 50,
				'delay': 200
			});
		},

		edit_address: function( e ) {
			e.preventDefault();
			$( this ).hide();
			$( this ).closest( '.order_data_column' ).find( 'div.address' ).hide();
			$( this ).closest( '.order_data_column' ).find( 'div.edit_address' ).show();
		},

		load_billing: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.load_billing ) ) {

				// Get user ID to load data for
				var user_id = $( '#customer_user' ).val();

				if ( ! user_id ) {
					window.alert( woocommerce_admin_meta_boxes.no_customer_selected );
					return false;
				}

				var data = {
					user_id:      user_id,
					type_to_load: 'billing',
					action:       'woocommerce_get_customer_details',
					security:     woocommerce_admin_meta_boxes.get_customer_details_nonce
				};

				$( this ).closest( '.edit_address' ).block({
					message: null,
					overlayCSS: {
						background: '#fff',
						opacity: 0.6
					}
				});

				$.ajax({
					url: woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						var info = response;

						if ( info ) {
							$( 'input#_billing_first_name' ).val( info.billing_first_name ).change();
							$( 'input#_billing_last_name' ).val( info.billing_last_name ).change();
							$( 'input#_billing_company' ).val( info.billing_company ).change();
							$( 'input#_billing_address_1' ).val( info.billing_address_1 ).change();
							$( 'input#_billing_address_2' ).val( info.billing_address_2 ).change();
							$( 'input#_billing_city' ).val( info.billing_city ).change();
							$( 'input#_billing_postcode' ).val( info.billing_postcode ).change();
							$( '#_billing_country' ).val( info.billing_country ).change();
							$( '#_billing_state' ).val( info.billing_state ).change();
							$( 'input#_billing_email' ).val( info.billing_email ).change();
							$( 'input#_billing_phone' ).val( info.billing_phone ).change();
						}

						$( '.edit_address' ).unblock();
					}
				});
			}
			return false;
		},

		load_shipping: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.load_shipping ) ) {

				// Get user ID to load data for
				var user_id = $( '#customer_user' ).val();

				if ( ! user_id ) {
					window.alert( woocommerce_admin_meta_boxes.no_customer_selected );
					return false;
				}

				var data = {
					user_id:      user_id,
					type_to_load: 'shipping',
					action:       'woocommerce_get_customer_details',
					security:     woocommerce_admin_meta_boxes.get_customer_details_nonce
				};

				$( this ).closest( '.edit_address' ).block({
					message: null,
					overlayCSS: {
						background: '#fff',
						opacity: 0.6
					}
				});

				$.ajax({
					url: woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						var info = response;

						if ( info ) {
							$( 'input#_shipping_first_name' ).val( info.shipping_first_name ).change();
							$( 'input#_shipping_last_name' ).val( info.shipping_last_name ).change();
							$( 'input#_shipping_company' ).val( info.shipping_company ).change();
							$( 'input#_shipping_address_1' ).val( info.shipping_address_1 ).change();
							$( 'input#_shipping_address_2' ).val( info.shipping_address_2 ).change();
							$( 'input#_shipping_city' ).val( info.shipping_city ).change();
							$( 'input#_shipping_postcode' ).val( info.shipping_postcode ).change();
							$( '#_shipping_country' ).val( info.shipping_country ).change();
							$( '#_shipping_state' ).val( info.shipping_state ).change();
						}

						$( '.edit_address' ).unblock();
					}
				});
			}
			return false;
		},

		copy_billing_to_shipping: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.copy_billing ) ) {
				$( 'input#_shipping_first_name' ).val( $( 'input#_billing_first_name' ).val() ).change();
				$( 'input#_shipping_last_name' ).val( $( 'input#_billing_last_name' ).val() ).change();
				$( 'input#_shipping_company' ).val( $( 'input#_billing_company' ).val() ).change();
				$( 'input#_shipping_address_1' ).val( $( 'input#_billing_address_1' ).val() ).change();
				$( 'input#_shipping_address_2' ).val( $( 'input#_billing_address_2' ).val() ).change();
				$( 'input#_shipping_city' ).val( $( 'input#_billing_city' ).val() ).change();
				$( 'input#_shipping_postcode' ).val( $( 'input#_billing_postcode' ).val() ).change();
				$( '#_shipping_country' ).val( $( '#_billing_country' ).val() ).change();
				$( '#_shipping_state' ).val( $( '#_billing_state' ).val() ).change();
			}
			return false;
		}
	}

	/**
	 * Order Items Panel
	 */
	var wc_meta_boxes_order_items = {
		init: function() {
			this.stupidtable.init();

			$( '#woocommerce-order-items' )
				.on( 'click', 'button.add-line-item', this.add_line_item )
				.on( 'click', 'button.refund-items', this.refund_items )
				.on( 'click', '.cancel-action', this.cancel )
				.on( 'click', 'button.add-order-item', this.add_item )
				.on( 'click', 'button.add-order-fee', this.add_fee )
				.on( 'click', 'button.add-order-shipping', this.add_shipping )
				.on( 'click', 'button.add-order-tax', this.add_tax )
				.on( 'click', 'input.check-column', this.bulk_actions.check_column )
				.on( 'click', '.do_bulk_action', this.bulk_actions.do_bulk_action )
				.on( 'click', 'button.calculate-action', this.calculate_totals )
				.on( 'click', 'button.save-action', this.save_line_items )
				.on( 'click', 'a.delete-order-tax', this.delete_tax )
				.on( 'click', 'button.calculate-tax-action', this.calculate_tax )
				.on( 'click', 'a.edit-order-item', this.edit_item )
				.on( 'click', 'a.delete-order-item', this.delete_item )

				// Refunds
				.on( 'click', '.delete_refund', this.refunds.delete_refund )
				.on( 'click', 'button.do-api-refund, button.do-manual-refund', this.refunds.do_refund )
				.on( 'change', '.refund input.refund_line_total, .refund input.refund_line_tax', this.refunds.input_changed )
				.on( 'change keyup', '.wc-order-refund-items #refund_amount', this.refunds.amount_changed )
				.on( 'change', 'input.refund_order_item_qty', this.refunds.refund_quantity_changed )

				// Qty
				.on( 'change', 'input.quantity', this.quantity_changed )

				// Subtotal/total
				.on( 'keyup', '.woocommerce_order_items .split-input input:eq(0)', function() {
					var $subtotal = $( this ).next();
					if ( $subtotal.val() === '' || $subtotal.is( '.match-total' ) ) {
						$subtotal.val( $( this ).val() ).addClass( 'match-total' );
					}
				})

				.on( 'keyup', '.woocommerce_order_items .split-input input:eq(1)', function() {
					$( this ).removeClass( 'match-total' );
				})

				// Meta
				.on( 'click', 'button.add_order_item_meta', this.item_meta.add )
				.on( 'click', 'button.remove_order_item_meta', this.item_meta.remove );

			$( 'body' )
				.on( 'wc_backbone_modal_loaded', this.backbone.init )
				.on( 'wc_backbone_modal_response', this.backbone.response );
		},

		block: function() {
			$( '#woocommerce-order-items' ).block({
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			});
		},

		unblock: function() {
			$( '#woocommerce-order-items' ).unblock();
		},

		reload_items: function() {
			var data = {
				order_id: woocommerce_admin_meta_boxes.post_id,
				action:   'woocommerce_load_order_items',
				security: woocommerce_admin_meta_boxes.order_item_nonce
			};

			wc_meta_boxes_order_items.block();

			$.ajax({
				url:  woocommerce_admin_meta_boxes.ajax_url,
				data: data,
				type: 'POST',
				success: function( response ) {
					$( '#woocommerce-order-items .inside' ).empty();
					$( '#woocommerce-order-items .inside' ).append( response );
					wc_meta_boxes_order.init_tiptip();
					wc_meta_boxes_order_items.unblock();
					wc_meta_boxes_order_items.stupidtable.init();
				}
			});
		},

		// When the qty is changed, increase or decrease costs
		quantity_changed: function() {
			var $row          = $( this ).closest( 'tr.item' );
			var qty           = $( this ).val();
			var o_qty         = $( this ).attr( 'data-qty' );
			var line_total    = $( 'input.line_total', $row );
			var line_subtotal = $( 'input.line_subtotal', $row );

			// Totals
			var unit_total = accounting.unformat( line_total.attr( 'data-total' ), woocommerce_admin.mon_decimal_point ) / o_qty;
			line_total.val(
				parseFloat( accounting.formatNumber( unit_total * qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
					.toString()
					.replace( '.', woocommerce_admin.mon_decimal_point )
			);

			var unit_subtotal = accounting.unformat( line_subtotal.attr( 'data-subtotal' ), woocommerce_admin.mon_decimal_point ) / o_qty;
			line_subtotal.val(
				parseFloat( accounting.formatNumber( unit_subtotal * qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
					.toString()
					.replace( '.', woocommerce_admin.mon_decimal_point )
			);

			// Taxes
			$( 'td.line_tax', $row ).each(function() {
				var line_total_tax = $( 'input.line_tax', $( this ) );
				var unit_total_tax = accounting.unformat( line_total_tax.attr( 'data-total_tax' ), woocommerce_admin.mon_decimal_point ) / o_qty;
				if ( 0 < unit_total_tax ) {
					line_total_tax.val(
						parseFloat( accounting.formatNumber( unit_total_tax * qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
							.toString()
							.replace( '.', woocommerce_admin.mon_decimal_point )
					);
				}

				var line_subtotal_tax = $( 'input.line_subtotal_tax', $( this ) );
				var unit_subtotal_tax = accounting.unformat( line_subtotal_tax.attr( 'data-subtotal_tax' ), woocommerce_admin.mon_decimal_point ) / o_qty;
				if ( 0 < unit_subtotal_tax ) {
					line_subtotal_tax.val(
						parseFloat( accounting.formatNumber( unit_subtotal_tax * qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
							.toString()
							.replace( '.', woocommerce_admin.mon_decimal_point )
					);
				}
			});

			$( this ).trigger( 'quantity_changed' );
		},

		add_line_item: function() {
			$( 'div.wc-order-add-item' ).slideDown();
			$( 'div.wc-order-bulk-actions' ).slideUp();
			return false;
		},

		refund_items: function() {
			$( 'div.wc-order-refund-items' ).slideDown();
			$( 'div.wc-order-bulk-actions' ).slideUp();
			$( 'div.wc-order-totals-items' ).slideUp();
			$( '#woocommerce-order-items div.refund' ).show();
			$( '.wc-order-edit-line-item .wc-order-edit-line-item-actions' ).hide();
			return false;
		},

		cancel: function() {
			$( this ).closest( 'div.wc-order-data-row' ).slideUp();
			$( 'div.wc-order-bulk-actions' ).slideDown();
			$( 'div.wc-order-totals-items' ).slideDown();
			$( '#woocommerce-order-items div.refund' ).hide();
			$( '.wc-order-edit-line-item .wc-order-edit-line-item-actions' ).show();

			// Reload the items
			if ( 'true' === $( this ).attr( 'data-reload' ) ) {
				wc_meta_boxes_order_items.reload_items();
			}

			return false;
		},

		add_item: function() {
			$( this ).WCBackboneModal({
				template: '#wc-modal-add-products'
			});

			return false;
		},

		add_fee: function() {
			wc_meta_boxes_order_items.block();

			var data = {
				action:   'woocommerce_add_order_fee',
				order_id: woocommerce_admin_meta_boxes.post_id,
				security: woocommerce_admin_meta_boxes.order_item_nonce
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
				$( 'table.woocommerce_order_items tbody#order_fee_line_items' ).append( response );
				wc_meta_boxes_order_items.unblock();
			});

			return false;
		},

		add_shipping: function() {
			wc_meta_boxes_order_items.block();

			var data = {
				action:   'woocommerce_add_order_shipping',
				order_id: woocommerce_admin_meta_boxes.post_id,
				security: woocommerce_admin_meta_boxes.order_item_nonce
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
				$( 'table.woocommerce_order_items tbody#order_shipping_line_items' ).append( response );
				wc_meta_boxes_order_items.unblock();
			});

			return false;
		},

		add_tax: function() {
			$( this ).WCBackboneModal({
				template: '#wc-modal-add-tax'
			});
			return false;
		},

		edit_item: function() {
			$( this ).closest( 'tr' ).find( '.view' ).hide();
			$( this ).closest( 'tr' ).find( '.edit' ).show();
			$( this ).hide();
			$( 'button.add-line-item' ).click();
			$( 'button.cancel-action' ).attr( 'data-reload', true );
			return false;
		},

		delete_item: function() {
			var answer = window.confirm( woocommerce_admin_meta_boxes.remove_item_notice );

			if ( answer ) {
				var $item         = $( this ).closest( 'tr.item, tr.fee, tr.shipping' );
				var order_item_id = $item.attr( 'data-order_item_id' );

				wc_meta_boxes_order_items.block();

				var data = {
					order_item_ids: order_item_id,
					action:         'woocommerce_remove_order_item',
					security:       woocommerce_admin_meta_boxes.order_item_nonce
				};

				$.ajax({
					url:     woocommerce_admin_meta_boxes.ajax_url,
					data:    data,
					type:    'POST',
					success: function( response ) {
						$item.remove();
						wc_meta_boxes_order_items.unblock();
					}
				});
			}
			return false;
		},

		delete_tax: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.i18n_delete_tax ) ) {
				wc_meta_boxes_order_items.block();

				var data = {
					action:   'woocommerce_remove_order_tax',
					rate_id:  $( this ).attr( 'data-rate_id' ),
					order_id: woocommerce_admin_meta_boxes.post_id,
					security: woocommerce_admin_meta_boxes.order_item_nonce
				};

				$.ajax({
					url:  woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						$( '#woocommerce-order-items .inside' ).empty();
						$( '#woocommerce-order-items .inside' ).append( response );
						wc_meta_boxes_order.init_tiptip();
						wc_meta_boxes_order_items.unblock();
						wc_meta_boxes_order_items.stupidtable.init();
					}
				});
			}
			return false;
		},

		calculate_tax: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.calc_line_taxes ) ) {
				wc_meta_boxes_order_items.block();

				var shipping_country = $( '#_shipping_country' ).val();
				var billing_country  = $( '#_billing_country' ).val();
				var country          = woocommerce_admin_meta_boxes.base_country;
				var state            = '';
				var postcode         = '';
				var city             = '';

				if ( shipping_country ) {
					country  = shipping_country;
					state    = $( '#_shipping_state' ).val();
					postcode = $( '#_shipping_postcode' ).val();
					city     = $( '#_shipping_city' ).val();
				} else if ( billing_country ) {
					country  = billing_country;
					state    = $( '#_billing_state' ).val();
					postcode = $( '#_billing_postcode' ).val();
					city     = $( '#_billing_city' ).val();
				}

				var data = {
					action:   'woocommerce_calc_line_taxes',
					order_id: woocommerce_admin_meta_boxes.post_id,
					items:    $( 'table.woocommerce_order_items :input[name], .wc-order-totals-items :input[name]' ).serialize(),
					country:  country,
					state:    state,
					postcode: postcode,
					city:     city,
					security: woocommerce_admin_meta_boxes.calc_totals_nonce
				};

				$.ajax({
					url:  woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						$( '#woocommerce-order-items .inside' ).empty();
						$( '#woocommerce-order-items .inside' ).append( response );
						wc_meta_boxes_order.init_tiptip();
						wc_meta_boxes_order_items.unblock();
						wc_meta_boxes_order_items.stupidtable.init();
					}
				});
			}

			return false;
		},

		calculate_totals: function() {
			if ( window.confirm( woocommerce_admin_meta_boxes.calc_totals ) ) {

				wc_meta_boxes_order_items.block();

				// Get row totals
				var line_totals    = 0;
				var tax            = 0;
				var shipping       = 0;

				$( '.woocommerce_order_items tr.shipping input.line_total' ).each(function() {
					var cost  = $( this ).val() || '0';
					cost      = accounting.unformat( cost, woocommerce_admin.mon_decimal_point );
					shipping  = shipping + parseFloat( cost );
				});

				$( '.woocommerce_order_items input.line_tax' ).each(function() {
					var cost = $( this ).val() || '0';
					cost     = accounting.unformat( cost, woocommerce_admin.mon_decimal_point );
					tax      = tax + parseFloat( cost );
				});

				$( '.woocommerce_order_items tr.item, .woocommerce_order_items tr.fee' ).each(function() {
					var line_total = $( this ).find( 'input.line_total' ).val() || '0';
					line_totals    = line_totals + accounting.unformat( line_total.replace( ',', '.' ) );
				});

				// Tax
				if ( 'yes' === woocommerce_admin_meta_boxes.round_at_subtotal ) {
					tax = parseFloat( accounting.toFixed( tax, woocommerce_admin_meta_boxes.rounding_precision ) );
				}

				// Set Total
				$( '#_order_total' )
					.val( accounting.formatNumber( line_totals + tax + shipping, woocommerce_admin_meta_boxes.currency_format_num_decimals, '', woocommerce_admin.mon_decimal_point ) )
					.change();

				$( 'button.save-action' ).click();
			}

			return false;
		},

		save_line_items: function() {
			var data = {
				order_id: woocommerce_admin_meta_boxes.post_id,
				items:    $( 'table.woocommerce_order_items :input[name], .wc-order-totals-items :input[name]' ).serialize(),
				action:   'woocommerce_save_order_items',
				security: woocommerce_admin_meta_boxes.order_item_nonce
			};

			wc_meta_boxes_order_items.block();

			$.ajax({
				url:  woocommerce_admin_meta_boxes.ajax_url,
				data: data,
				type: 'POST',
				success: function( response ) {
					$( '#woocommerce-order-items .inside' ).empty();
					$( '#woocommerce-order-items .inside' ).append( response );
					wc_meta_boxes_order.init_tiptip();
					wc_meta_boxes_order_items.unblock();
					wc_meta_boxes_order_items.stupidtable.init();
				}
			});

			$( this ).trigger( 'items_saved' );

			return false;
		},

		refunds: {

			do_refund: function() {
				wc_meta_boxes_order_items.block();

				if ( window.confirm( woocommerce_admin_meta_boxes.i18n_do_refund ) ) {
					var refund_amount = $( 'input#refund_amount' ).val();
					var refund_reason = $( 'input#refund_reason' ).val();

					// Get line item refunds
					var line_item_qtys       = {};
					var line_item_totals     = {};
					var line_item_tax_totals = {};

					$( '.refund input.refund_order_item_qty' ).each(function( index, item ) {
						if ( $( item ).closest( 'tr' ).data( 'order_item_id' ) ) {
							if ( item.value ) {
								line_item_qtys[ $( item ).closest( 'tr' ).data( 'order_item_id' ) ] = item.value;
							}
						}
					});

					$( '.refund input.refund_line_total' ).each(function( index, item ) {
						if ( $( item ).closest( 'tr' ).data( 'order_item_id' ) ) {
							line_item_totals[ $( item ).closest( 'tr' ).data( 'order_item_id' ) ] = accounting.unformat( item.value, woocommerce_admin.mon_decimal_point );
						}
					});

					$( '.refund input.refund_line_tax' ).each(function( index, item ) {
						if ( $( item ).closest( 'tr' ).data( 'order_item_id' ) ) {
							var tax_id = $( item ).data( 'tax_id' );

							if ( ! line_item_tax_totals[ $( item ).closest( 'tr' ).data( 'order_item_id' ) ] ) {
								line_item_tax_totals[ $( item ).closest( 'tr' ).data( 'order_item_id' ) ] = {};
							}

							line_item_tax_totals[ $( item ).closest( 'tr' ).data( 'order_item_id' ) ][ tax_id ] = accounting.unformat( item.value, woocommerce_admin.mon_decimal_point );
						}
					});

					var data = {
						action:                 'woocommerce_refund_line_items',
						order_id:               woocommerce_admin_meta_boxes.post_id,
						refund_amount:          refund_amount,
						refund_reason:          refund_reason,
						line_item_qtys:         JSON.stringify( line_item_qtys, null, '' ),
						line_item_totals:       JSON.stringify( line_item_totals, null, '' ),
						line_item_tax_totals:   JSON.stringify( line_item_tax_totals, null, '' ),
						api_refund:             $( this ).is( '.do-api-refund' ),
						restock_refunded_items: $( '#restock_refunded_items:checked' ).size() ? 'true' : 'false',
						security:               woocommerce_admin_meta_boxes.order_item_nonce
					};

					$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
						if ( true === response.success ) {
							wc_meta_boxes_order_items.reload_items();

							if ( 'fully_refunded' === response.data.status ) {
								// Redirect to same page for show the refunded status
								window.location.href = window.location.href;
							}
						} else {
							window.alert( response.data.error );
							wc_meta_boxes_order_items.unblock();
						}
					});
				} else {
					wc_meta_boxes_order_items.unblock();
				}
			},

			delete_refund: function() {
				if ( window.confirm( woocommerce_admin_meta_boxes.i18n_delete_refund ) ) {
					var $refund   = $( this ).closest( 'tr.refund' );
					var refund_id = $refund.attr( 'data-order_refund_id' );

					wc_meta_boxes_order_items.block();

					var data = {
						action:    'woocommerce_delete_refund',
						refund_id: refund_id,
						security:  woocommerce_admin_meta_boxes.order_item_nonce,
					};

					$.ajax({
						url:     woocommerce_admin_meta_boxes.ajax_url,
						data:    data,
						type:    'POST',
						success: function( response ) {
							wc_meta_boxes_order_items.reload_items();
						}
					});
				}
				return false;
			},

			input_changed: function() {
				var refund_amount = 0;
				var $items        = $( '.woocommerce_order_items' ).find( 'tr.item, tr.fee, tr.shipping' );

				$items.each(function() {
					var $row               = $( this );
					var refund_cost_fields = $row.find( '.refund input:not(.refund_order_item_qty)' );

					refund_cost_fields.each(function( index, el ) {
						refund_amount += parseFloat( accounting.unformat( $( el ).val() || 0, woocommerce_admin.mon_decimal_point ) );
					});
				});

				$( '#refund_amount' )
					.val( accounting.formatNumber(
						refund_amount,
						woocommerce_admin_meta_boxes.currency_format_num_decimals,
						'',
						woocommerce_admin.mon_decimal_point
					) )
					.change();
			},

			amount_changed: function() {
				var total = accounting.unformat( $( this ).val(), woocommerce_admin.mon_decimal_point );

				$( 'button .wc-order-refund-amount .amount' ).text( accounting.formatMoney( total, {
					symbol:    woocommerce_admin_meta_boxes.currency_format_symbol,
					decimal:   woocommerce_admin_meta_boxes.currency_format_decimal_sep,
					thousand:  woocommerce_admin_meta_boxes.currency_format_thousand_sep,
					precision: woocommerce_admin_meta_boxes.currency_format_num_decimals,
					format:    woocommerce_admin_meta_boxes.currency_format
				} ) );
			},

			// When the refund qty is changed, increase or decrease costs
			refund_quantity_changed: function() {
				var $row              = $( this ).closest( 'tr.item' );
				var qty               = $row.find( 'input.quantity' ).val();
				var refund_qty        = $( this ).val();
				var line_total        = $( 'input.line_total', $row );
				var refund_line_total = $( 'input.refund_line_total', $row );

				// Totals
				var unit_total = accounting.unformat( line_total.attr( 'data-total' ), woocommerce_admin.mon_decimal_point ) / qty;

				refund_line_total.val(
					parseFloat( accounting.formatNumber( unit_total * refund_qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
						.toString()
						.replace( '.', woocommerce_admin.mon_decimal_point )
				).change();

				// Taxes
				$( 'td.line_tax', $row ).each( function() {
					var line_total_tax        = $( 'input.line_tax', $( this ) );
					var refund_line_total_tax = $( 'input.refund_line_tax', $( this ) );
					var unit_total_tax = accounting.unformat( line_total_tax.attr( 'data-total_tax' ), woocommerce_admin.mon_decimal_point ) / qty;

					if ( 0 < unit_total_tax ) {
						refund_line_total_tax.val(
							parseFloat( accounting.formatNumber( unit_total_tax * refund_qty, woocommerce_admin_meta_boxes.rounding_precision, '' ) )
								.toString()
								.replace( '.', woocommerce_admin.mon_decimal_point )
						).change();
					} else {
						refund_line_total_tax.val( 0 ).change();
					}
				});

				// Restock checkbox
				if ( refund_qty > 0 ) {
					$( '#restock_refunded_items' ).closest( 'tr' ).show();
				} else {
					$( '#restock_refunded_items' ).closest( 'tr' ).hide();
					$( '.woocommerce_order_items input.refund_order_item_qty' ).each( function() {
						if ( $( this ).val() > 0 ) {
							$( '#restock_refunded_items' ).closest( 'tr' ).show();
						}
					});
				}

				$( this ).trigger( 'refund_quantity_changed' );
			}
		},

		item_meta: {

			add: function() {
				var $button = $( this );
				var $item = $button.closest( 'tr.item' );

				var data = {
					order_item_id: $item.attr( 'data-order_item_id' ),
					action:        'woocommerce_add_order_item_meta',
					security:      woocommerce_admin_meta_boxes.order_item_nonce
				};

				wc_meta_boxes_order_items.block();

				$.ajax({
					url: woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						$item.find('tbody.meta_items').append( response );
						wc_meta_boxes_order_items.unblock();
					}
				});

				return false;
			},

			remove: function() {
				if ( window.confirm( woocommerce_admin_meta_boxes.remove_item_meta ) ) {
					var $row = $( this ).closest( 'tr' );

					var data = {
						meta_id:  $row.attr( 'data-meta_id' ),
						action:   'woocommerce_remove_order_item_meta',
						security: woocommerce_admin_meta_boxes.order_item_nonce
					};

					wc_meta_boxes_order_items.block();

					$.ajax({
						url: woocommerce_admin_meta_boxes.ajax_url,
						data: data,
						type: 'POST',
						success: function( response ) {
							$row.hide();
							wc_meta_boxes_order_items.unblock();
						}
					});
				}
				return false;
			}
		},

		bulk_actions: {

			check_column: function(){
				if ( $( this ).is( ':checked' ) ) {
					$( '#woocommerce-order-items' ).find( '.check-column input' ).attr( 'checked', 'checked' );
				} else {
					$( '#woocommerce-order-items' ).find( '.check-column input' ).removeAttr( 'checked' );
				}
			},

			do_bulk_action: function() {
				var action        = $( this ).closest( '.bulk-actions' ).find( 'select' ).val();
				var selected_rows = $( '#woocommerce-order-items' ).find( '.check-column input:checked' );
				var item_ids      = [];

				$( selected_rows ).each( function() {
					var $item = $( this ).closest( 'tr' );

					if ( $item.attr( 'data-order_item_id' ) ) {
						item_ids.push( $item.attr( 'data-order_item_id' ) );
					}
				} );

				if ( item_ids.length === 0 ) {
					window.alert( woocommerce_admin_meta_boxes.i18n_select_items );
					return;
				}

				if ( wc_meta_boxes_order_items.bulk_actions[ action ] ) {
					wc_meta_boxes_order_items.bulk_actions[action]( selected_rows, item_ids );
				}

				return false;
			},

			delete: function( selected_rows, item_ids ) {
				if ( window.confirm( woocommerce_admin_meta_boxes.remove_item_notice ) ) {

					wc_meta_boxes_order_items.block();

					var data = {
						order_item_ids: item_ids,
						action:         'woocommerce_remove_order_item',
						security:       woocommerce_admin_meta_boxes.order_item_nonce
					};

					$.ajax({
						url: woocommerce_admin_meta_boxes.ajax_url,
						data: data,
						type: 'POST',
						success: function( response ) {
							$( selected_rows ).each(function() {
								$( this ).closest( 'tr' ).remove();
							});
							wc_meta_boxes_order_items.unblock();
						}
					});
				}
			},

			increase_stock: function( selected_rows, item_ids ) {
				wc_meta_boxes_order_items.block();

				var quantities = {};

				$( selected_rows ).each(function() {

					var $item = $( this ).closest( 'tr.item, tr.fee' );
					var $qty  = $item.find( 'input.quantity' );

					quantities[ $item.attr( 'data-order_item_id' ) ] = $qty.val();
				});

				var data = {
					order_id:       woocommerce_admin_meta_boxes.post_id,
					order_item_ids: item_ids,
					order_item_qty: quantities,
					action:         'woocommerce_increase_order_item_stock',
					security:       woocommerce_admin_meta_boxes.order_item_nonce
				};

				$.ajax({
					url: woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						window.alert( response );
						wc_meta_boxes_order_items.unblock();
					}
				});
			},

			reduce_stock: function( selected_rows, item_ids ) {
				wc_meta_boxes_order_items.block();

				var quantities = {};

				$( selected_rows ).each(function() {

					var $item = $( this ).closest( 'tr.item, tr.fee' );
					var $qty  = $item.find( 'input.quantity' );

					quantities[ $item.attr( 'data-order_item_id' ) ] = $qty.val();
				});

				var data = {
					order_id:       woocommerce_admin_meta_boxes.post_id,
					order_item_ids: item_ids,
					order_item_qty: quantities,
					action:         'woocommerce_reduce_order_item_stock',
					security:       woocommerce_admin_meta_boxes.order_item_nonce
				};

				$.ajax({
					url: woocommerce_admin_meta_boxes.ajax_url,
					data: data,
					type: 'POST',
					success: function( response ) {
						window.alert( response );
						wc_meta_boxes_order_items.unblock();
					}
				} );
			}
		},

		backbone: {

			init: function( e, target ) {
				if ( '#wc-modal-add-products' === target ) {
					$( 'body' ).trigger( 'wc-enhanced-select-init' );
				}
			},

			response: function( e, target, data ) {
				if ( '#wc-modal-add-tax' === target ) {
					var rate_id = data.add_order_tax;
					var manual_rate_id = '';

					if ( data.manual_tax_rate_id ) {
						manual_rate_id = data.manual_tax_rate_id;
					}

					wc_meta_boxes_order_items.backbone.add_tax( rate_id, manual_rate_id );
				}
				if ( '#wc-modal-add-products' === target ) {
					wc_meta_boxes_order_items.backbone.add_item( data.add_order_items );
				}
			},

			add_item: function( add_item_ids ) {
				add_item_ids = add_item_ids.split( ',' );

				if ( add_item_ids ) {

					var count = add_item_ids.length;

					wc_meta_boxes_order_items.block();

					$.each( add_item_ids, function( index, value ) {

						var data = {
							action:      'woocommerce_add_order_item',
							item_to_add: value,
							order_id:    woocommerce_admin_meta_boxes.post_id,
							security:    woocommerce_admin_meta_boxes.order_item_nonce
						};

						$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
							$( 'table.woocommerce_order_items tbody#order_line_items' ).append( response );

							if ( !--count ) {
								wc_meta_boxes_order.init_tiptip();
								wc_meta_boxes_order_items.unblock();
							}
						});

					});

				}
			},

			add_tax: function( rate_id, manual_rate_id ) {
				if ( manual_rate_id ) {
					rate_id = manual_rate_id;
				}

				if ( ! rate_id ) {
					return false;
				}

				var rates = $( '.order-tax-id' ).map( function() {
					return $( this ).val();
				}).get();

				// Test if already exists
				if ( -1 === $.inArray( rate_id, rates ) ) {
					wc_meta_boxes_order_items.block();

					var data = {
						action:   'woocommerce_add_order_tax',
						rate_id:  rate_id,
						order_id: woocommerce_admin_meta_boxes.post_id,
						security: woocommerce_admin_meta_boxes.order_item_nonce
					};

					$.ajax({
						url:  woocommerce_admin_meta_boxes.ajax_url,
						data: data,
						type: 'POST',
						success: function( response ) {
							$( '#woocommerce-order-items .inside' ).empty();
							$( '#woocommerce-order-items .inside' ).append( response );
							wc_meta_boxes_order.init_tiptip();
							wc_meta_boxes_order_items.unblock();
							wc_meta_boxes_order_items.stupidtable.init();
						}
					});
				} else {
					window.alert( woocommerce_admin_meta_boxes.i18n_tax_rate_already_exists );
				}
			}
		},

		stupidtable: {
			init: function() {
				$( '.woocommerce_order_items' ).stupidtable().on( 'aftertablesort', this.add_arrows );
			},

			add_arrows: function( event, data ) {
				var th    = $( this ).find( 'th' );
				var arrow = data.direction === 'asc' ? '&uarr;' : '&darr;';
				var index = data.column;

				if ( 1 < index ) {
					index = index - 1;
				}

				th.find( '.wc-arrow' ).remove();
				th.eq( index ).append( '<span class="wc-arrow">' + arrow + '</span>' );
			}
		}
	};

	/**
	 * Order Notes Panel
	 */
	var wc_meta_boxes_order_notes = {
		init: function() {
			$( '#woocommerce-order-notes' )
				.on( 'click', 'a.add_note', this.add_order_note )
				.on( 'click', 'a.delete_note', this.delete_order_note );

		},

		add_order_note: function() {
			if ( ! $( 'textarea#add_order_note' ).val() ) {
				return;
			}

			$( '#woocommerce-order-notes' ).block({
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			});

			var data = {
				action:    'woocommerce_add_order_note',
				post_id:   woocommerce_admin_meta_boxes.post_id,
				note:      $( 'textarea#add_order_note' ).val(),
				note_type: $( 'select#order_note_type' ).val(),
				security:  woocommerce_admin_meta_boxes.add_order_note_nonce,
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
				$( 'ul.order_notes' ).prepend( response );
				$( '#woocommerce-order-notes' ).unblock();
				$( '#add_order_note' ).val( '' );
			});

			return false;
		},

		delete_order_note: function() {
			var note = $( this ).closest( 'li.note' );

			$( note ).block({
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			});

			var data = {
				action:   'woocommerce_delete_order_note',
				note_id:  $( note ).attr( 'rel' ),
				security: woocommerce_admin_meta_boxes.delete_order_note_nonce,
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
				$( note ).remove();
			});

			return false;
		},
	};

	/**
	 * Order Downloads Panel
	 */
	var wc_meta_boxes_order_downloads = {
		init: function() {
			$( '.order_download_permissions' )
				.on( 'click', 'button.grant_access', this.grant_access )
				.on( 'click', 'button.revoke_access', this.revoke_access );
		},

		grant_access: function() {
			var products = $( '#grant_access_id' ).val();

			if ( ! products ) {
				return;
			}

			$( '.order_download_permissions' ).block({
				message: null,
				overlayCSS: {
					background: '#fff',
					opacity: 0.6
				}
			});

			var data = {
				action:      'woocommerce_grant_access_to_download',
				product_ids: products,
				loop:        $('.order_download_permissions .wc-metabox').size(),
				order_id:    woocommerce_admin_meta_boxes.post_id,
				security:    woocommerce_admin_meta_boxes.grant_access_nonce,
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {

				if ( response ) {
					$( '.order_download_permissions .wc-metaboxes' ).append( response );
				} else {
					window.alert( woocommerce_admin_meta_boxes.i18n_download_permission_fail );
				}

				$('body').trigger( 'wc-init-datepickers' );
				$( '#grant_access_id' ).val( '' ).change();
				$( '.order_download_permissions' ).unblock();
			});

			return false;
		},

		revoke_access: function () {
			if ( window.confirm( woocommerce_admin_meta_boxes.i18n_permission_revoke ) ) {
				var el      = $( this ).parent().parent();
				var product = $( this ).attr( 'rel' ).split( ',' )[0];
				var file    = $( this ).attr( 'rel' ).split( ',' )[1];

				if ( product > 0 ) {
					$( el ).block({
						message: null,
						overlayCSS: {
							background: '#fff',
							opacity: 0.6
						}
					});

					var data = {
						action:      'woocommerce_revoke_access_to_download',
						product_id:  product,
						download_id: file,
						order_id:    woocommerce_admin_meta_boxes.post_id,
						security:    woocommerce_admin_meta_boxes.revoke_access_nonce,
					};

					$.post( woocommerce_admin_meta_boxes.ajax_url, data, function ( response ) {
						// Success
						$( el ).fadeOut( '300', function () {
							$( el ).remove();
						});
					});

				} else {
					$( el ).fadeOut( '300', function () {
						$( el ).remove();
					});
				}
			}
			return false;
		}
	};

	wc_meta_boxes_order.init();
	wc_meta_boxes_order_items.init();
	wc_meta_boxes_order_notes.init();
	wc_meta_boxes_order_downloads.init();
});
