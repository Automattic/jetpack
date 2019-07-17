<div class='jetpack-simple-payments-disabled-error'>
	<p>
		<?php
			jetpack_require_lib( 'upgrade-nudge' );
			echo Jetpack_Upgrade_Nudge::get_upgrade_message();
		?>
	</p>
</div>
