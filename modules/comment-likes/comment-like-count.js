jQuery( document ).ready( function() {
	var jsonAPIbase = 'https://public-api.wordpress.com/rest/v1';
	var APIqueue = [];

	function getCommentLikeCounts() {
		jQuery( '.comment-like-count' ).each( function() {
			var blogId = jQuery( this ).attr( 'data-blog-id' );
			var commentId = jQuery( this ).attr( 'data-comment-id' );

			APIqueue.push( '/sites/' + blogId + '/comments/' + commentId + '/likes' );
		} );

		fetchCounts();
	}

	function showCount( commentId, count ) {
		if ( count < 1 ) {
			return;
		}

		jQuery( '#comment-like-count-' + commentId ).find( '.like-count' ).hide();
		jQuery( '#comment-like-count-' + commentId ).find( '.like-count' ).text( count );
		jQuery( '#comment-like-count-' + commentId ).find( '.like-count' ).fadeIn();
	}

	function fetchCounts() {
		var batchRequest = {
			path:    '/batch',
			data:    'urls[]=' + APIqueue.join( '&urls[]=' ),
			success: function( response ) {
				for ( var path in response ) {
					if ( ! response[ path ].error_data ) {
						var urlPieces = path.split( '/' );
						var commentId = urlPieces[ 4 ];
						showCount( commentId, response[ path ].found );
					}
				}
			},
			error: function() {}
		};

		request( batchRequest );
	}

	function request( options ) {
		return jQuery.ajax( {
			type: 'GET',
			url: jsonAPIbase + options.path,
			dataType : 'jsonp',
			data: options.data,
			success: options.success,
			error: options.error
		} );
	}

	getCommentLikeCounts();
} );
