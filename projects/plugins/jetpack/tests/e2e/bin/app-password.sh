#!/usr/bin/env bash

set -e

if [[ -z "$TEST_SITE" ]]; then
	OUTPUT=$($BASE_CMD wp eval 'print_r(WP_Application_Passwords::create_new_application_password(1,array("name"=>"e2e-".rand()))[0]);')
	export API_PASSWORD="${OUTPUT##*php}"
fi
