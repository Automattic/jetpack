<?php
/**
 * Widget Types: registry hydration plus the availability filter hooks.
 *
 * Copies the wp-build manifest (`jpa_get_registered_widget_modules()`) into the
 * Widget_Type_Registry from the registration action the registry fires on its
 * first read, so the plugin queries the registry instead of re-parsing the
 * manifest. On the way in, user-facing metadata strings are translated (per the
 * widget-i18n.json schema) and the `help`, `icon`, `actions`, and
 * `attributes` fields sanitized. Another plugin registers its widget types from the same action,
 * through register_widget_type().
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
 * Version of the widget contract a plugin builds against: the shared module ids, the
 * Widget_Type fields the client reads, and the toolkit exports. The major changes when a widget
 * built against the previous contract stops working, the minor when a consumer can rely on
 * something new; a consumer compares it before registering.
 *
 * @since 0.9.0
 */
const WIDGET_API_VERSION = '2.1.0';

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
 * Runs `title`, `description`, `help`, `actions`, `attributes`, and
 * `keywords` through the widget i18n schema, leaving every other key
 * untouched. Unlike the upstream copy, a widget with no `textdomain` falls
 * back to the package text domain instead of skipping translation: every
 * bundled widget shares it.
 *
 * @param array $widget Widget data from the build manifest.
 * @return array Widget data with its translatable strings localized.
 */
