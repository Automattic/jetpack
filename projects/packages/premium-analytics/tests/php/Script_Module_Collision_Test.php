<?php
/**
 * Tests for script module collision when multiple plugins register
 * the same packageSources entry.
 *
 * Findings:
 *
 * 1. The generated modules.php uses deregister-before-register, making the
 *    last plugin to load the winner. This is intentional to override Core
 *    defaults but means cross-plugin collisions are possible.
 *
 * 2. WordPress native wp_register_script_module() is first-wins. Without
 *    deregister, the first plugin to register keeps its version.
 *
 * 3. Consumer modules (routes) that depend on a shared module are unaffected
 *    by re-registration. Their dependency declarations are stored independently
 *    and reference the module by ID, not by src or version.
 *
 * 4. Deregister also dequeues. If a module was enqueued between two plugins'
 *    registrations, the enqueue state is lost.
 *
 * Versioning strategy recommendation:
 *
 * Within the Jetpack monorepo all plugins share the same pnpm-lock.yaml,
 * so @automattic/number-formatters resolves to the same version everywhere
 * in a given build. The real risk is cross-release version skew where
 * plugin A ships release N and plugin B ships release N-1. Mitigations:
 *
 * - Keep packageSources entries semver-stable (no breaking changes between
 *   minor versions).
 * - Consider version-gating: skip deregistration when the registered
 *   version is >= the version being registered.
 * - For packages outside the monorepo, avoid packageSources and bundle
 *   the dependency inline instead.
 *
 * @package automattic/jetpack-premium-analytics
 * @see https://linear.app/a8c/issue/WOOA7S-1346
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\TestCase;

/**
 * Script module collision tests.
 *
 * Simulates two wp-build plugins registering the same script module ID
 * via the deregister-before-register pattern from modules.php.
 */
class Script_Module_Collision_Test extends TestCase {

	/**
	 * Original wp_script_modules global.
	 *
	 * @var mixed
	 */
	private $original_wp_script_modules;

	/**
	 * Fresh WP_Script_Modules instance for each test.
	 *
	 * @before
	 */
	#[Before]
	public function set_up_modules() {
		$this->original_wp_script_modules = $GLOBALS['wp_script_modules'] ?? null;
		$GLOBALS['wp_script_modules']     = new \WP_Script_Modules();
	}

	/**
	 * Restore original WP_Script_Modules after each test.
	 *
	 * @after
	 */
	#[After]
	public function tear_down_modules() {
		if ( null === $this->original_wp_script_modules ) {
			unset( $GLOBALS['wp_script_modules'] );
		} else {
			$GLOBALS['wp_script_modules'] = $this->original_wp_script_modules;
		}
	}

	/**
	 * Simulate the generated modules.php registration pattern.
	 *
	 * Each wp-build plugin's modules.php calls wp_deregister_script_module()
	 * before wp_register_script_module() to override previously registered
	 * versions (e.g. Core defaults).
	 *
	 * @see projects/packages/premium-analytics/build/modules.php:44-57
	 *
	 * @param string $id      Module ID.
	 * @param string $src     Module source URL.
	 * @param array  $deps    Module dependencies.
	 * @param string $version Module version.
	 */
	private function register_with_override( $id, $src, $deps, $version ) {
		wp_deregister_script_module( $id );
		wp_register_script_module(
			$id,
			$src,
			$deps,
			$version,
			array(
				'fetchpriority' => 'low',
				'in_footer'     => true,
			)
		);
	}

	/**
	 * Get the private $registered map from WP_Script_Modules via reflection.
	 *
	 * @return array
	 */
	private function get_registered_modules() {
		$instance = wp_script_modules();
		$prop     = new \ReflectionProperty( $instance, 'registered' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		return $prop->getValue( $instance );
	}

	/**
	 * Get data for a single registered module.
	 *
	 * @param string $id Module ID.
	 * @return array|null
	 */
	private function get_module_data( $id ) {
		$registered = $this->get_registered_modules();
		return $registered[ $id ] ?? null;
	}

	/**
	 * Last plugin wins when both use the deregister-then-register pattern.
	 *
	 * Both Plugin A and Plugin B register @automattic/number-formatters.
	 * Because modules.php always deregisters first, the last to load wins.
	 */
	public function test_last_plugin_wins_with_deregister_register() {
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);

		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		$module = $this->get_module_data( '@automattic/number-formatters' );
		$this->assertNotNull( $module );
		$this->assertSame( '2.0.0', $module['version'] );
		$this->assertStringContainsString( 'plugin-b', $module['src'] );
	}

	/**
	 * An older version wins if its plugin loads last.
	 *
	 * This is the main risk of cross-release version skew: Plugin B ships
	 * an older version and loads after Plugin A, overwriting the newer code.
	 */
	public function test_older_version_wins_if_loaded_last() {
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'1.0.0'
		);

