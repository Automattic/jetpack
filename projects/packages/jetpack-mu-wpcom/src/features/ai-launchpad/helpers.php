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

if ( ! function_exists( 'wpcom_ai_launchpad_resolve_goal' ) ) {
	/**
	 * The site's goal, resolved once for every path that behaves differently because of it.
	 *
	 * The wizard option wins: it is the user's own choice, written by the server. `payload.inferred.goal`
	 * is only what the prompt asked the model to echo back, so anything keyed off it can be driven by a
	 * wrong echo — enforcement (update_tailored() drops the tasks the goal forbids) and shape
	 * (get_current_tasks() leads a sell site with the store sequence) alike. Read and write must agree on
	 * one authority, or a newsletter site can have every commerce task stripped at PUT and still be told
	 * to install WooCommerce at GET.
	 *
	 * The payload is the fallback and only covers one race: the wizard PUT is fire-and-forget in
	 * wizard/wizard.tsx, so a prewarmed tailor can land before the option is written. The output schema
	 * has already validated the payload's goal against the same six slugs.
	 *
	 * @param array $payload The AI output payload — the persisted one on read, the incoming one at PUT.
	 * @return string The goal slug, or '' when neither source holds one.
	 */
	function wpcom_ai_launchpad_resolve_goal( $payload ) {
		$wizard = get_option( 'wpcom_ai_launchpad_wizard' );
		if ( is_array( $wizard ) && isset( $wizard['goal'] ) && is_string( $wizard['goal'] ) && '' !== $wizard['goal'] ) {
			return $wizard['goal'];
		}

		$inferred = is_array( $payload ) && isset( $payload['inferred'] ) && is_array( $payload['inferred'] )
			? $payload['inferred']
			: array();

		return isset( $inferred['goal'] ) && is_string( $inferred['goal'] ) ? $inferred['goal'] : '';
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_to_simple_plugins_path' ) ) {
	/**
	 * On Simple sites, rewrite a wp-admin plugins-screen CTA to its Calypso equivalent.
	 *
	 * Simple sites have no reachable wp-admin plugins UI, so any task whose CTA lands on `plugins.php` or
	 * `plugin-install.php` would dead-end. Those are mapped to the Calypso plugins page — a specific plugin
	 * when a slug is given, otherwise the site's plugins list. Non-plugin paths and Atomic sites pass through.
	 *
	 * Shared rather than private to AI_Launchpad_REST because both task sources need it and each resolves its
	 * CTA in a different place: the catalog's path is rewritten as build_tasks() enriches it, while a registry
	 * task resolves its own `calypso_path` and returns before that point, so it has to apply the rewrite
	 * itself. Two implementations would be one host check away from disagreeing.
	 *
	 * @param string|null $path        The resolved CTA path.
	 * @param string      $plugin_slug Optional plugin slug to deep-link to on Calypso.
	 * @return string|null
	 */
	function wpcom_ai_launchpad_to_simple_plugins_path( $path, $plugin_slug = '' ) {
		if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || ! is_string( $path ) ) {
			return $path;
		}

		if ( false === strpos( $path, 'plugins.php' ) && false === strpos( $path, 'plugin-install.php' ) ) {
			return $path;
		}

		$slug_segment = '' !== $plugin_slug ? rawurlencode( $plugin_slug ) . '/' : '';
		return '/plugins/' . $slug_segment . rawurlencode( wpcom_get_site_slug() );
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

if ( ! function_exists( 'wpcom_ai_launchpad_is_test' ) ) {
	/**
	 * Whether this request comes from a development or test environment.
	 *
	 * Environment-based, never user-based. The AI property standard keeps `is_test` and
	 * `is_a11n` independently filterable, so an Automattician working on a production site is
	 * a11n but not test. The standard also lists a set of internal Atomic client IDs, which is
	 * deliberately not implemented here: the reference implementation
	 * (packages/agents-manager, is_dev_mode()) gates that clause behind AT_PROXIED_REQUEST,
	 * which would make this user-based again, and ungated it would risk reporting real Atomic
	 * sites as tests. Automattician sessions on real test sites are covered by is_a11n instead.
	 *
	 * @return bool
	 */
	function wpcom_ai_launchpad_is_test() {
		$host = wp_parse_url( get_site_url(), PHP_URL_HOST );

		if ( ! is_string( $host ) || '' === $host ) {
			return false;
		}

		$host = strtolower( $host );

		if ( 'localhost' === $host ) {
			return true;
		}

		foreach ( array( '.jurassic.tube', '.jurassic.ninja' ) as $suffix ) {
			if ( substr( $host, - strlen( $suffix ) ) === $suffix ) {
				return true;
			}
		}

		return false;
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_is_a11n' ) ) {
	/**
	 * Whether an Automattician is acting on this site.
	 *
	 * Mirrors the platform split used elsewhere in the package: on Simple the platform's own
	 * is_automattician() is authoritative, and on Atomic the a8c proxy is what identifies us.
	 * Both branches fail closed when their primitive is missing.
	 *
	 * Records who is acting, not who owns the site — an Automattician working on a customer's
	 * site is a11n, a customer working on an a8c-owned site is not.
	 *
	 * @return bool
	 */
	function wpcom_ai_launchpad_is_a11n() {
		if ( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
			return function_exists( 'is_automattician' ) && (bool) is_automattician();
		}

		return \Automattic\Jetpack\Constants::is_true( 'AT_PROXIED_REQUEST' );
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_standard_props' ) ) {
	/**
	 * The AI standard Tracks properties, merged into every AI Launchpad event by both
	 * recorders — the server one below and the client one in `js/lib/tracks.ts`, which reads
	 * this same array from the page's `window.wpcomAiLaunchpadTracks` global.
	 *
	 * Every value is a string or an int, never null: the standard requires the string "none"
	 * for a missing value, because null breaks group-by aggregations downstream.
	 *
	 * @return array The standard props.
	 */
	function wpcom_ai_launchpad_standard_props() {
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );

		$string_or_none = static function ( $value ) {
			return is_string( $value ) && '' !== $value ? $value : 'none';
		};

		$source        = $string_or_none( is_array( $ai_output ) ? ( $ai_output['source'] ?? null ) : null );
		$ai_session_id = $string_or_none( is_array( $ai_output ) ? ( $ai_output['ai_session_id'] ?? null ) : null );

		// Redundant with $source by construction. The standard requires it and cross-product AI
		// dashboards group by it, so it is derived here rather than stored a second time.
		$outcome = 'none';
		if ( 'ai' === $source ) {
			$outcome = 'success';
		} elseif ( 'fallback' === $source ) {
			$outcome = 'error';
		}

		return array(
			'channel'       => 'web',
			'surface'       => 'dashboard',
			// The Site Setup page's own $pagenow, hardcoded rather than read live: the two
			// server-fired events fire inside REST requests, where $pagenow is index.php, and
			// the two recorders have to report the same screen for the same user.
			'screen'        => 'admin.php',
			'ref'           => 'experiment_wpcom_launchpad_personalization_202607_v1',
			'site_type'     => ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ? 'simple' : 'atomic',
			'agent_name'    => 'ai_launchpad',
			'agent_version' => \Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION,
			// Stringified rather than left as PHP bools: http_build_query() (both PHP Tracks
			// clients end in one) renders a bool as "1"/"0", while the client recorder's
			// encodeURIComponent() renders it as "true"/"false" — the same logical value would
			// reach Tracks differently depending on which recorder fired it. The literal strings
			// 'true'/'false' are what the Fieldguide standard documents and the only
			// representation both encoders pass through unchanged.
			'is_test'       => wpcom_ai_launchpad_is_test() ? 'true' : 'false',
			'is_a11n'       => wpcom_ai_launchpad_is_a11n() ? 'true' : 'false',
			// Explicit rather than left to the Tracks super prop: on the client the super prop
			// is missing on about one page-view fire in twenty, which understates every
			// per-site rate that uses `viewed` as its denominator.
			'blog_id'       => (int) get_wpcom_blog_id(),
			'source'        => $source,
			'outcome'       => $outcome,
			'ai_session_id' => $ai_session_id,
		);
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_shape_tracks_identity' ) ) {
	/**
	 * Reduces a Tracks client identity to the two fields the browser is allowed to see.
	 *
	 * The client helper also returns an email address, a blog id and a locale. Only the id and
	 * the login may reach a JS global, so this rebuilds the array rather than unsetting keys —
	 * a field added to the helper later cannot leak through by default.
	 *
	 * @param mixed $identity The raw identity from Jetpack_Tracks_Client, or false.
	 * @return array|null The id and login, or null when the identity is unusable.
	 */
	function wpcom_ai_launchpad_shape_tracks_identity( $identity ) {
		if ( ! is_array( $identity ) || empty( $identity['userid'] ) || empty( $identity['username'] ) ) {
			return null;
		}

		return array(
			'userid'   => (int) $identity['userid'],
			'username' => (string) $identity['username'],
		);
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_tracks_identity' ) ) {
	/**
	 * The Tracks user identity the client recorder pushes as `identifyUser`, on Atomic only.
	 *
	 * On Simple, wpcom's stats.php already pushes identifyUser for every admin page load. On
	 * Atomic nothing does, so without this the client events would land anonymous. The local
	 * user id is not usable there — Tracks wants the connected WordPress.com identity.
	 *
	 * Returns only the id and the login: the Tracks client helper also hands back an email
	 * address, which must not reach a JS global.
	 *
	 * @return array|null The identity, or null on Simple / when no connected user is available.
	 */
	function wpcom_ai_launchpad_tracks_identity() {
		if ( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
			return null;
		}

		if ( ! class_exists( 'Jetpack_Tracks_Client' ) ) {
			return null;
		}

		return wpcom_ai_launchpad_shape_tracks_identity( \Jetpack_Tracks_Client::get_connected_user_tracks_identity() );
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_record_tracks_event' ) ) {
	/**
	 * Records an AI Launchpad Tracks event server-side, merging three layers before it is sent:
	 *
	 * 1. `wpcom_ai_launchpad_standard_props()` — the AI standard props shared with the client
	 *    recorder. Applied first and never dropped: "none" and "false" are values, not gaps.
	 * 2. `wpcom_ai_launchpad_tracks_context( $rendered_task_ids )` — the feature-specific
	 *    context (goal, niche, rendered list, …). Its null-valued keys are filtered out here
	 *    (mirroring the client recorder) rather than reaching Tracks as literal "null" strings,
	 *    so an unset context value is simply absent, unlike an unset standard prop.
	 * 3. `$props`, the call site's own properties, which win over both of the above.
	 *
	 * @param string        $event_name        The Tracks event name, already feature-prefixed.
	 * @param array         $props             Event properties. No PII: task IDs are fine, free text is not.
	 * @param string[]|null $rendered_task_ids The rendered task ids, when the caller has them.
	 * @return void
	 */
	function wpcom_ai_launchpad_record_tracks_event( $event_name, $props = array(), $rendered_task_ids = null ) {
		$context = array_merge( wpcom_ai_launchpad_tracks_context( $rendered_task_ids ), $props );

		// Null-valued context props are omitted, mirroring the client recorder: the Tracks
		// pipeline would otherwise record them as literal "null" strings.
		$context = array_filter(
			$context,
			static function ( $value ) {
				return null !== $value;
			}
		);

		// Merged outside that filter, and first, so the standard props are never dropped
		// (`is_test: 'false'` is a value, not a gap) and a call site still wins over both.
		$props = array_merge( wpcom_ai_launchpad_standard_props(), $context );

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
		// even when a partial write left the payload with an inferred goal but no task list. Resolved
		// through the shared helper so this mirror cannot disagree with the list it is mirroring.
		if ( 'sell' === wpcom_ai_launchpad_resolve_goal( $payload ) && ! in_array( 'site_theme_selected', $task_ids, true ) ) {
			$task_ids[] = 'site_theme_selected';
		}

		return $task_ids;
	}
}
