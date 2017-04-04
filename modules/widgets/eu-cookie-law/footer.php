<div
	class="<?php echo 'negative' === $instance['color-scheme'] ? 'negative ' : '';
	?>hide-on-<?php echo esc_attr( $instance['hide'] ); ?>"
	data-hide-timeout="<?php echo intval( $instance['hide-timeout'] ); ?>"
	id="eu-cookie-law"
>
	<form method="post">
		<?php wp_nonce_field( 'eucookielaw' ); ?>
		<input type="hidden" name="eucookielaw" value="accept" />
		<input type="hidden" name="redirect_url" value="<?php echo esc_attr( $_SERVER['REQUEST_URI'] ); ?>" />
		<input type="submit" value="<?php echo esc_attr( $instance['button'] ); ?>" class="accept" />
	</form>

	<?php if ( 'default' == $instance['text'] || empty( $instance['customtext'] ) ) {
		echo $defaults['default-text'];
		?>
		<br />
		<?php
		esc_html_e( 'To find out more, as well as how to remove or block these, see here:', 'jetpack' );
	} else {
		echo esc_html( $instance['customtext'] );
	} ?>

	<a href="<?php
		$policy_link_text = 'default' === $instance['policy-url'] || empty( $instance['custom-policy-url'] )
			? $defaults['default-policy-url']
			: $instance['custom-policy-url'];
		echo esc_url( $policy_link_text );
	?>" >
		<?php echo esc_html( $instance['policy-link-text'] ); ?>
	</a>
</div>

<script type="text/javascript">
	jQuery( function( $ ) {
		var overlay = $( '#eu-cookie-law' ), initialScrollPosition, scrollFunction;

		overlay.find( 'form' ).on( 'submit', accept );

		if ( overlay.hasClass( 'hide-on-scroll' ) ) {
			initialScrollPosition = $( window ).scrollTop();
			scrollFunction = function() {
				if ( Math.abs( $( window ).scrollTop() - initialScrollPosition ) > 50 ) {
					accept();
				}
			};
			$( window ).on( 'scroll', scrollFunction );
		} else if ( overlay.hasClass( 'hide-on-time' ) ) {
			setTimeout( accept, overlay.data( 'hide-timeout' ) * 1000 );
		}

		var accepted = false;
		function accept( event ) {
			if ( accepted ) {
				return;
			}
			accepted = true;

			if ( event && event.preventDefault ) {
				event.preventDefault();
			}

			if ( overlay.hasClass( 'hide-on-scroll' ) ) {
				$( window ).off( 'scroll', scrollFunction );
			}

			var expireTime = new Date();
			expireTime.setTime( expireTime.getTime() + <?php echo $cookie_validity * 1000; ?> );

			document.cookie = '<?php echo $cookie_name; ?>=' + expireTime.getTime() + ';path=/;expires=' + expireTime.toGMTString();

			overlay.fadeOut( 400, function() {
				overlay.remove();
			} );
		}
	} );
</script>
