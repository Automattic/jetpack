<div
	class="<?php echo 'negative' === $instance['color-scheme'] ? 'negative ' : '';
	?>hide-on-<?php echo esc_attr( $instance['hide'] ); ?>"
	data-hide-timeout="<?php echo intval( $instance['hide-timeout'] ); ?>"
	id="eu-cookie-law"
>
	<form method="post">
		<input type="submit" value="<?php echo esc_attr( $instance['button'] ); ?>" class="accept" />
	</form>

	<?php if ( 'default' == $instance['text'] || empty( $instance['customtext'] ) ) {
		echo $instance['default-text'];
		?>
		<br />
		<?php
		esc_html_e( 'To find out more, as well as how to remove or block these, see here:', 'jetpack' );
	} else {
		echo esc_html( $instance['customtext'] );
	} ?>

	<a href="<?php
		$policy_link_text = 'default' === $instance['policy-url'] || empty( $instance['custom-policy-url'] )
			? $instance['default-policy-url']
			: $instance['custom-policy-url'];
		echo esc_url( $policy_link_text );
	?>" >
		<?php echo esc_html( $instance['policy-link-text'] ); ?>
	</a>
</div>
