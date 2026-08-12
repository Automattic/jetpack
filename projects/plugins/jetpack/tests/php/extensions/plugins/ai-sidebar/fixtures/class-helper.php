<?php
/**
 * WordPress.com Jetpack AI usage helper test double.
 *
 * @package automattic/jetpack
 */

namespace WPCOM\Jetpack_AI\Usage;

/**
 * Supplies the canonical initial quota expected by the sidebar test.
 */
class Helper {
	/**
	 * Return a canonical Free Simple quota snapshot.
	 *
	 * @param int $blog_id Blog ID.
	 * @return array
	 */
	public static function get_agent_quota_client_state( $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Matches the production API.
		return array(
			'product'   => 'jetpack-ai',
			'plan'      => 'free',
			'metered'   => true,
			'limit'     => 20,
			'used'      => 3,
			'remaining' => 17,
			'exhausted' => false,
			'upgrade'   => array(
				'kind' => 'jetpack-ai',
				'url'  => 'https://jetpack.com/redirect/?source=jetpack-ai-yearly-tier-upgrade-nudge&site=example.wordpress.com&path=jetpack_ai_yearly',
			),
		);
	}
}
