jQuery(document).ready(function($){
	wpcom_followed_blogs = {

		setup_avatar_tips: function() {

			$( '.wpcom-follow-gravatar a' ).each( function () {
				$( this ).data( 'hover', false );
			});

			$( '.wpcom-follow-gravatar' ).on( 'mouseenter', 'a', function( e ) {
				$( this ).data( 'hover', true );
				var $self                    = $(this),
					$bubble                  = $( '#' + $self.data( 'id' ) ),
					avatar_width             = $self.find( 'img' ).width(),
					offset                   = $self.find( 'img' ).offset(),
					top                      = ( offset.top + avatar_width ),
					bubble_width             = $bubble.width() + parseInt( $bubble.css( 'padding-left').replace( 'px', '' ), 10 ) + parseInt( $bubble.css( 'padding-right').replace( 'px', '' ), 10 ),
					bubble_left              = offset.left - ( bubble_width - avatar_width ) / 2,
					window_collision_padding = 10;

				$bubble.removeClass( 'bubble-left' );
				$bubble.removeClass( 'bubble-right' );

				// detect a collision on the left of the screen and place the bubble at the edge of the window with a bit of padding
				if ( bubble_left < 0 ) {
					bubble_left = offset.left - window_collision_padding;
					$bubble.addClass( 'bubble-left' );
				}

				// detect a collision on the right of the screen and place the bubble at the edge of the window with a bit of padding
				if ( ( bubble_left + bubble_width ) > $(window).width() ) {
					var avatar_position = $self.position();
					var avatar_right = avatar_position.left + avatar_width;
					bubble_left = avatar_right - bubble_width - window_collision_padding;
					$bubble.addClass( 'bubble-right' );
				}

				$bubble.css( { top: top, left: bubble_left } ).addClass( 'fadein' );

			});

			$( '.wpcom-follow-bubbles' ).on( 'mouseenter', 'div', function( e ) {
				$( this ).data( 'hover', true );
			});

			$( '.wpcom-follow-bubbles > div, .wpcom-follow-gravatar a' ).on( 'mouseleave', null, function( e ) {
				var $self = $(this);

				// determine if current event is occuring on the bubble or on the bla/gra/vatar & set vars accordingly
				if ( $self.hasClass('wpcom-bubble') ) {
					var $bubble = $self;
					var $gravatar = $('.wpcom-follow-gravatar a[data-id="' + $self.attr('id') + '"]');
				} else {
					var $bubble = $( '#' + $self.data( 'id' ) );
					var $gravatar = $self;
				}

				$self.data( 'hover', false );

				// small delay so mouseenter has a chance to run and set hover to true if the mouse is back on the bubble
				setTimeout( function () {
					if ( !$bubble.data( 'hover' ) && !$gravatar.data( 'hover' ) ) {
						$bubble.removeClass( 'fadein' );
					}
				}, 100);
			});

		}

	}

	wpcom_followed_blogs.setup_avatar_tips();
});
