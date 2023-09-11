<?php

namespace Automattic\Jetpack_Boost\REST_API\Permissions;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack_Boost\REST_API\Contracts\Permission;

class Signed_With_Blog_Token implements Permission {

	// $request is required to adhere to the contract.
	//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function verify( $request ) {
		return apply_filters(
			'jetpack_boost_signed_with_blog_token_verify',
			Rest_Authentication::is_signed_with_blog_token()
		);
	}
}
