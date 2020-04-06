<div class='jetpack-simple-payments-disabled-error'>
	<p>
		<?php
			$support_url = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
				? 'https://support.wordpress.com/simple-payments/'
				: 'https://jetpack.com/support/simple-payment-button/';
			printf(
				wp_kses(
					__( 'Your plan doesn\'t include Simple Payments. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more and upgrade</a>.', 'jetpack' ),
					array( 'a' => array( 'href' => array(), 'rel' => array(), 'target' => array() ) )
				),
				esc_url( $support_url )
			);
		?>
	</p>
</div>