function translate_widget_metadata( $widget ) {
	$textdomain  = ! empty( $widget['textdomain'] ) ? $widget['textdomain'] : 'jetpack-premium-analytics-pkg';
	$i18n_schema = get_widget_metadata_i18n_schema();

	foreach ( array( 'title', 'description', 'help', 'actions', 'attributes', 'keywords' ) as $field ) {
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
 * the action, and a `download` name that sanitizes to nothing becomes `true`.
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
			$message = sprintf(
				/* translators: 1: Widget action id. 2: Declared action href. */
				__( 'Dropped widget action "%1$s": href "%2$s" is not an allowed URL.', 'jetpack-premium-analytics-pkg' ),
				$action['id'],
				$action['href']
			);
			// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
			_doing_it_wrong( __FUNCTION__, esc_html( $message ), 'jetpack-premium-analytics-0.8.0' );
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
				// A name that sanitizes to nothing keeps the download under the original name; only `false` navigates.
				$filename          = sanitize_file_name( (string) $action['download'] );
				$entry['download'] = '' !== $filename ? $filename : true;
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
 * Sanitizes a widget attribute schema. A malformed or empty key drops, never
 * the entry; an entry without a unique string `id` drops.
 *
 * @param mixed $attributes Attribute schema from the build manifest.
 * @return array|null Sanitized schema, or null when no entry survives.
 */
function sanitize_widget_attributes( $attributes ) {
	if ( ! is_array( $attributes ) ) {
		return null;
	}

	$string_keys  = array( 'type', 'label', 'header', 'description', 'placeholder' );
	$boolean_keys = array( 'readOnly', 'isDisabled', 'enableSorting', 'enableHiding', 'enableGlobalSearch' );

	$sanitized = array();
	$seen      = array();
	foreach ( $attributes as $attribute ) {
		if (
			! is_array( $attribute ) ||
			! isset( $attribute['id'] ) ||
			! is_string( $attribute['id'] ) ||
			'' === $attribute['id'] ||
			isset( $seen[ $attribute['id'] ] )
		) {
			continue;
		}
		$seen[ $attribute['id'] ] = true;

		$entry = array( 'id' => $attribute['id'] );

		foreach ( $string_keys as $key ) {
			if ( isset( $attribute[ $key ] ) && is_string( $attribute[ $key ] ) && '' !== $attribute[ $key ] ) {
				$entry[ $key ] = $attribute[ $key ];
			}
		}

		foreach ( $boolean_keys as $key ) {
			if ( isset( $attribute[ $key ] ) && is_bool( $attribute[ $key ] ) ) {
				$entry[ $key ] = $attribute[ $key ];
			}
		}

		if ( isset( $attribute['elements'] ) && is_array( $attribute['elements'] ) ) {
			$elements = array();
			foreach ( $attribute['elements'] as $element ) {
				if (
					! is_array( $element ) ||
					! array_key_exists( 'value', $element ) ||
					! ( null === $element['value'] || is_scalar( $element['value'] ) ) ||
					! isset( $element['label'] ) ||
					! is_string( $element['label'] )
				) {
					continue;
				}

				$option = array(
					'value' => $element['value'],
					'label' => $element['label'],
				);
				if ( isset( $element['description'] ) && is_string( $element['description'] ) ) {
					$option['description'] = $element['description'];
				}
				if ( isset( $element['icon'] ) ) {
					$icon = sanitize_widget_icon( $element['icon'] );
					if ( $icon ) {
						$option['icon'] = $icon;
					}
				}
				$elements[] = $option;
			}

			if ( $elements ) {
				$entry['elements'] = $elements;
			}
		}

		if (
			isset( $attribute['filterBy'] ) &&
			( false === $attribute['filterBy'] || ( is_array( $attribute['filterBy'] ) && array() !== $attribute['filterBy'] ) )
		) {
			$entry['filterBy'] = $attribute['filterBy'];
		}

		if ( ! empty( $attribute['format'] ) && is_array( $attribute['format'] ) ) {
			$entry['format'] = $attribute['format'];
		}

		if ( isset( $attribute['isValid'] ) && is_array( $attribute['isValid'] ) ) {
			$rules = $attribute['isValid'];
			unset( $rules['custom'] );
			if ( $rules ) {
				$entry['isValid'] = $rules;
			}
		}

		if (
			isset( $attribute['Edit'] ) &&
			( ( is_string( $attribute['Edit'] ) && '' !== $attribute['Edit'] ) || ( is_array( $attribute['Edit'] ) && array() !== $attribute['Edit'] ) )
		) {
			$entry['Edit'] = $attribute['Edit'];
		}

		if ( isset( $attribute['relevance'] ) && in_array( $attribute['relevance'], array( 'high', 'medium', 'low' ), true ) ) {
			$entry['relevance'] = $attribute['relevance'];
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
 * Registers the widget types a build manifest describes.
 *
 * What a plugin with a `widgets/` folder calls from the registration action, with the manifest
 * its own build generates. Each candidate that survives REGISTRABLE_WIDGET_TYPES_FILTER is
 * translated, sanitized and registered; one already registered, or without a name, is skipped.
 *
 * @since 0.9.0
 *
 * @param array                     $widgets  Manifest entries, as the generated `<prefix>_get_registered_widget_modules()` returns them.
 * @param array                     $args     {
 *     Optional. Registration options.
 *
 *     @type string $textdomain    Text domain for the metadata strings of a candidate that declares none.
 *     @type string $i18n_manifest URL of the build's i18n manifest, for a candidate that declares none.
 *     @type array  $former_names  Map of widget type name to the names it registered under before, for a candidate that declares none.
 *     @type array  $plan_features Map of widget type name to its plan feature, for a candidate that declares none.
 * }
 * @param Widget_Type_Registry|null $registry Optional. The registry to write into. Defaults to the main instance.
 * @return void
 */
function register_widget_types_from_manifest( array $widgets, array $args = array(), $registry = null ) {
	if ( ! $registry instanceof Widget_Type_Registry ) {
		$registry = Widget_Type_Registry::get_instance();
	}

	/**
	 * Filters the widget type candidates before they are registered.
	 *
	 * A dropped candidate is never registered, so it is gone from the REST list,
	 * the import map, and any registry reader. Use for hard availability; for
	 * soft state that must stay visible (e.g. shown locked), filter on read via
	 * WIDGET_TYPES_FILTER.
	 *
	 * @param array $widgets Manifest candidates, each with a `name`.
	 */
	$widgets = apply_filters( REGISTRABLE_WIDGET_TYPES_FILTER, $widgets );

	foreach ( $widgets as $widget ) {
		if ( empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
			continue;
		}

		if ( empty( $widget['textdomain'] ) && ! empty( $args['textdomain'] ) ) {
			$widget['textdomain'] = $args['textdomain'];
		}
		if ( empty( $widget['i18n_manifest'] ) && ! empty( $args['i18n_manifest'] ) ) {
			$widget['i18n_manifest'] = $args['i18n_manifest'];
		}
		if ( empty( $widget['former_names'] ) && ! empty( $args['former_names'][ $widget['name'] ] ) ) {
			$widget['former_names'] = $args['former_names'][ $widget['name'] ];
		}
		if ( empty( $widget['plan_feature'] ) && ! empty( $args['plan_features'][ $widget['name'] ] ) ) {
			$widget['plan_feature'] = $args['plan_features'][ $widget['name'] ];
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
				'attributes'    => sanitize_widget_attributes( $widget['attributes'] ?? null ),
				'keywords'      => $widget['keywords'] ?? null,
				'textdomain'    => $widget['textdomain'] ?? null,
				'i18n_manifest' => $widget['i18n_manifest'] ?? null,
				'former_names'  => $widget['former_names'] ?? null,
				'plan_feature'  => $widget['plan_feature'] ?? null,
			)
		);
	}
}

/**
 * The plan feature each of the package's own widget types shows, for the plan gates to lock.
 * Locations needs only countries: regions and cities lock inside the widget.
 */
const WIDGET_TYPE_PLAN_FEATURES = array(
	'jpa/stats-top-posts'                => 'top-posts',
	'jpa/referrers'                      => 'referrers',
	'jpa/locations'                      => 'countries',
	'jpa/clicks'                         => 'clicks',
	'jpa/file-downloads'                 => 'file-downloads',
	'jpa/authors'                        => 'authors',
	'jpa/author-top-posts'               => 'authors',
	'jpa/author-performance'             => 'authors',
	'jpa/search-terms'                   => 'search-terms',
	'jpa/video-detail-views-performance' => 'videos',
	'jpa/video-detail-embeds'            => 'videos',
	'jpa/utm-insights'                   => 'utm',
	'jpa/devices'                        => 'devices',
	'jpa/top-platforms'                  => 'devices',
	'jpa/annual-highlights'              => 'insights',
	'jpa/all-time-stats'                 => 'insights',
	'jpa/most-popular-time'              => 'insights',
	'jpa/most-popular-day'               => 'insights',
	'jpa/popular-post'                   => 'insights',
	'jpa/latest-post'                    => 'insights',
	'jpa/posting-activity'               => 'insights',
	'jpa/views-over-years'               => 'insights',
	'jpa/most-commented-posts'           => 'insights',
	'jpa/most-commented-authors'         => 'insights',
	'jpa/shares'                         => 'insights',
	'jpa/tags'                           => 'tags',
	'jpa/post-all-time-traffic'          => 'recent-7-days',
);

/**
 * Registers the package's own widget types from its build manifest.
 *
 * The package's registrant on the registration action, safe to call directly: a widget type
 * already registered is skipped.
 *
 * @param Widget_Type_Registry|null $registry Optional. The registry being hydrated. Defaults to the main instance.
 * @return void
 */
function register_widget_types( $registry = null ) {
	if ( ! function_exists( 'jpa_get_registered_widget_modules' ) ) {
		return;
	}

	// Generated by wp-build into build/widgets.php, outside Phan's analysis scope.
	// The function_exists() guard above protects the call at runtime.
	// No manifest URL: the page's boot init module loads the package's own catalogs.
	register_widget_types_from_manifest(
		jpa_get_registered_widget_modules(),
		array(
			'textdomain'    => 'jetpack-premium-analytics-pkg',
			'plan_features' => WIDGET_TYPE_PLAN_FEATURES,
		),
		$registry
	);

	register_widget_type_variants( $registry );
}

add_action( Widget_Type_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_widget_types' );

/**
 * The detail pages' variants of the package's own widget types: a base type under another name,
 * title, help and icon, so a fixed composition places one type twice or under the page's own title.
 *
 * @since $$next-version$$
 *
 * @return array<string, array{base: string, title: string, help?: string, icon?: string}> Variants keyed by name.
 */
function get_widget_type_variants() {
	return array(
		'jpa/email-time-series--total-opens'    => array(
			'base'  => 'jpa/email-time-series',
			'title' => __( 'Opens, first 30 days', 'jetpack-premium-analytics-pkg' ),
			'help'  => __( 'Daily opens for the 30 days after this email was sent. The totals above are all-time.', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/seen',
		),
		'jpa/email-time-series--total-clicks'   => array(
			'base'  => 'jpa/email-time-series',
			'title' => __( 'Clicks, first 30 days', 'jetpack-premium-analytics-pkg' ),
			'help'  => __( 'Daily clicks for the 30 days after this email was sent. The totals above are all-time.', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/link',
		),
		'jpa/email-breakdown--location-opens'   => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Locations', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/map-marker',
		),
		'jpa/email-breakdown--platforms-opens'  => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Platforms', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/desktop',
		),
		'jpa/email-breakdown--clients-opens'    => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Clients', 'jetpack-premium-analytics-pkg' ),
		),
		'jpa/email-breakdown--location-clicks'  => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Locations', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/map-marker',
		),
		'jpa/email-breakdown--platforms-clicks' => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Platforms', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/desktop',
		),
		'jpa/email-breakdown--clients-clicks'   => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Clients', 'jetpack-premium-analytics-pkg' ),
		),
		'jpa/email-breakdown--top-links'        => array(
			'base'  => 'jpa/email-breakdown',
			'title' => __( 'Top links', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/link',
		),
		'jpa/utm-insights--utm'                 => array(
			'base'  => 'jpa/utm-insights',
			'title' => __( 'UTM', 'jetpack-premium-analytics-pkg' ),
			'icon'  => 'jpa/megaphone',
		),
		'jpa/popular-post--author'              => array(
			'base'  => 'jpa/popular-post',
			'title' => __( 'Popular post', 'jetpack-premium-analytics-pkg' ),
			'help'  => __( 'This author’s most-viewed post, with its headline views, likes and comments.', 'jetpack-premium-analytics-pkg' ),
		),
		'jpa/latest-post--author'               => array(
			'base'  => 'jpa/latest-post',
			'title' => __( 'Latest post', 'jetpack-premium-analytics-pkg' ),
			'help'  => __( 'This author’s most recently published post, with its headline views, likes and comments.', 'jetpack-premium-analytics-pkg' ),
		),
		'jpa/views-over-years--author'          => array(
			'base'  => 'jpa/views-over-years',
			'title' => __( 'All-time traffic', 'jetpack-premium-analytics-pkg' ),
			'help'  => __( 'Every month of this author’s views since their first post, page or product, with each year’s total beside it. Always the full history: the period above doesn’t narrow it. Pick a month to read the rest of the page over it.', 'jetpack-premium-analytics-pkg' ),
		),
	);
}

/**
 * Registers the variants whose base type is registered: the base's modules, attributes and plan
 * feature under the variant's name, title, help and icon.
 *
 * @since $$next-version$$
 *
 * @param Widget_Type_Registry|null $registry Optional. The registry being hydrated. Defaults to the main instance.
 * @return void
 */
function register_widget_type_variants( $registry = null ) {
	if ( ! $registry instanceof Widget_Type_Registry ) {
		$registry = Widget_Type_Registry::get_instance();
	}

	foreach ( get_widget_type_variants() as $name => $variant ) {
		$base = $registry->get_registered( $variant['base'] );
		if ( ! $base instanceof Widget_Type || $registry->is_registered( $name ) ) {
			continue;
		}

		$registry->register(
			$name,
			array(
				'render_module' => $base->render_module,
				'widget_module' => $base->widget_module,
				'presentation'  => $base->presentation,
				'category'      => $base->category,
				'title'         => $variant['title'],
				'description'   => $base->description,
				'help'          => isset( $variant['help'] ) ? array( 'content' => $variant['help'] ) : $base->help,
				'icon'          => $variant['icon'] ?? $base->icon,
				'actions'       => $base->actions,
				'attributes'    => $base->attributes,
				'keywords'      => $base->keywords,
				'textdomain'    => $base->textdomain,
				'i18n_manifest' => $base->i18n_manifest,
				'plan_feature'  => $base->plan_feature,
			)
		);
	}
}

/**
 * Registers a single widget type.
 *
 * Call it from a callback on Widget_Type_Registry::REGISTER_ACTION, where the
 * API is loaded and the registry is hydrating. The metadata strings arrive
 * translated and in shape, as a section's label does; a build manifest goes
 * through register_widget_types_from_manifest() instead.
 *
 * @since 0.9.0
 *
 * @param string $name Widget type name including namespace, `<namespace>/<name>`.
 * @param array  $args Optional. Widget type arguments, any public property of Widget_Type.
 * @return Widget_Type|false The registered widget type on success, or false on failure.
 */
function register_widget_type( $name, $args = array() ) {
	return Widget_Type_Registry::get_instance()->register( $name, $args );
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
