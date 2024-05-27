<?php

namespace Automattic\Jetpack_Boost\Optimizations\Speculative_Loading;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Speculative_Loading implements Pluggable, Optimization, Changes_Page_Output {
	public static function is_available(): bool {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) ) {
			return \JETPACK_BOOST_ALPHA_FEATURES === true;
		}

		return false;
	}

	/**
	 * Setup the module.
	 *
	 * @return void
	 */
	public function setup() {
		add_action( 'wp_footer', array( $this, 'add_speculative_loading' ) );
	}

	public static function get_slug() {
		return 'speculative_loading';
	}

	public function is_ready() {
		return true;
	}

	private function get_rules() {
		return array(
			'prerender' => array(
				array(
					'source'    => 'document',
					'where'     => array(
						'and' => array(
							array(
								'href_matches' => site_url() . '/*', // Any internal URL.
							),
							array(
								'not' => array(
									'href_matches' => array(
										'*.php', // Avoid PHP files.
										'/wp-admin/*', // Avoid admin pages.
										'?*=*', // Avoid any URL with query parameters.
									),
								),
							),
						),
					),
					'eagerness' => 'moderate',
				),
			),
		);
	}

	public function add_speculative_loading() {
		echo '<script type="speculationrules">';
		echo wp_json_encode( $this->get_rules() );
		echo '</script>';
	}
}
