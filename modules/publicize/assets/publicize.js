var showOptionsPage;

jQuery( function( $ ) {

	showOptionsPage = function( service, nonce, connection, blogId ) {
		tb_show( null, null, null );
		$("body").append( "<div id='TB_load'><img src='" + tb_pathToImage + "' /></div>" );
		$('#TB_load').show();

		var query = '';
		if ( null != connection ) {
			query += '&connection=' + encodeURIComponent( connection );
		}
		if ( 'undefined' != typeof( blogId ) && null != blogId ) {
			query += '&blog_id=' + Number( blogId );
		}

		$.post( ajaxurl, 'action=publicize_' + service + '_options_page&_wpnonce=' + nonce + query, function( response ) {
			$("#TB_load").remove();

			try {
				var obj = jQuery.parseJSON( response );
				if ( null != obj && 'object' == typeof( obj ) ) {
					if ( obj.hasOwnProperty( 'fb_redirect' ) ) {
						location.href = obj.fb_redirect + '&redirect_uri=' + encodeURIComponent( location.href );
						return;
					}
				}
			} catch (err) {
				// Do nothing and move on
			}

			if ( response != '' ) {
				var blogID = $( 'input[name=wpas_ajax_blog_id]' ).val();

				var message = $( '<div id="wpas-ajax-' + blogID + '" class="wrap"></div>' ).append( response );
				message.append( '<a href="#TB_inline?thickbox&height=420&width=555&inlineId=wpas-ajax-' + blogID + '" id="wpas-click-' + blogID + '" class="new-thickbox" style="display: none;"></a>' );
				$('#wpas-message').html( message );


				tb_init( 'a.new-thickbox' );
				$('#wpas-click-' + blogID).click();

				var tb_height = parseInt( $('#TB_ajaxContent').css('height') );
				var content_height = $('#thickbox-content').height();
				if ( content_height < tb_height ) {
					var new_height = content_height + 15;
					$('#TB_ajaxContent').css( 'height', new_height );

					var new_margin = parseInt( $('#TB_window').css( 'margin-top') ) + (tb_height - new_height) / 2 + 'px'
					$('#TB_window').css( 'margin-top',  new_margin);
				}

				$('.save-options').unbind('click').click( function() {
					var sel = $( "input[name='option']:checked" );
					var global = $( "input[name='global']:checked" );

					var connection = $(this).data('connection');
					var token = encodeURIComponent( sel.val() );
					var id = encodeURIComponent( sel.attr( 'id' ) );
					var type = encodeURIComponent( sel.attr( 'data-type' ) );
					var nonce = $(this).attr('rel');
					var global_conn = 'off';
					var global_nonce = '';

					if ( global.length ) {
						global_conn = 'on';
						global_nonce = global.val();
					}

					$.post( ajaxurl, 'action=publicize_'+ service + '_options_save&connection=' + connection + '&selected_id=' + id + '&token=' + token + '&type=' + type + '&_wpnonce=' + nonce + '&global=' + global_conn + '&global_nonce=' + global_nonce, function( response ) {
						tb_remove();
						top.location = 'options-general.php?page=sharing';
					} );

				} );
			}

		}, 'html' );
	}

	$( 'body' ).append( '<div id="wpas-message" style="display: none"></div>' );
	var messageDiv = $( '#wpas-message' );

	$( '.wpas-posts' ).change( function() {
		var inputs = $(this).parents( 'td:first' ).find( ':input' );
		var _this = this;
		var blogID = inputs.filter( '[name=wpas_ajax_blog_id]' ).val();

		$( '#waiting_' + blogID ).show();
		$.post( ajaxurl, inputs.serialize() + '&action=wpas_post', function( response ) { myblogsResponse.call( _this, blogID, response ) }, 'html' );
	} );

	$( '.options' ).unbind('click').bind( 'click', function(e) {
		e.preventDefault();
		e.stopPropagation();

		var service = $(this).attr('class').replace( 'options ', '' );

		var blogId = null;
		if( 'undefined' != typeof( $(this).attr('id') ) )
			blogId = parseInt( $(this).attr('id').replace( 'options-', '' ) );

		var nonce = $(this).attr('href').replace( '#nonce=', '' );
		var connection = $(this).data( 'connection' );
		showOptionsPage.call( this, service, nonce, connection, blogId );
	});
} );
