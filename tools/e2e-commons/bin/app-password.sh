#!/usr/bin/env bash

set -e

if [ -z "$TEST_SITE" ]; then
	OUTPUT=$(pnpm jetpack docker --type e2e --name t1 wp eval 'print_r(WP_Application_Passwords::create_new_application_password(1,array("name"=>"e2e-".rand()))[0]);')
	export API_PASSWORD="${OUTPUT##*php}"
fi
