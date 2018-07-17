<div class='jetpack-simple-payments-disabled-error'>
	<p>
	<?php
	printf(
		wp_kses(
			__( 'Your plan doesn\'t include Simple Payments. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more and upgrade</a>.', 'jetpack' ),
			array( 'a' => array( 'href' => array(), 'target' => array() ) )
		),
		esc_url( $support_url )
	);
	?>
	</p>
</div>
