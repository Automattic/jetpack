#!/bin/bash

exec php <<'EOF'
<?php

if ( version_compare( PHP_VERSION, '7.2.0', '<' ) ) {
	echo 'PHP version is too old to run tests. 7.2 is required, but ' . PHP_VERSION . " is installed.\n";
	exit( 1 );
}
EOF
