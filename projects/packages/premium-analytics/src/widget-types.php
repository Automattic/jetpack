<?php
/**
 * Widget Types: registry hydration plus the availability filter hooks.
 *
 * Copies the wp-build manifest (`jpa_get_registered_widget_modules()`) into the
 * in-memory Widget_Type_Registry, so the plugin queries the registry instead
 * of re-parsing the manifest. On the way in, user-facing metadata strings are
 * translated (per the widget-i18n.json schema) and the `help`, `icon`, and
 * `actions` fields sanitized.
 *
 * This is the problem-agnostic "core" layer (a PA-namespaced copy of the
 * experimental Gutenberg API): it exposes the hooks a consumer uses to scope
 * widget types, but never decides availability itself.
 *
 *   - REGISTRABLE_WIDGET_TYPES_FILTER (registry-time): drop candidates before
 *     they register, gone everywhere. For hard availability.
 *   - WIDGET_TYPES_FILTER (runtime): scope the registered set on read. For
 *     request-dependent or soft state (e.g. shown locked).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/class-widget-type.php';
require_once __DIR__ . '/class-widget-type-registry.php';

/**
 * Registry-time filter over the manifest candidates, before they are registered.
 */
const REGISTRABLE_WIDGET_TYPES_FILTER = 'jetpack_premium_analytics_registrable_widget_types';

/**
 * Runtime filter over the registered widget types map, read for the client.
 */
const WIDGET_TYPES_FILTER = 'jetpack_premium_analytics_widget_types';

/**
 * Returns the i18n schema describing which widget metadata fields are
 * translatable and the gettext context to use for each.
 *
 * Read once from widget-i18n.json and memoized for the rest of the request.
 * Decoded as objects, not associative arrays: that is how
 * `translate_settings_using_i18n_schema()` tells keyed maps apart from lists.
 *
 * @return object Map of translatable field name to gettext context.
 */
function get_widget_metadata_i18n_schema() {
	static $i18n_schema = null;

	if ( null === $i18n_schema ) {
		$schema      = wp_json_file_decode( __DIR__ . '/widget-i18n.json' );
		$i18n_schema = is_object( $schema ) ? $schema : new \stdClass();
	}

	return $i18n_schema;
}

/**
 * Translates a widget's user-facing metadata strings.
 *
 * Runs `title`, `description`, `help`, `actions`, and `keywords` through
 * the widget i18n schema, leaving every other key untouched. Unlike the
 * upstream copy, a widget with no `textdomain` falls back to the package
 * text domain instead of skipping translation: every bundled widget
 * shares it.
 *
 * @param array $widget Widget data from the build manifest.
 * @return array Widget data with its translatable strings localized.
 */
function translate_widget_metadata( $widget ) {
	$textdomain  = ! empty( $widget['textdomain'] ) ? $widget['textdomain'] : 'jetpack-premium-analytics-pkg';
	$i18n_schema = get_widget_metadata_i18n_schema();

	foreach ( array( 'title', 'description', 'help', 'actions', 'keywords' ) as $field ) {
		if ( isset( $widget[ $field ] ) && isset( $i18n_schema->$field ) ) {
			$widget[ $field ] = translate_settings_using_i18n_schema( $i18n_schema->$field, $widget[ $field ], $textdomain );
		}
	}

	return $widget;
}

/**
 * Constrains a widget help note to its allowed shape: `content` keeps
 * only `em`/`strong` markup, and links are dropped unless they carry a
 * `label` and an `href` that survives `esc_url_raw()`.
 *
 * @param array|null $help Help note from the build manifest.
 * @return array|null Sanitized help note, or null when there is no content.
 */
function sanitize_widget_help( $help ) {
	if ( ! is_array( $help ) || empty( $help['content'] ) || ! is_string( $help['content'] ) ) {
		return null;
	}

	$sanitized = array(
		'content' => wp_kses(
			$help['content'],
			array(
				'em'     => array(),
				'strong' => array(),
			)
		),
	);

	if ( ! empty( $help['links'] ) && is_array( $help['links'] ) ) {
		$links = array();
		foreach ( $help['links'] as $link ) {
			if ( is_array( $link ) && ! empty( $link['label'] ) && ! empty( $link['href'] ) ) {
				$href = esc_url_raw( $link['href'] );

				if ( $href ) {
					$links[] = array(
						'label' => $link['label'],
						'href'  => $href,
					);
				}
			}
		}

		if ( $links ) {
			$sanitized['links'] = $links;
		}
	}

	return $sanitized;
}

