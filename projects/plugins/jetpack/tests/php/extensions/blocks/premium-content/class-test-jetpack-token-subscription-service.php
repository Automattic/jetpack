<?php

namespace Tests\Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Jetpack_Token_Subscription_Service;

// Overrides the way Jetpack_Token_Subscription_Service get its JWT key
class Test_Jetpack_Token_Subscription_Service extends Jetpack_Token_Subscription_Service {
	public function get_key() {
		return 'whatever';
	}
}
