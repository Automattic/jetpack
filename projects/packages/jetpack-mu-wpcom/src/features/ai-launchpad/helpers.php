<?php
/**
 * AI Launchpad shared helpers used by more than one class.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_ai_launchpad_remap_task_id' ) ) {
	/**
	 * Normalizes a persisted task id onto the task the AI Launchpad actually renders.
	 *
	 * Some catalog tasks are broken or meaningless in this context, so their ids are replaced on
	 * read: `woo_launch_site` dead-ends in the WooCommerce onboarding list and never completes when
	 * the guided setup was skipped; `post_sharing_enabled` is born completed (the sharing module is
	 * active by default on wpcom); `design_selected` is born completed and `design_completed` has no
	 * wp-admin completion path, so both consolidate onto the actionable `site_theme_selected` task.
	 * Catalog `id_map` twins are the same underlying task under two names, so each pair collapses
	 * onto the one the menu still offers. The prompt no longer offers any of these ids, so this only
	 * catches stray AI emissions and outputs persisted before the replacement.
	 *
	 * @param string $task_id A task id from the persisted AI output.
	 * @return string The task id to render (and listen/skip) instead.
	 */
	function wpcom_ai_launchpad_remap_task_id( $task_id ) {
		$remap = array(
			'woo_launch_site'                 => 'site_launched',
			'post_sharing_enabled'            => 'connect_social_media',
			'design_selected'                 => 'site_theme_selected',
			'design_completed'                => 'site_theme_selected',
			// id_map twins, keyed dropped => kept.
			'drive_traffic'                   => 'connect_social_media',
			'first_post_published_newsletter' => 'first_post_published',
			'link_in_bio_launched'            => 'site_launched',
			'videopress_launched'             => 'site_launched',
			'subscribers_added'               => 'import_subscribers',
		);

		return $remap[ $task_id ] ?? $task_id;
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_tracks_context' ) ) {
	/**
	 * The shared analytics context merged into every AI Launchpad Tracks event, mirroring the
	 * client-side context in `js/lib/tracks.ts`. Values are null until the corresponding data
	 * exists. Only model-inferred fields are included — never the user's raw title/description
	 * (`brand_name`/`tagline` echo them near-verbatim and are excluded).
	 *
	 * @param string[]|null $rendered_task_ids The rendered task ids, when the caller has them.
	 * @return array The context props.
	 */
	function wpcom_ai_launchpad_tracks_context( $rendered_task_ids = null ) {
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );
		$inferred  = array();
		if ( is_array( $ai_output ) && isset( $ai_output['payload']['inferred'] ) && is_array( $ai_output['payload']['inferred'] ) ) {
			$inferred = $ai_output['payload']['inferred'];
		}

		$string_or_null = static function ( $value ) {
			return is_string( $value ) && '' !== trim( $value ) ? $value : null;
		};

		$goal = $string_or_null( $inferred['goal'] ?? null );
		if ( null === $goal ) {
			$wizard = get_option( 'wpcom_ai_launchpad_wizard' );
			$goal   = is_array( $wizard ) ? $string_or_null( $wizard['goal'] ?? null ) : null;
		}

		return array(
			'goal'           => $goal,
			'niche'          => $string_or_null( $inferred['niche'] ?? null ),
			'theme_category' => $string_or_null( $inferred['theme_category'] ?? null ),
			'vibe'           => $string_or_null( $inferred['vibe'] ?? null ),
			'audience'       => $string_or_null( $inferred['audience'] ?? null ),
			'rendered_list'  => is_array( $rendered_task_ids ) ? wp_json_encode( array_values( $rendered_task_ids ), JSON_UNESCAPED_SLASHES ) : null,
			'inferred_goal'  => $string_or_null( $inferred['inferred_goal'] ?? null ),
		);
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_record_tracks_event' ) ) {
	/**
	 * Records an AI Launchpad Tracks event server-side with the shared context merged in,
	 * so call sites can't forget it. Explicit props win over the context.
	 *
	 * @param string        $event_name        The Tracks event name, already feature-prefixed.
	 * @param array         $props             Event properties. No PII: task IDs are fine, free text is not.
	 * @param string[]|null $rendered_task_ids The rendered task ids, when the caller has them.
	 * @return void
	 */
	function wpcom_ai_launchpad_record_tracks_event( $event_name, $props = array(), $rendered_task_ids = null ) {
		$props = array_merge( wpcom_ai_launchpad_tracks_context( $rendered_task_ids ), $props );
		// Null-valued props are omitted, mirroring the client recorder.
		$props = array_filter(
			$props,
			static function ( $value ) {
				return null !== $value;
			}
		);

		/**
		 * Fires for every server-side AI Launchpad analytics event, before it is sent to
		 * Tracks. Exists as an observation seam (tests hook it; neither Tracks client is
		 * loaded in the unit-test environment).
		 *
		 * @param string $event_name The Tracks event name.
		 * @param array  $props      The merged event properties.
		 */
		do_action( 'wpcom_ai_launchpad_tracks_event', $event_name, $props );

		if ( function_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event' ) ) {
			\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event( $event_name, $props );
		}
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_get_ai_task_ids' ) ) {
	/**
	 * The AI-selected task IDs from the `wpcom_ai_launchpad_ai_output` option, remapped
	 * onto the ids the launchpad renders so listeners and skip validation see the same
	 * ids as the task cards.
	 *
	 * @return string[] Task IDs, empty when the option is unset or malformed.
	 */
	function wpcom_ai_launchpad_get_ai_task_ids() {
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );
		if ( ! is_array( $ai_output ) || ! isset( $ai_output['payload'] ) || ! is_array( $ai_output['payload'] ) ) {
			return array();
		}
		$payload = $ai_output['payload'];

		$task_ids = array();
		if ( isset( $payload['tasks'] ) && is_array( $payload['tasks'] ) ) {
			foreach ( $payload['tasks'] as $task ) {
				if ( is_array( $task ) && isset( $task['id'] ) && is_string( $task['id'] ) ) {
					$task_ids[] = wpcom_ai_launchpad_remap_task_id( $task['id'] );
				}
			}
		}

		$task_ids = array_values( array_unique( $task_ids ) );

		// Sell sites always render a Choose-a-theme task (see AI_Launchpad_REST::get_current_tasks), so the
		// switch_theme listener and skip validation must count it even when the AI did not pick one — and
		// even when a partial write left the payload with an inferred goal but no task list.
		$goal = isset( $payload['inferred']['goal'] ) && is_string( $payload['inferred']['goal'] ) ? $payload['inferred']['goal'] : '';
		if ( 'sell' === $goal && ! in_array( 'site_theme_selected', $task_ids, true ) ) {
			$task_ids[] = 'site_theme_selected';
		}

		return $task_ids;
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_script_translations_inline' ) ) {
	/**
	 * Builds the inline `setLocaleData` call carrying the Site Setup app bundle's translations.
	 *
	 * Route modules built by wp-build have no core translation-loading path, so the language-pack
	 * JED produced by translate.wordpress.com is inlined onto the page's prerequisites script. The
	 * pack keys each JSON to the md5 of the source reference `wp i18n make-pot` recorded — the
	 * unminified route bundle kept in the production build for exactly this purpose. On Atomic
	 * the pack is installed to `WP_LANG_DIR/mu-plugins/` by the `wpcomsh_translation_update`
	 * cron; where no file exists (English, or packs not yet synced) this is a no-op.
	 *
	 * @param string      $locale   The locale to load, usually `determine_locale()`.
	 * @param string|null $lang_dir Directory holding the pack files. Defaults to `WP_LANG_DIR . '/mu-plugins'`.
	 * @return string|null The inline script, or null when no usable JED file exists.
	 */
	function wpcom_ai_launchpad_script_translations_inline( $locale, $lang_dir = null ) {
		$lang_dir  = $lang_dir ?? WP_LANG_DIR . '/mu-plugins';
		$reference = 'jetpack_vendor/automattic/jetpack-mu-wpcom/build/routes/site-setup/content.js';
		$file      = $lang_dir . '/jetpack-mu-wpcom-' . $locale . '-' . md5( $reference ) . '.json';

		if ( ! is_readable( $file ) ) {
			return null;
		}

		$data     = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local language-pack file.
		$messages = $data['locale_data']['messages'] ?? null;
		if ( ! is_array( $messages ) || array() === $messages ) {
			return null;
		}

		// HEX_TAG keeps a literal "</script>" in a translation from closing the inline script tag.
		return 'wp.i18n.setLocaleData( ' . wp_json_encode( $messages, JSON_HEX_TAG | JSON_HEX_AMP ) . ', "jetpack-mu-wpcom" );';
	}
}
