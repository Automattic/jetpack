/*global woocommerce_admin_meta_boxes */
jQuery( function( $ ){

	// Scroll to first checked category - https://github.com/scribu/wp-category-checklist-tree/blob/d1c3c1f449e1144542efa17dde84a9f52ade1739/category-checklist-tree.php
	$(function(){
		$('[id$="-all"] > ul.categorychecklist').each(function() {
			var $list = $(this);
			var $firstChecked = $list.find(':checked').first();

			if ( !$firstChecked.length )
				return;

			var pos_first = $list.find('input').position().top;
			var pos_checked = $firstChecked.position().top;

			$list.closest('.tabs-panel').scrollTop(pos_checked - pos_first + 5);
		});
	});

	// Prevent enter submitting post form
	$("#upsell_product_data").bind("keypress", function(e) {
		if (e.keyCode == 13) return false;
	});

	// Type box
	$('.type_box').appendTo( '#woocommerce-product-data h3.hndle span' );

	$(function(){
		// Prevent inputs in meta box headings opening/closing contents
		$('#woocommerce-product-data h3.hndle').unbind('click.postboxes');

		jQuery('#woocommerce-product-data').on('click', 'h3.hndle', function(event){

			// If the user clicks on some form input inside the h3 the box should not be toggled
			if ( $(event.target).filter('input, option, label, select').length )
				return;

			$('#woocommerce-product-data').toggleClass('closed');
		});
	});

	// Catalog Visibility
	$('#catalog-visibility .edit-catalog-visibility').click(function () {
		if ($('#catalog-visibility-select').is(":hidden")) {
			$('#catalog-visibility-select').slideDown('fast');
			$(this).hide();
		}
		return false;
	});
	$('#catalog-visibility .save-post-visibility').click(function () {
		$('#catalog-visibility-select').slideUp('fast');
		$('#catalog-visibility .edit-catalog-visibility').show();

		var value = $('input[name=_visibility]:checked').val();
		var label = $('input[name=_visibility]:checked').attr('data-label');

		if ( $('input[name=_featured]').is(':checked') ) {
			label = label + ', ' + woocommerce_admin_meta_boxes.featured_label
			$('input[name=_featured]').attr('checked', 'checked');
		}

		$('#catalog-visibility-display').text( label );
		return false;
	});
	$('#catalog-visibility .cancel-post-visibility').click(function () {
		$('#catalog-visibility-select').slideUp('fast');
		$('#catalog-visibility .edit-catalog-visibility').show();

		var current_visibility = $('#current_visibility').val();
		var current_featured = $('#current_featured').val();

		$('input[name=_visibility]').removeAttr('checked');
		$('input[name=_visibility][value=' + current_visibility + ']').attr('checked', 'checked');

		var label = $('input[name=_visibility]:checked').attr('data-label');

		if ( current_featured == 'yes' ) {
			label = label + ', ' + woocommerce_admin_meta_boxes.featured_label
			$('input[name=_featured]').attr('checked', 'checked');
		} else {
			$('input[name=_featured]').removeAttr('checked');
		}

		$('#catalog-visibility-display').text( label );
		return false;
	});

	// PRODUCT TYPE SPECIFIC OPTIONS
	$( 'select#product-type' ).change( function () {

		// Get value
		var select_val = $( this ).val();

		if ( 'variable' === select_val ) {
			$( 'input#_manage_stock' ).change();
			$( 'input#_downloadable' ).prop( 'checked', false );
			$( 'input#_virtual' ).removeAttr( 'checked' );
		} else if ( 'grouped' === select_val ) {
			$( 'input#_downloadable' ).prop( 'checked', false );
			$( 'input#_virtual' ).removeAttr( 'checked' );
		} else if ( 'external' === select_val ) {
			$( 'input#_downloadable' ).prop( 'checked', false );
			$( 'input#_virtual' ).removeAttr( 'checked' );
		}

		show_and_hide_panels();

		$( 'ul.wc-tabs li:visible' ).eq(0).find( 'a' ).click();

		$( 'body' ).trigger( 'woocommerce-product-type-change', select_val, $( this ) );

	}).change();

	$( 'body' ).on( 'woocommerce-product-type-change', function( e, select_val ) {
		if ( 'variable' !== select_val && 0 < $( '#variable_product_options input[name^=variable_sku]' ).length && $( 'body' ).triggerHandler( 'woocommerce-display-product-type-alert', select_val ) !== false ) {
			window.alert( woocommerce_admin_meta_boxes.i18n_product_type_alert );
		}
	});

	$('input#_downloadable, input#_virtual').change(function(){
		show_and_hide_panels();
	});

	function show_and_hide_panels() {
		var product_type    = $('select#product-type').val();
		var is_virtual      = $('input#_virtual:checked').size();
		var is_downloadable = $('input#_downloadable:checked').size();

		// Hide/Show all with rules
		var hide_classes = '.hide_if_downloadable, .hide_if_virtual';
		var show_classes = '.show_if_downloadable, .show_if_virtual, .show_if_external';

		$.each( woocommerce_admin_meta_boxes.product_types, function( index, value ) {
			hide_classes = hide_classes + ', .hide_if_' + value;
			show_classes = show_classes + ', .show_if_' + value;
		} );

		$( hide_classes ).show();
		$( show_classes ).hide();

		// Shows rules
		if ( is_downloadable ) {
			$('.show_if_downloadable').show();
		}
		if ( is_virtual ) {
			$('.show_if_virtual').show();
		}

        $('.show_if_' + product_type).show();

		// Hide rules
		if ( is_downloadable ) {
			$('.hide_if_downloadable').hide();
		}
		if ( is_virtual ) {
			$('.hide_if_virtual').hide();
		}

		$('.hide_if_' + product_type).hide();

		$('input#_manage_stock').change();
	}


	// Sale price schedule
	$('.sale_price_dates_fields').each(function() {

		var $these_sale_dates = $(this);
		var sale_schedule_set = false;
		var $wrap = $these_sale_dates.closest( 'div, table' );

		$these_sale_dates.find('input').each(function(){
			if ( $(this).val() != '' )
				sale_schedule_set = true;
		});

		if ( sale_schedule_set ) {

			$wrap.find('.sale_schedule').hide();
			$wrap.find('.sale_price_dates_fields').show();

		} else {

			$wrap.find('.sale_schedule').show();
			$wrap.find('.sale_price_dates_fields').hide();

		}

	});

	$('#woocommerce-product-data').on( 'click', '.sale_schedule', function() {
		var $wrap = $(this).closest( 'div, table' );

		$(this).hide();
		$wrap.find('.cancel_sale_schedule').show();
		$wrap.find('.sale_price_dates_fields').show();

		return false;
	});
	$('#woocommerce-product-data').on( 'click', '.cancel_sale_schedule', function() {
		var $wrap = $(this).closest( 'div, table' );

		$(this).hide();
		$wrap.find('.sale_schedule').show();
		$wrap.find('.sale_price_dates_fields').hide();
		$wrap.find('.sale_price_dates_fields').find('input').val('');

		return false;
	});

	// File inputs
	$('#woocommerce-product-data').on('click','.downloadable_files a.insert',function(){
		$(this).closest('.downloadable_files').find('tbody').append( $(this).data( 'row' ) );
		return false;
	});
	$('#woocommerce-product-data').on('click','.downloadable_files a.delete',function(){
		$(this).closest('tr').remove();
		return false;
	});


	// STOCK OPTIONS
	$('input#_manage_stock').change(function(){
		if ( $(this).is(':checked') ) {
			$('div.stock_fields').show();
		} else {
			$('div.stock_fields').hide();
		}
	}).change();


	// DATE PICKER FIELDS
	var dates = $( ".sale_price_dates_fields input" ).datepicker({
		defaultDate: "",
		dateFormat: "yy-mm-dd",
		numberOfMonths: 1,
		showButtonPanel: true,
		onSelect: function( selectedDate ) {
			var option = $(this).is('#_sale_price_dates_from, .sale_price_dates_from') ? "minDate" : "maxDate";

			var instance = $( this ).data( "datepicker" ),
				date = $.datepicker.parseDate(
					instance.settings.dateFormat ||
					$.datepicker._defaults.dateFormat,
					selectedDate, instance.settings );
			dates.not( this ).datepicker( "option", option, date );
		}
	});

	// ATTRIBUTE TABLES

	// Initial order
	var woocommerce_attribute_items = $('.product_attributes').find('.woocommerce_attribute').get();

	woocommerce_attribute_items.sort(function(a, b) {
	   var compA = parseInt($(a).attr('rel'));
	   var compB = parseInt($(b).attr('rel'));
	   return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
	})
	$(woocommerce_attribute_items).each( function(idx, itm) { $('.product_attributes').append(itm); } );

	function attribute_row_indexes() {
		$('.product_attributes .woocommerce_attribute').each(function(index, el){
			$('.attribute_position', el).val( parseInt( $(el).index('.product_attributes .woocommerce_attribute') ) );
		});
	};

	$('.product_attributes .woocommerce_attribute').each(function(index, el){
		if ( $(el).css('display') != 'none' && $(el).is('.taxonomy') ) {
			$('select.attribute_taxonomy').find('option[value="' + $(el).data( 'taxonomy' ) + '"]').attr('disabled','disabled');
		}
	});

	// Add rows
	$( 'button.add_attribute' ).on('click', function(){
		var size         = $( '.product_attributes .woocommerce_attribute' ).size();
		var attribute    = $( 'select.attribute_taxonomy' ).val();
		var $wrapper     = $( this ).closest( '#product_attributes' ).find( '.product_attributes' );
		var product_type = $( 'select#product-type' ).val();
		var data         = {
			action : 'woocommerce_add_attribute',
			taxonomy : attribute,
			i : size,
			security : woocommerce_admin_meta_boxes.add_attribute_nonce
		};

		$wrapper.block({ message: null, overlayCSS: { background: '#fff', opacity: 0.6 } });

		$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {
			$wrapper.append( response );

			if ( product_type !== 'variable' ) {
				$wrapper.find( '.enable_variation' ).hide();
			}

			$('body').trigger( 'wc-enhanced-select-init' );
			attribute_row_indexes();
			$wrapper.unblock();

			$('body').trigger( 'woocommerce_added_attribute' );
		});

		if ( attribute ) {
			$( 'select.attribute_taxonomy' ).find( 'option[value="' + attribute + '"]' ).attr( 'disabled','disabled' );
			$( 'select.attribute_taxonomy' ).val( '' );
		}

		return false;
	});

	$('.product_attributes').on('blur', 'input.attribute_name', function(){
		$(this).closest('.woocommerce_attribute').find('strong.attribute_name').text( $(this).val() );
	});

	$('.product_attributes').on('click', 'button.select_all_attributes', function(){
		$(this).closest('td').find('select option').attr("selected","selected");
		$(this).closest('td').find('select').change();
		return false;
	});

	$('.product_attributes').on('click', 'button.select_no_attributes', function(){
		$(this).closest('td').find('select option').removeAttr("selected");
		$(this).closest('td').find('select').change();
		return false;
	});

	$('.product_attributes').on('click', 'button.remove_row', function() {
		var answer = confirm(woocommerce_admin_meta_boxes.remove_attribute);
		if (answer){
			var $parent = $(this).parent().parent();

			if ($parent.is('.taxonomy')) {
				$parent.find('select, input[type=text]').val('');
				$parent.hide();
				$('select.attribute_taxonomy').find('option[value="' + $parent.data( 'taxonomy' ) + '"]').removeAttr('disabled');
			} else {
				$parent.find('select, input[type=text]').val('');
				$parent.hide();
				attribute_row_indexes();
			}
		}
		return false;
	});

	// Attribute ordering
	$('.product_attributes').sortable({
		items:'.woocommerce_attribute',
		cursor:'move',
		axis:'y',
		handle: 'h3',
		scrollSensitivity:40,
		forcePlaceholderSize: true,
		helper: 'clone',
		opacity: 0.65,
		placeholder: 'wc-metabox-sortable-placeholder',
		start:function(event,ui){
			ui.item.css('background-color','#f6f6f6');
		},
		stop:function(event,ui){
			ui.item.removeAttr('style');
			attribute_row_indexes();
		}
	});

	// Add a new attribute (via ajax)
	$('.product_attributes').on('click', 'button.add_new_attribute', function() {

		$('.product_attributes').block({ message: null, overlayCSS: { background: '#fff', opacity: 0.6 } });

		var $wrapper           = $(this).closest('.woocommerce_attribute');
		var attribute          = $wrapper.data('taxonomy');
		var new_attribute_name = prompt( woocommerce_admin_meta_boxes.new_attribute_prompt );

		if ( new_attribute_name ) {

			var data = {
				action: 		'woocommerce_add_new_attribute',
				taxonomy:		attribute,
				term:			new_attribute_name,
				security: 		woocommerce_admin_meta_boxes.add_attribute_nonce
			};

			$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {

				if ( response.error ) {
					// Error
					alert( response.error );
				} else if ( response.slug ) {
					// Success
					$wrapper.find('select.attribute_values').append('<option value="' + response.slug + '" selected="selected">' + response.name + '</option>');
					$wrapper.find('select.attribute_values').change();
				}

				$('.product_attributes').unblock();

			});

		} else {
			$('.product_attributes').unblock();
		}

		return false;
	});

	// Save attributes and update variations
	$('.save_attributes').on('click', function(){

		$('.product_attributes').block({ message: null, overlayCSS: { background: '#fff', opacity: 0.6 } });

		var data = {
			post_id: 		woocommerce_admin_meta_boxes.post_id,
			data:			$('.product_attributes').find('input, select, textarea').serialize(),
			action: 		'woocommerce_save_attributes',
			security: 		woocommerce_admin_meta_boxes.save_attributes_nonce
		};

		$.post( woocommerce_admin_meta_boxes.ajax_url, data, function( response ) {

			var this_page = window.location.toString();

			this_page = this_page.replace( 'post-new.php?', 'post.php?post=' + woocommerce_admin_meta_boxes.post_id + '&action=edit&' );

			// Load variations panel
			$('#variable_product_options').block({ message: null, overlayCSS: { background: '#fff', opacity: 0.6 } });
			$('#variable_product_options').load( this_page + ' #variable_product_options_inner', function() {
				$('#variable_product_options').unblock();
			} );

			$('.product_attributes').unblock();

		});

	});

	// Uploading files
	var downloadable_file_frame;
	var file_path_field;

	jQuery(document).on( 'click', '.upload_file_button', function( event ){

		var $el = $(this);

		file_path_field = $el.closest('tr').find('td.file_url input');

		event.preventDefault();

		// If the media frame already exists, reopen it.
		if ( downloadable_file_frame ) {
			downloadable_file_frame.open();
			return;
		}

		var downloadable_file_states = [
			// Main states.
			new wp.media.controller.Library({
				library:   wp.media.query(),
				multiple:  true,
				title:     $el.data('choose'),
				priority:  20,
				filterable: 'uploaded',
			})
		];

		// Create the media frame.
		downloadable_file_frame = wp.media.frames.downloadable_file = wp.media({
			// Set the title of the modal.
			title: $el.data('choose'),
			library: {
				type: ''
			},
			button: {
				text: $el.data('update'),
			},
			multiple: true,
			states: downloadable_file_states,
		});

		// When an image is selected, run a callback.
		downloadable_file_frame.on( 'select', function() {

			var file_path = '';
			var selection = downloadable_file_frame.state().get('selection');

			selection.map( function( attachment ) {

				attachment = attachment.toJSON();

				if ( attachment.url )
					file_path = attachment.url

			} );

			file_path_field.val( file_path );
		});

		// Set post to 0 and set our custom type
		downloadable_file_frame.on( 'ready', function() {
			downloadable_file_frame.uploader.options.uploader.params = {
				type: 'downloadable_product'
			};
		});

		// Finally, open the modal.
		downloadable_file_frame.open();
	});

	// Download ordering
	jQuery('.downloadable_files tbody').sortable({
		items:'tr',
		cursor:'move',
		axis:'y',
		handle: 'td.sort',
		scrollSensitivity:40,
		forcePlaceholderSize: true,
		helper: 'clone',
		opacity: 0.65,
	});

	// Product gallery file uploads
	var product_gallery_frame;
	var $image_gallery_ids = $('#product_image_gallery');
	var $product_images = $('#product_images_container ul.product_images');

	jQuery('.add_product_images').on( 'click', 'a', function( event ) {
		var $el = $(this);
		var attachment_ids = $image_gallery_ids.val();

		event.preventDefault();

		// If the media frame already exists, reopen it.
		if ( product_gallery_frame ) {
			product_gallery_frame.open();
			return;
		}

		// Create the media frame.
		product_gallery_frame = wp.media.frames.product_gallery = wp.media({
			// Set the title of the modal.
			title: $el.data('choose'),
			button: {
				text: $el.data('update'),
			},
			states : [
				new wp.media.controller.Library({
					title: $el.data('choose'),
					filterable :	'all',
					multiple: true,
				})
			]
		});

		// When an image is selected, run a callback.
		product_gallery_frame.on( 'select', function() {

			var selection = product_gallery_frame.state().get('selection');

			selection.map( function( attachment ) {

				attachment = attachment.toJSON();

				if ( attachment.id ) {
					attachment_ids   = attachment_ids ? attachment_ids + "," + attachment.id : attachment.id;
					attachment_image = attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;

					$product_images.append('\
						<li class="image" data-attachment_id="' + attachment.id + '">\
							<img src="' + attachment_image + '" />\
							<ul class="actions">\
								<li><a href="#" class="delete" title="' + $el.data('delete') + '">' + $el.data('text') + '</a></li>\
							</ul>\
						</li>');
				}

			});

			$image_gallery_ids.val( attachment_ids );
		});

		// Finally, open the modal.
		product_gallery_frame.open();
	});

	// Image ordering
	$product_images.sortable({
		items: 'li.image',
		cursor: 'move',
		scrollSensitivity:40,
		forcePlaceholderSize: true,
		forceHelperSize: false,
		helper: 'clone',
		opacity: 0.65,
		placeholder: 'wc-metabox-sortable-placeholder',
		start:function(event,ui){
			ui.item.css('background-color','#f6f6f6');
		},
		stop:function(event,ui){
			ui.item.removeAttr('style');
		},
		update: function(event, ui) {
			var attachment_ids = '';

			$('#product_images_container ul li.image').css('cursor','default').each(function() {
				var attachment_id = jQuery(this).attr( 'data-attachment_id' );
				attachment_ids = attachment_ids + attachment_id + ',';
			});

			$image_gallery_ids.val( attachment_ids );
		}
	});

	// Remove images
	$('#product_images_container').on( 'click', 'a.delete', function() {
		$(this).closest('li.image').remove();

		var attachment_ids = '';

		$('#product_images_container ul li.image').css('cursor','default').each(function() {
			var attachment_id = jQuery(this).attr( 'data-attachment_id' );
			attachment_ids = attachment_ids + attachment_id + ',';
		});

		$image_gallery_ids.val( attachment_ids );

		// remove any lingering tooltips
		$( '#tiptip_holder' ).removeAttr( 'style' );
		$( '#tiptip_arrow' ).removeAttr( 'style' );

		return false;
	});
});
