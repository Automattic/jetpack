<?php
/**
 * Guards the marker-meta contract between each AI Launchpad content creator (JS) and the listener
 * that completes its task (PHP).
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Every content task is created in the browser and completed on the server, and the two halves never
 * meet. The creator module POSTs a draft carrying a marker meta key written as an object-literal key;
 * the listener watches for that same key on publish, declared as a `META_KEY` constant. Nothing but
 * agreement between two independent strings connects them.
 *
 * That agreement had no test. Changing a listener's `META_KEY` alone left the entire suite green —
 * the PHP tests read the constant, the JS tests pin the literal, so each half stayed self-consistent
 * — while in production the draft would be created under one key and looked for under another: the
 * task never completes, the card never ticks, and nothing anywhere errors.
 *
 * So this reads both halves off disk and compares them, in the same spirit as
 * AI_Launchpad_Task_Menu_Test parsing prompts.ts. Listeners are discovered by glob rather than
 * listed, and each one's creator module is derived from its filename, so a content task added later
 * is covered without anyone remembering to come back here.
 */
class AI_Launchpad_Markers_Test extends \WorDBless\BaseTestCase {

	/**
	 * Marker meta keys are namespaced, which is what makes both halves greppable.
	 */
	const MARKER_PREFIX = '_wpcom_ai_launchpad_';

	/**
	 * Every listener's marker must be the key its creator module actually writes.
	 *
	 * This is the assertion the bug would have tripped: change either side's string and the two no
	 * longer agree.
	 */
	public function test_every_listener_marker_matches_its_creator_module() {
		$listeners = $this->marker_listeners();
		$this->assertNotEmpty( $listeners, 'Found no listeners declaring a marker meta key — the feature directory could not be read.' );

		foreach ( $listeners as $slug => $listener ) {
			$source = $this->creator_source( $slug );
			$this->assertNotSame(
				'',
				$source,
				"{$listener['class']} declares a marker but there is no js/lib/{$slug}.ts to write it, so nothing ever tags a draft for it."
			);

			$this->assertSame(
				1,
				preg_match( '/meta:\s*\{\s*(' . self::MARKER_PREFIX . '[a-z0-9_]+)\s*:/', $source, $found ),
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
	 * No creator may write a marker that no listener owns.
	 *
	 * The other direction, and not redundant: a creator whose filename breaks the convention, or one
	 * shipped before its listener, is invisible to the forward test. Both produce a task that builds
	 * a perfectly good page and then never ticks.
	 */
	public function test_no_creator_writes_a_marker_no_listener_owns() {
		$owned = array_column( $this->marker_listeners(), 'key' );

		$written = array();
		foreach ( glob( $this->feature_dir() . 'js/lib/*.ts' ) as $path ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
			$source = (string) file_get_contents( $path );
			if ( preg_match( '/meta:\s*\{\s*(' . self::MARKER_PREFIX . '[a-z0-9_]+)\s*:/', $source, $found ) ) {
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
	 * Each creator must POST to the post type its marker is registered for.
	 *
	 * The same silent break by a different route: `register_post_meta()` is per post type, and the
	 * REST API drops meta it has no registration for on that type. A creator posting a page while its
	 * marker is registered for posts writes nothing at all, and the draft arrives unmarked.
	 *
	 * The expected route is the type plus an `s`, which is core's own rest_base for `post` and `page`.
	 * A future custom post type with its own rest_base would fail here and need this widened — loudly,
	 * which is the point.
	 */
	public function test_each_creator_posts_to_the_type_its_marker_is_registered_for() {
		$listeners = $this->marker_listeners();
		$this->assertNotEmpty( $listeners, 'Found no listeners declaring a marker meta key — the feature directory could not be read.' );

		foreach ( $listeners as $slug => $listener ) {
			$this->assertNotSame( '', $listener['post_type'], "{$listener['class']} registers its marker for no post type." );

			$source = $this->creator_source( $slug );
			if ( '' === $source ) {
				// Reported against the marker itself by test_every_listener_marker_matches_its_creator_module.
				continue;
			}

			$this->assertSame(
				1,
				preg_match( "#path:\s*'(/wp/v2/[a-z0-9_-]+)'#", $source, $found ),
				"js/lib/{$slug}.ts POSTs to no /wp/v2 route."
			);

			$this->assertSame(
				'/wp/v2/' . $listener['post_type'] . 's',
				$found[1],
				"js/lib/{$slug}.ts creates its draft at {$found[1]} but {$listener['class']} registers '{$listener['key']}' for the '{$listener['post_type']}' type, so the REST API drops the marker and the task never completes."
			);
		}
	}

	/**
	 * The listeners that declare a marker, keyed by the slug their creator module shares.
	 *
	 * `class-ai-launchpad-gallery-page-listener.php` yields slug `gallery-page`, which is
	 * `js/lib/gallery-page.ts`. Listeners with no marker (social, subscribers, theme…) watch other
	 * signals entirely and have no creator half; they are skipped rather than failed.
	 *
	 * The key is read through the loaded constant rather than the source text, so this compares what
	 * PHP actually runs. The post type is read from the source, since `register_post_meta()` only
	 * runs on `init`.
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
