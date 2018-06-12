<div
	class="<?php echo implode( ' ', $classes ); ?>"
	data-hide-timeout="<?php echo intval( $instance['hide-timeout'] ); ?>"
	data-consent-expiration="<?php echo intval( $instance['consent-expiration'] ); ?>"
	id="eu-cookie-law"
>
	<form method="post">
		<input type="submit" value="<?php echo esc_attr( $instance['button'] ); ?>" class="accept" />
	</form>

	<?php if ( 'default' == $instance['text'] || empty( $instance['customtext'] ) ) {
		echo nl2br( $instance['default-text'] );
	} else {
		echo nl2br( esc_html( $instance['customtext'] ) );
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
