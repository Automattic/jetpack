<?php

function should_use_new_global_nav() {
	return true;
}
add_filter( 'wpcom_global_nav_enabled', 'should_use_new_global_nav' );
