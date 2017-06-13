var jetpackCommentLikeCount;

( function( $ ) {
	jetpackCommentLikeCount = {
		jsonAPIbase: 'https://public-api.wordpress.com/rest/v1',
		APIqueue: [],

		getCommentLikeCounts: function() {
			$( '.comment-like-count' ).each( function() {
				var blogId = $( this ).attr( 'data-blog-id' );
				var commentId = $( this ).attr( 'data-comment-id' );

				jetpackCommentLikeCount.APIqueue.push( '/sites/' + blogId + '/comments/' + commentId + '/likes' );
			} );

			jetpackCommentLikeCount.fetchCounts();
		},

		showCount: function( commentId, count ) {
			if ( count > 0 ) {
				$( '#comment-like-count-' + commentId ).find( '.like-count' ).hide();
				$( '#comment-like-count-' + commentId ).find( '.like-count' ).text( count );
				$( '#comment-like-count-' + commentId ).find( '.like-count' ).fadeIn();
			}
		},

		fetchCounts: function() {
			var batchRequest = {
				path:    '/batch',
				data:    'urls[]=' + jetpackCommentLikeCount.APIqueue.join( '&urls[]=' ),
				success: function( response ) {
					for ( var path in response ) {
						if ( ! response[ path ].error_data ) {
							var urlPieces = path.split( '/' );
							var commentId = urlPieces[ 4 ];
							jetpackCommentLikeCount.showCount( commentId, response[ path ].found );
						}
					}
				},
				error: function() {}
			};

			jetpackCommentLikeCount.request( batchRequest );
		},

		request: function( options ) {
			return $.ajax( {
				type: 'GET',
				url: jetpackCommentLikeCount.jsonAPIbase + options.path,
				dataType : 'jsonp',
				data: options.data,
				success: function( response ) {
					options.success( response );
				},
				error: function( response ) {
					options.error( response );
				}
			} );
		}
	};
} )( jQuery );

jQuery( document ).ready( function() {
	jetpackCommentLikeCount.getCommentLikeCounts();
} );