		$module = $this->get_module_data( '@automattic/number-formatters' );
		$this->assertSame( '1.0.0', $module['version'] );
		$this->assertStringContainsString( 'plugin-b', $module['src'] );
	}

	/**
	 * Without deregister, first plugin wins (WordPress default).
	 *
	 * The wp_register_script_module() function only registers when the ID is not
	 * already present. This contrasts with the deregister-register
	 * pattern that wp-build's generated modules.php uses.
	 */
	public function test_first_plugin_wins_with_plain_register() {
		wp_register_script_module(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);

		wp_register_script_module(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		$module = $this->get_module_data( '@automattic/number-formatters' );
		$this->assertSame( '1.0.0', $module['version'] );
		$this->assertStringContainsString( 'plugin-a', $module['src'] );
	}

	/**
	 * Consumer module dependencies survive re-registration of a shared module.
	 *
	 * A route that depends on @automattic/number-formatters keeps its
	 * dependency declaration even after another plugin overwrites the
	 * shared module with a different version.
	 */
	public function test_consumer_dependencies_survive_reregistration() {
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);

		wp_register_script_module(
			'@plugin-a/dashboard',
			'https://example.com/plugin-a/dashboard.min.js',
			array(
				array(
					'id'     => '@automattic/number-formatters',
					'import' => 'static',
				),
			),
			'1.0.0'
		);

		// Plugin B overwrites the shared module.
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		// Consumer still declares its dependency.
		$consumer = $this->get_module_data( '@plugin-a/dashboard' );
		$this->assertNotNull( $consumer );

		$dep_ids = array_column( $consumer['dependencies'], 'id' );
		$this->assertContains( '@automattic/number-formatters', $dep_ids );

		// Shared module now resolves to Plugin B's version.
		$shared = $this->get_module_data( '@automattic/number-formatters' );
		$this->assertSame( '2.0.0', $shared['version'] );
	}

	/**
	 * Multiple consumers from different plugins share the winning module.
	 *
	 * Both plugin-a/dashboard and plugin-b/analytics depend on
	 * automattic/number-formatters. After Plugin B overwrites the shared
	 * module, both consumers resolve to Plugin B's version.
	 */
	public function test_multiple_consumers_share_overwritten_module() {
		// Plugin A registers shared module and its consumer.
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);
		wp_register_script_module(
			'@plugin-a/dashboard',
			'https://example.com/plugin-a/dashboard.min.js',
			array(
				array(
					'id'     => '@automattic/number-formatters',
					'import' => 'static',
				),
			),
			'1.0.0'
		);

		// Plugin B overwrites shared module and registers its own consumer.
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);
		wp_register_script_module(
			'@plugin-b/analytics',
			'https://example.com/plugin-b/analytics.min.js',
			array(
				array(
					'id'     => '@automattic/number-formatters',
					'import' => 'static',
				),
			),
			'1.0.0'
		);

		// Both consumers reference the same shared module ID.
		$consumer_a = $this->get_module_data( '@plugin-a/dashboard' );
		$consumer_b = $this->get_module_data( '@plugin-b/analytics' );

		$deps_a = array_column( $consumer_a['dependencies'], 'id' );
		$deps_b = array_column( $consumer_b['dependencies'], 'id' );

		$this->assertContains( '@automattic/number-formatters', $deps_a );
		$this->assertContains( '@automattic/number-formatters', $deps_b );

		// Shared module resolves to Plugin B (last wins).
		$shared = $this->get_module_data( '@automattic/number-formatters' );
		$this->assertSame( '2.0.0', $shared['version'] );
		$this->assertStringContainsString( 'plugin-b', $shared['src'] );
	}

	/**
	 * Deregister also removes enqueue state.
	 *
	 * If a consumer enqueues the shared module between two plugins'
	 * registrations, the deregister call in the second plugin's
	 * registration removes the enqueue state. The module must be
	 * re-enqueued explicitly.
	 */
	public function test_deregister_removes_enqueue_state() {
		wp_register_script_module(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);
		wp_enqueue_script_module( '@automattic/number-formatters' );

		$queue = wp_script_modules()->get_queue();
		$this->assertContains( '@automattic/number-formatters', $queue );

		// Another plugin deregisters and re-registers.
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		// Enqueue state is lost after deregister.
		$queue = wp_script_modules()->get_queue();
		$this->assertNotContains( '@automattic/number-formatters', $queue );
	}

	/**
	 * Dynamic import dependencies are preserved after re-registration.
	 *
	 * When a consumer declares a dynamic (lazy) import dependency on
	 * the shared module, the import type is retained even after the
	 * shared module is overwritten by another plugin.
	 */
	public function test_dynamic_import_dependencies_preserved() {
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-a/number-formatters.min.js',
			array(),
			'1.0.0'
		);

		// Consumer declares a dynamic import dependency (lazy-loaded).
		wp_register_script_module(
			'@plugin-a/dashboard',
			'https://example.com/plugin-a/dashboard.min.js',
			array(
				array(
					'id'     => '@automattic/number-formatters',
					'import' => 'dynamic',
				),
			),
			'1.0.0'
		);

		// Plugin B overwrites the shared module.
		$this->register_with_override(
			'@automattic/number-formatters',
			'https://example.com/plugin-b/number-formatters.min.js',
			array(),
			'2.0.0'
		);

		$consumer = $this->get_module_data( '@plugin-a/dashboard' );
		$dep      = $consumer['dependencies'][0];
		$this->assertSame( '@automattic/number-formatters', $dep['id'] );
		$this->assertSame( 'dynamic', $dep['import'] );
	}
}
