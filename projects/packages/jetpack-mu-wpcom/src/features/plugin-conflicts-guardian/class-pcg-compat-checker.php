<?php
/**
 * Compatibility-check orchestrator for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Ties a metadata source (WP.org or local extraction) and the site
 * state together and applies the verdict rules. Kept free of WP.com /
 * Atomic / AI-tooling references so it can be lifted into the AI
 * ability later unchanged.
 *
 * Verdict rules, in the order they run (first matching severity wins):
 *   1. `requires` > site WP  → block
 *   2. `requires_php` > site PHP → block
 *   3. `tested` < site WP    → warn
 *   4. Any PHP parse error in the plugin's PHP files (upload mode) → block
 *
 * Missing metadata fields skip the corresponding rule: if the plugin
 * doesn't declare `requires_php`, we don't speculate.
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
		$slug     = sanitize_key( $slug );
		$metadata = $this->wporg->fetch( $slug );
		$raw      = array(
			'mode'     => 'slug',
			'slug'     => $slug,
			'metadata' => $metadata,
			'site'     => $this->site_raw(),
		);

		if ( null === $metadata ) {
			return new PCG_Verdict(
				PCG_Verdict::STATUS_WARN,
				array( sprintf( 'No WordPress.org metadata found for "%s".', $slug ) ),
				$raw
			);
		}

		return $this->build_verdict(
			$metadata,
			array(),
			$raw,
			array(
				'status' => 'skipped',
				'reason' => 'Load probe only runs for uploads.',
			)
		);
	}

	/**
	 * Run the pre-flight check against a directory holding an already-
	 * extracted plugin (typically produced by unzipping an upload).
	 *
	 * Adds a PHP syntax sweep on top of the version rules — any parse
	 * error escalates the verdict to block so the user doesn't install
	 * code that would fatal the site at activation.
	 *
	 * @param string $plugin_dir Absolute path to the extracted plugin.
	 * @return PCG_Verdict
	 */
	public function check_upload( $plugin_dir ) {
		$local    = new PCG_Local_Source();
		$syntax   = new PCG_Syntax_Checker();
		$metadata = $local->parse( $plugin_dir );
		$errors   = $syntax->check_dir( $plugin_dir );

		$load_probe = array(
			'status' => 'skipped',
			'reason' => 'Skipped because syntax errors were found; fix those first.',
		);
		if ( null !== $metadata && empty( $errors ) ) {
			$tester     = new PCG_Load_Tester();
			$load_probe = $tester->test( $metadata['main_file'] );
		}

		$raw = array(
			'mode'          => 'upload',
			'plugin_dir'    => $plugin_dir,
			'metadata'      => $metadata,
			'syntax_errors' => $errors,
			'load_probe'    => $load_probe,
			'site'          => $this->site_raw(),
		);

		if ( null === $metadata ) {
			return new PCG_Verdict(
				PCG_Verdict::STATUS_BLOCK,
				array( 'Could not find a valid WordPress plugin in the uploaded archive (missing Plugin Name header).' ),
				$raw
			);
		}

		return $this->build_verdict( $metadata, $errors, $raw, $load_probe );
	}

	/**
	 * Apply the verdict rules to a metadata array + syntax-error list.
	 * Shared between the slug path (no syntax errors ever) and the
	 * upload path.
	 *
	 * @param array $metadata   Plugin metadata in the shared shape.
	 * @param array $errors     List of syntax errors; empty when none.
	 * @param array $raw        Raw inputs for debug display.
	 * @param array $load_probe Load-probe result from PCG_Load_Tester (upload mode) or a skipped stub.
	 * @return PCG_Verdict
	 */
	private function build_verdict( array $metadata, array $errors, array $raw, array $load_probe ) {
		$wp_v    = $this->site->wp_version();
		$php_v   = $this->site->php_version();
		$reasons = array();
		$status  = PCG_Verdict::STATUS_SAFE;

		if ( '' !== $metadata['requires'] && '' !== $wp_v && version_compare( $wp_v, $metadata['requires'], '<' ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf( 'Needs WordPress %s, site is on %s.', $metadata['requires'], $wp_v );
		}

		if ( '' !== $metadata['requires_php'] && version_compare( $php_v, $metadata['requires_php'], '<' ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf( 'Needs PHP %s, site is on %s.', $metadata['requires_php'], $php_v );
		}

		if ( ! empty( $errors ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf(
				'%d PHP file(s) failed to parse — the plugin would fatal on activation.',
				count( $errors )
			);
			foreach ( $errors as $err ) {
				$reasons[] = sprintf(
					'  • %s (line %d): %s',
					basename( $err['file'] ),
					$err['line'],
					$err['message']
				);
			}
		}

		if ( 'fatal' === ( $load_probe['status'] ?? '' ) || 'throwable' === ( $load_probe['status'] ?? '' ) ) {
			$status    = PCG_Verdict::STATUS_BLOCK;
			$reasons[] = sprintf(
				'Plugin fatals during load: %s (%s, line %d).',
				(string) ( $load_probe['message'] ?? 'unknown error' ),
				basename( (string) ( $load_probe['file'] ?? '' ) ),
				(int) ( $load_probe['line'] ?? 0 )
			);
		} elseif ( 'error' === ( $load_probe['status'] ?? '' ) ) {
			if ( PCG_Verdict::STATUS_SAFE === $status ) {
				$status = PCG_Verdict::STATUS_WARN;
			}
			$reasons[] = sprintf(
				'Load probe could not complete: %s',
				(string) ( $load_probe['reason'] ?? 'unknown error' )
			);
		}

		if ( PCG_Verdict::STATUS_BLOCK !== $status
			&& '' !== $metadata['tested']
			&& '' !== $wp_v
			&& version_compare( $wp_v, $metadata['tested'], '>' )
		) {
			$status    = PCG_Verdict::STATUS_WARN;
			$reasons[] = sprintf( 'Not tested on WordPress %s (plugin tested up to %s).', $wp_v, $metadata['tested'] );
		}

		if ( PCG_Verdict::STATUS_SAFE === $status ) {
			$reasons[] = sprintf(
				'%s is compatible with your site (WordPress %s, PHP %s).',
				'' !== $metadata['name'] ? $metadata['name'] : 'This plugin',
				$wp_v,
				$php_v
			);
		}

		return new PCG_Verdict( $status, $reasons, $raw );
	}

	/**
	 * Capture the current site versions for the debug payload.
	 *
	 * @return array
	 */
	private function site_raw() {
		return array(
			'wp'  => $this->site->wp_version(),
			'php' => $this->site->php_version(),
		);
	}
}
