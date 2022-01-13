<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions;

class Current_User_Admin implements Permission {

	public function verify( $request ) {

		return current_user_can( 'manage_options' );
	}
}