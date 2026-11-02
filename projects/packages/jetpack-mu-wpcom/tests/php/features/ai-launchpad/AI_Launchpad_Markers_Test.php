<?php
/**
 * Guards the marker-meta contract between each AI Launchpad content creator (JS) and the listener
 * that completes its task (PHP).
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/fixtures/trait-stubs-marker-draft.php';

/**
 * A creator module (js/lib/<slug>.ts) tags its draft with a marker meta key that its listener
 * (class-ai-launchpad-<slug>-listener.php) watches for; nothing but two matching strings connects them.
 * Listeners are discovered by glob, so a new content task is covered without being listed here.
 */
class AI_Launchpad_Markers_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Stubs_Marker_Draft;

	/**
	 * How a creator module sets its marker meta on the draft it POSTs.
	 */
	const MARKER_PATTERN = '/meta:\s*\{\s*(_wpcom_ai_launchpad_[a-z0-9_]+)\s*:/';

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$this->flush_marker_drafts();
		parent::tear_down();
	}

	/**
	 * Every listener's marker must be the key its creator module actually writes.
	 */
	public function test_every_listener_marker_matches_its_creator_module() {
		foreach ( $this->marker_listeners() as $slug => $listener ) {
			$source = $this->creator_source( $slug );
			$this->assertNotSame(
				'',
				$source,
				"{$listener['class']} declares a marker but there is no js/lib/{$slug}.ts to write it, so nothing ever tags a draft for it."
			);

			$this->assertSame(
				1,
				preg_match( self::MARKER_PATTERN, $source, $found ),
				"js/lib/{$slug}.ts sets no marker meta on the draft it creates, so {$listener['class']} can never complete its task."
			);

			$this->assertSame(
				$listener['key'],
				$found[1],
				"js/lib/{$slug}.ts tags its draft '{$found[1]}' but {$listener['class']}::META_KEY looks for '{$listener['key']}'. The task would never complete."
			);
		}
	}

	/**
	 * No creator may write a marker that no listener owns, which the forward test cannot see for a creator whose
	 * filename breaks the convention.
	 */
	public function test_no_creator_writes_a_marker_no_listener_owns() {
		$owned = array_column( $this->marker_listeners(), 'key' );

		$written = array();
		foreach ( glob( $this->feature_dir() . 'js/lib/*.ts' ) as $path ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
			if ( preg_match( self::MARKER_PATTERN, (string) file_get_contents( $path ), $found ) ) {
				$written[ basename( $path ) ] = $found[1];
			}
		}
		$this->assertNotEmpty( $written, 'Found no creator module writing a marker — js/lib could not be read.' );

		foreach ( $written as $module => $key ) {
			$this->assertContains(
				$key,
				$owned,
				"js/lib/{$module} tags its draft '{$key}', which no listener watches for. The page gets created and the task stays open forever."
			);
		}
	}

	/**
	 * Each creator must POST to the post type its marker is registered for, or the REST API drops the meta.
	 */
	public function test_each_creator_posts_to_the_type_its_marker_is_registered_for() {
		foreach ( $this->marker_listeners() as $slug => $listener ) {
			$this->assertNotSame( '', $listener['post_type'], "{$listener['class']} registers its marker for no post type." );

			$source = $this->creator_source( $slug );
			if ( '' === $source ) {
				continue;
			}

			$this->assertSame(
				1,
				preg_match( "#path:\s*'(/wp/v2/[a-z0-9_-]+)'#", $source, $found ),
				"js/lib/{$slug}.ts POSTs to no /wp/v2 route."
			);

			// Core's rest_base for `post` and `page` is the type plus an `s`.
			$this->assertSame(
				'/wp/v2/' . $listener['post_type'] . 's',
				$found[1],
				"js/lib/{$slug}.ts creates its draft at {$found[1]} but {$listener['class']} registers '{$listener['key']}' for the '{$listener['post_type']}' type, so the REST API drops the marker and the task never completes."
			);
		}
	}

	/**
	 * Every marker is distinct, registered on init, and the key its listener's draft lookup queries.
	 */
	public function test_every_listener_registers_and_queries_its_own_marker() {
		$listeners = array_values( $this->marker_listeners() );
		$keys      = array_column( $listeners, 'key' );
		$this->assertSame( $keys, array_values( array_unique( $keys ) ) );

		foreach ( $listeners as $index => $listener ) {
			$listener['class']::register();
			$this->stub_marker_draft( $listener['key'], 1000 + $index );
		}
		do_action( 'init' );

		foreach ( $listeners as $index => $listener ) {
			$this->assertTrue( registered_meta_key_exists( 'post', $listener['key'], $listener['post_type'] ), "{$listener['class']} does not register its marker." );
			$this->assertSame( 1000 + $index, $listener['class']::get_draft_id(), "{$listener['class']} looks its draft up by another key." );
		}
	}

	/**
	 * The listeners that declare a marker, keyed by the slug their creator module shares.
	 *
	 * The key is read through the loaded constant; the post type from the source, since register_post_meta()
	 * only runs on `init`.
	 *
	 * @return array<string, array{class: string, key: string, post_type: string}>
	 */
	private function marker_listeners() {
		$listeners = array();

		foreach ( glob( $this->feature_dir() . 'class-ai-launchpad-*-listener.php' ) as $path ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
			$source = (string) file_get_contents( $path );
			if ( ! preg_match( '/^class\s+(\w+)/m', $source, $found ) ) {
				continue;
			}

			$class = $found[1];
			//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
			require_once $path;
			if ( ! defined( "$class::META_KEY" ) ) {
				continue;
			}

			$slug               = preg_replace( '/^class-ai-launchpad-|-listener\.php$/', '', basename( $path ) );
			$listeners[ $slug ] = array(
				'class'     => $class,
				'key'       => constant( "$class::META_KEY" ),
				'post_type' => preg_match( "/register_post_meta\(\s*'([a-z0-9_-]+)'/", $source, $type ) ? $type[1] : '',
			);
		}

		$this->assertNotEmpty( $listeners, 'Found no listeners declaring a marker meta key — the feature directory could not be read.' );

		return $listeners;
	}

	/**
	 * The source of the creator module paired with a listener slug, or '' when there is none.
	 *
	 * @param string $slug Shared listener/creator slug, e.g. `gallery-page`.
	 * @return string
	 */
	private function creator_source( $slug ) {
		$path = $this->feature_dir() . 'js/lib/' . $slug . '.ts';
		if ( ! file_exists( $path ) ) {
			return '';
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		return (string) file_get_contents( $path );
	}

	/**
	 * The AI Launchpad feature directory, trailing slash included.
	 *
	 * @return string
	 */
	private function feature_dir() {
		return __DIR__ . '/../../../../src/features/ai-launchpad/';
	}
}
