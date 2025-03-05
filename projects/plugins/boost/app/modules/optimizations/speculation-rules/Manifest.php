<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

/**
 * Handles the json manifest for the speculation rules.
 */
class Manifest {

	/**
	 * Get the manifest for the speculation rules.
	 *
	 * It must be a valid speculation rules manifest when serialized to json.
	 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules
	 *
	 * @return array
	 */
	public function get_manifest() {
		$manifest = array(
			'prerender' => array(
				array(
					'where'     => array(
						'or' => array(
							// Eagerly prerender the cornerstone pages for maximum speed
							array(
								'href_matches' => Cornerstone_Utils::get_list(),
							),

							// Prerender the next page
							array(
								'selector_matches' => array(
									'.navigation .nav-links .next',
									'.wp-block-query-pagination-next',
								),
							),
						),
					),
					'eagerness' => 'eager',
				),
			),
			'prefetch'  => array(
				array(
					'where'     => array(
						'and' => array(
							// Only internal links
							array(
								'href_matches' => '/*',
							),

							// Exclude URLs with file extensions except for HTML
							array(
								'or' => array(
									array(
										'not' => array(
											'href_matches' => '/*.*',
										),
									),
									array(
										'href_matches' => '/*.(html?$)#',
									),
								),
							),

							// Exclude URLs with specific paths
							array(
								'not' => array(
									'href_matches' => array(
										'/wp-admin{/*}?',
										'/wp-content{/*}?',
										'/wp-includes{/*}?',
										'/wp-json{/*}?',

										// Any url that contains a query string
										'/{*/}??*=*',
									),
								),
							),
							array(
								'not' => array(
									'selector_matches' => array(
										// No follow links
										'a[rel~="nofollow"]',

										// No prefetch links or links inside no-prefetch elements
										'.no-prefetch',
										'.no-prefetch *',
									),
								),
							),
							array(
								'not' => array(
									'selector_matches' => array(),
								),
							),
						),
					),
					'eagerness' => 'moderate',
				),
			),
		);

		/**
		 * Filters the manifest for the speculation rules.
		 *
		 * Find rules about the structure of the manifest at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules
		 *
		 * @param array $manifest The manifest.
		 */
		return apply_filters( 'jetpack_boost_speculation_rules_manifest', $manifest );
	}
}
