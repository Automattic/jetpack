<?php

namespace Automattic\Jetpack_Boost\REST_API\Permissions;

use Automattic\Jetpack_Boost\REST_API\Contracts\Permission;

class Current_User_Admin implements Permission {

	public function verify( $request ) {

		return current_user_can( 'manage_options' );
	}
}