/**
 * Resolves an action href to the form `esc_url_raw()` can judge.
 *
 * Absolute, scheme-relative, root-relative, and single-segment admin `.php`
 * hrefs pass through unchanged. Returns '' for path traversal and for any
 * other relative href, so `esc_url_raw()` cannot invent `http://filename`.
 * Unlike upstream, widget-local files are never resolved: `widgets/` does
 * not ship with the package, only its build output does.
 *
 * @param string $href Action href.
 * @return string The href to escape, or ''.
 */
function resolve_widget_action_href( $href ) {
	if ( ! is_string( $href ) || '' === $href ) {
		return '';
	}

	// Absolute, scheme-relative, or schemed, including URLs with `..` in the path.
	if ( preg_match( '#^([a-z][a-z0-9+.-]*:)?//#i', $href ) || str_contains( $href, ':' ) ) {
		return $href;
	}

	// Root-relative paths (e.g. /wp-admin/..., /report.csv).
	if ( str_starts_with( $href, '/' ) ) {
		return $href;
	}

	if ( str_contains( $href, '..' ) ) {
		return '';
	}

	$path_only = preg_split( '/[?#]/', $href, 2 )[0];
	if ( str_ends_with( strtolower( $path_only ), '.php' ) ) {
		// Single-segment admin entry points stay as-is. Deeper relative
		// paths would come out of `esc_url_raw()` as `http://` URLs.
		return str_contains( $path_only, '/' ) ? '' : $href;
	}

	return '';
}

/**
 * Sanitizes widget actions to `id` / `label` / `href` (via `esc_url_raw()`),
 * plus optional `download` / `openInNewTab` / `icon` / `relevance`. Drops
 * incomplete or unsafe entries and reports dropped hrefs through
 * `_doing_it_wrong()`; a malformed `icon` or `relevance` drops the key, never
 * the action.
 *
 * @param mixed $actions Actions from the build manifest.
 * @return array|null Sanitized actions, or null when none survive.
 */
function sanitize_widget_actions( $actions ) {
	if ( ! is_array( $actions ) ) {
		return null;
	}

	$sanitized = array();
	foreach ( $actions as $action ) {
		if (
			! is_array( $action ) ||
			! isset( $action['id'] ) ||
			! isset( $action['label'] ) ||
			! isset( $action['href'] ) ||
			! is_string( $action['id'] ) ||
			! is_string( $action['label'] ) ||
			! is_string( $action['href'] ) ||
			'' === $action['id'] ||
			'' === $action['label'] ||
			'' === $action['href']
		) {
			continue;
		}

		$href = esc_url_raw( resolve_widget_action_href( $action['href'] ) );
		if ( ! $href ) {
			_doing_it_wrong(
				__FUNCTION__,
				esc_html(
					sprintf(
						/* translators: 1: Widget action id. 2: Declared action href. */
						__( 'Dropped widget action "%1$s": href "%2$s" is not an allowed URL.', 'jetpack-premium-analytics-pkg' ),
						$action['id'],
						$action['href']
					)
				),
				'jetpack-premium-analytics-$$next-version$$'
			);
			continue;
		}

		$entry = array(
			'id'    => $action['id'],
			'label' => $action['label'],
			'href'  => $href,
		);

		if ( isset( $action['download'] ) ) {
			if ( is_bool( $action['download'] ) ) {
				$entry['download'] = $action['download'];
			} else {
				$filename = sanitize_file_name( (string) $action['download'] );
				if ( $filename ) {
					$entry['download'] = $filename;
				}
			}
		}

		if ( isset( $action['openInNewTab'] ) ) {
			$entry['openInNewTab'] = (bool) $action['openInNewTab'];
		}

		if ( isset( $action['icon'] ) ) {
			$icon = sanitize_widget_icon( $action['icon'] );
			if ( $icon ) {
				$entry['icon'] = $icon;
			}
		}

		if ( isset( $action['relevance'] ) && in_array( $action['relevance'], array( 'high', 'medium', 'low' ), true ) ) {
			$entry['relevance'] = $action['relevance'];
		}

		$sanitized[] = $entry;
	}

	return $sanitized ? $sanitized : null;
}

