<?php
/**
 * Compatibility-check orchestrator for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Ties the WP.org metadata source and the site state together and
 * applies the verdict rules. Kept free of WP.com / Atomic / AI-tooling
 * references so it can be lifted into the AI ability later unchanged.
 *
 * Verdict rules, in the order they run (first matching severity wins):
 *   1. `requires` > site WP  → block
 *   2. `requires_php` > site PHP → block
 *   3. `tested` < site WP    → warn
 *
 * Missing metadata fields skip the corresponding rule: if WP.org doesn't
 * declare `requires_php`, we don't speculate.
 */
class PCG_Compat_Checker {

	/**
	 * WP.org metadata source.
	 *
	 * @var PCG_Wporg_Source
	 */
	private $wporg;

	/**
	 * Site state (WP + PHP versions) reader.
	 *
	 * @var PCG_Site_State
	 */
	private $site;

	/**
	 * Construct the orchestrator.
	 *
	 * @param PCG_Wporg_Source $wporg Metadata source.
	 * @param PCG_Site_State   $site  Site state reader.
	 */
	public function __construct( PCG_Wporg_Source $wporg, PCG_Site_State $site ) {
		$this->wporg = $wporg;
		$this->site  = $site;
	}

	/**
	 * Run the pre-flight check for a plugin slug.
	 *
	 * @param string $slug WP.org plugin slug.
	 * @return PCG_Verdict
	 */
	public function check( $slug ) {
		$slug  = sanitize_key( $slug );
		$wporg = $this->wporg->fetch( $slug );
		$wp_v  = $this->site->wp_version();
		$php_v = $this->site->php_version();
		$raw   = array(
			'slug'  => $slug,
			'wporg' => $wporg,
			'site'  => array(
				'wp'  => $wp_v,
				'php' => $php_v,
			),
		);

		if ( null === $wporg ) {
			return new PCG_Verdict(
				PCG_Verdict::STATUS_WARN,
				array( sprintf( 'No WordPress.org metadata found for "%s".', $slug ) ),
				$raw
			);
		}

		$reasons = array();
		$status  = PCG_Verdict::STATUS_SAFE;

		if ( '' !== $wporg['requires'] && '' !== $wp_v && version_compare( $wp_v, $wporg['requires'], '<' ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf( 'Needs WordPress %s, site is on %s.', $wporg['requires'], $wp_v );
		}

		if ( '' !== $wporg['requires_php'] && version_compare( $php_v, $wporg['requires_php'], '<' ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf( 'Needs PHP %s, site is on %s.', $wporg['requires_php'], $php_v );
		}

		if ( PCG_Verdict::STATUS_BLOCK !== $status
			&& '' !== $wporg['tested']
			&& '' !== $wp_v
			&& version_compare( $wp_v, $wporg['tested'], '>' )
		) {
			$status    = PCG_Verdict::STATUS_WARN;
			$reasons[] = sprintf( 'Not tested on WordPress %s (plugin tested up to %s).', $wp_v, $wporg['tested'] );
		}

		if ( PCG_Verdict::STATUS_SAFE === $status ) {
			$reasons[] = sprintf(
				'%s is compatible with your site (WordPress %s, PHP %s).',
				$wporg['name'] !== '' ? $wporg['name'] : $slug,
				$wp_v,
				$php_v
			);
		}

		return new PCG_Verdict( $status, $reasons, $raw );
	}
}
