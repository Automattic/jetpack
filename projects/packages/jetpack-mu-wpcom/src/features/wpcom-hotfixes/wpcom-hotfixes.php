<?php
/**
 * Various hotfixes to WordPress.com
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_action(
	'wp_default_scripts',
	function ( $scripts ) {
		foreach ( array( 'react', 'react-dom', 'react-jsx-runtime' ) as $handle ) {
			if ( isset( $scripts->registered[ $handle ] ) ) {
				$scripts->registered[ $handle ]->ver = '18.3.1';
			}
		}
	},
	20 // priority 20 runs after Gutenberg's priority 10
);