/**
 * Constrains a widget icon reference to a registered icon name
 * (`collection/icon-name`); anything else drops silently to no icon.
 *
 * @param mixed $icon Icon reference from the build manifest.
 * @return string|null The icon name, or null when the shape does not match.
 */
function sanitize_widget_icon( $icon ) {
	if ( ! is_string( $icon ) || '' === $icon ) {
		return null;
	}

	if ( ! preg_match( '#^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$#', $icon ) ) {
		return null;
	}

	return $icon;
}

/**
 * Hydrates the widget type registry from the build manifest.
 *
 * Each manifest widget is copied into the registry, gated by
 * REGISTRABLE_WIDGET_TYPES_FILTER so a consumer can drop a candidate first.
 *
 * @return void
 */
function register_widget_types() {
	if ( ! function_exists( 'jpa_get_registered_widget_modules' ) ) {
		return;
	}

	$registry = Widget_Type_Registry::get_instance();

	// Generated by wp-build into build/widgets.php, outside Phan's analysis scope.
	// The function_exists() guard above protects the call at runtime.
	$jetpack_widget_modules = jpa_get_registered_widget_modules();

	/**
	 * Filters the widget type candidates before they are registered.
	 *
	 * A dropped candidate is never registered, so it is gone from the REST list,
	 * the import map, and any registry reader. Use for hard availability; for
	 * soft state that must stay visible (e.g. shown locked), filter on read via
	 * WIDGET_TYPES_FILTER.
	 *
	 * @param array $jetpack_widget_modules Manifest candidates, each with a `name`.
	 */
	$jetpack_widget_modules = apply_filters( REGISTRABLE_WIDGET_TYPES_FILTER, $jetpack_widget_modules );

	foreach ( $jetpack_widget_modules as $widget ) {
		if ( empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
			continue;
		}

		$widget = translate_widget_metadata( $widget );

		$registry->register(
			$widget['name'],
			array(
				'render_module' => $widget['render_module'] ?? null,
				'widget_module' => $widget['widget_module'] ?? null,
				'presentation'  => $widget['presentation'] ?? null,
				'category'      => $widget['category'] ?? null,
				'title'         => $widget['title'] ?? null,
				'description'   => $widget['description'] ?? null,
				'help'          => sanitize_widget_help( $widget['help'] ?? null ),
				'icon'          => sanitize_widget_icon( $widget['icon'] ?? null ),
				'actions'       => sanitize_widget_actions( $widget['actions'] ?? null ),
				'keywords'      => $widget['keywords'] ?? null,
			)
		);
	}
}

/**
 * Hydrates the registry now if init has run, otherwise on init.
 *
 * Call after the availability filters are hooked, so the registry-time
 * filter applies during hydration.
 *
 * @return void
 */
function bootstrap_widget_types() {
	if ( did_action( 'init' ) ) {
		register_widget_types();
	} else {
		add_action( 'init', __NAMESPACE__ . '\\register_widget_types' );
	}
}

/**
 * Returns the raw registry. For the client-facing set use
 * get_available_widget_types().
 *
 * @return Widget_Type[] Map of `$name => $widget_type`.
 */
function get_registered_widget_types() {
	return Widget_Type_Registry::get_instance()->get_all_registered();
}

/**
 * Returns the registered widget types scoped through WIDGET_TYPES_FILTER.
 *
 * Use this, not get_registered_widget_types(), wherever widget types reach the
 * client, so the REST list and import map share one policy.
 *
 * @return Widget_Type[] Map of `$name => Widget_Type`.
 */
function get_available_widget_types() {
	/**
	 * Filters the widget types available to the dashboard this request.
	 *
	 * Removing an entry drops it from the REST list and the import map. The type
	 * stays registered, so use this (not the registry-time filter) when a
	 * consumer must still see it, e.g. to show it locked.
	 *
	 * @param Widget_Type[] $widget_types Map of `$name => Widget_Type`.
	 */
	return apply_filters( WIDGET_TYPES_FILTER, get_registered_widget_types() );
}
