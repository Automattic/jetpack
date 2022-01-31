<?php
	Jetpack::init()->load_view( 'admin/network-activated-notice.php' );
	/** This action is already documented in views/admin/admin-page.php */
	do_action( 'jetpack_notices' );
