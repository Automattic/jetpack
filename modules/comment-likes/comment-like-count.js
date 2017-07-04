jQuery( document ).ready( function( $ ) {
	var jsonAPIbase = 'https://public-api.wordpress.com/rest/v1',
		APIqueue = [];

	function getCommentLikeCounts() {
		$( '.comment-like-count' ).each( function() {
			var blogId = $( this ).attr( 'data-blog-id' ),
				commentId = $( this ).attr( 'data-comment-id' );

			APIqueue.push( '/sites/' + blogId + '/comments/' + commentId + '/likes' );
		} );

		fetchCounts();
	}

	function showCount( commentId, count ) {
		if ( count < 1 ) {
			return;
		}

		$( '#comment-like-count-' + commentId ).find( '.like-count' ).hide().text( count ).fadeIn();
	}

	function fetchCounts() {
		var batchRequest = {
			path: '/batch',
			data: 'urls[]=' + APIqueue.map( encodeURIComponent ).join( '&urls[]=' ),
			success: function( response ) {
				for ( var path in response ) {
					if ( ! response[ path ].error_data ) {
						var urlPieces = path.split( '/' ),
							commentId = urlPieces[ 4 ];
						showCount( commentId, response[ path ].found );
					}
				}
			},
			error: function() {}
		};

		request( batchRequest );
	}

	function request( options ) {
		return $.ajax( {
			type: 'GET',
			url: jsonAPIbase + options.path,
			dataType: 'jsonp',
			data: options.data,
			success: options.success,
			error: options.error
		} );
	}

	getCommentLikeCounts();
} );
