<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Speculation_Rules implements Pluggable, Optimization, Changes_Page_Output {
	public static function is_available() {
		return true;
	}

	/**
	 * Setup the module.
	 *
	 * @return void
	 */
	public function setup() {
		add_action( 'wp_footer', array( $this, 'add_speculation_rules' ) );
	}

	public static function get_slug() {
		return 'speculation_rules';
	}

	public function is_ready() {
		return true;
	}

	private function get_rules() {

		/**
		 * Filters the URLs that should not have speculation rules applied to them.
		 *
		 * @param array $url_exceptions The URLs that should not have speculation rules applied to them.
		 */
		$url_exceptions = apply_filters(
			'jetpack_boost_speculation_rules_url_exceptions',
			array(
				'wp-*.php', // Avoid PHP files.
				'/wp-admin/*', // Avoid admin pages.
				'/wp-includes/*', // Avoid WordPress core files.
				'/wp-content/*', // Avoid WordPress content files.
				'*.?*', // Avoid files with extensions
				'?*=*', // Avoid any URL with query parameters.
			)
		);

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
									'href_matches' => $url_exceptions,
								),
							),
						),
					),
					'eagerness' => 'moderate',
				),
			),
		);
	}

	public function add_speculation_rules() {
		echo '<script type="speculationrules">';
		echo wp_json_encode( $this->get_rules() );
		echo '</script>';
	}
}
