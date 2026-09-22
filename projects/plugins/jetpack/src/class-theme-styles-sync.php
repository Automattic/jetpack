<?php
/**
 * Resolves the slice of the active theme's design that a post email can inherit.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use WP_Theme_JSON;
use WP_Theme_JSON_Resolver;

/**
 * Builds the `theme_styles` sync callable.
 *
 * Post emails render on WordPress.com against its own copy of a theme, so a site running a theme
 * it does not ship inherits no design at all. See NL-943.
 */
class Theme_Styles_Sync {

	/**
	 * Refuse to sync a slice larger than this, in bytes.
	 *
	 * A bound on a pathological palette, not a budget: ordinary themes are orders below it, and a
	 * theme that trips it syncs nothing and keeps today's behaviour.
	 */
	const MAX_PAYLOAD_BYTES = 51200;

	/**
	 * The active theme's inheritable design.
	 *
	 * @return array|null Null when theme.json is unavailable, or the slice is oversized.
	 */
	public static function get_theme_styles() {
		if ( ! class_exists( 'WP_Theme_JSON_Resolver' ) ) {
			return null;
		}

		$theme = WP_Theme_JSON_Resolver::get_theme_data();
		$raw   = $theme->get_raw_data();

		// User customisations are deliberately absent: they already reach WordPress.com through the
		// synced `wp_global_styles` post, which is layered over this.
		$styles  = self::inheritable_styles( self::resolved_styles( $theme ) );
		$palette = self::flatten_palette( $raw['settings']['color']['palette'] ?? array() );

		// Reported even when empty: sync skips a null value, which would leave the receiving end
		// holding the previous theme's design with nothing to say the theme had changed.
		$slice = array(
			'stylesheet' => get_stylesheet(),
			'version'    => 3,
			'settings'   => array( 'color' => array( 'palette' => $palette ) ),
			'styles'     => $styles,
		);

		$encoded = wp_json_encode( $slice, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $encoded || strlen( $encoded ) > self::MAX_PAYLOAD_BYTES ) {
			return null;
		}

		return $slice;
	}

	/**
	 * The theme's styles with every preset variable replaced by the value it stands for.
	 *
	 * `var()` is dead in most mail clients, and core's own presets can only be resolved here, where
	 * core's data is available to resolve against.
	 *
	 * @param WP_Theme_JSON $theme The active theme's data.
	 * @return array
	 */
	private static function resolved_styles( WP_Theme_JSON $theme ) {
		$own = $theme->get_raw_data()['styles'] ?? array();
		if ( empty( $own ) ) {
			return array();
		}

		$with_core = new WP_Theme_JSON();
		$with_core->merge( WP_Theme_JSON_Resolver::get_core_data() );
		$with_core->merge( $theme );
		$resolved = WP_Theme_JSON::resolve_variables( $with_core )->get_raw_data()['styles'] ?? array();

		// Core is merged in to resolve against, not to contribute: narrowing back to what the theme
		// itself declared keeps core's default styles from syncing as though the site had chosen them.
		return self::intersect( $resolved, self::shape_of( $own ) );
	}

	/**
	 * A styles tree reduced to its shape, for use as an allowlist.
	 *
	 * @param array $styles A styles tree, or a branch of one.
	 * @return array
	 */
	private static function shape_of( array $styles ) {
		$shape = array();

		foreach ( $styles as $key => $value ) {
			$shape[ $key ] = is_array( $value ) ? self::shape_of( $value ) : true;
		}

		return $shape;
	}

	/**
	 * Keep only the style paths an email could act on.
	 *
	 * Deliberately a superset of the allowlist WordPress.com applies on receipt, so narrowing what
	 * an email inherits stays a WordPress.com-side change rather than one gated on a plugin release.
	 *
	 * @param array $styles The theme's styles.
	 * @return array
	 */
	private static function inheritable_styles( array $styles ) {
		$typography = array_fill_keys(
			array( 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textDecoration', 'textTransform' ),
			true
		);
		$color      = array(
			'text'       => true,
			'background' => true,
		);

		$element  = array(
			'typography' => $typography,
			'color'      => $color,
		);
		$elements = array(
			'link'    => $element,
			'heading' => $element,
			'button'  => $element,
			'caption' => $element,
		);
		foreach ( range( 1, 6 ) as $level ) {
			$elements[ 'h' . $level ] = $element;
		}

		return self::intersect(
			$styles,
			array(
				'color'      => $color,
				'typography' => $typography,
				'spacing'    => array(
					'blockGap' => true,
					'padding'  => true,
					'margin'   => true,
				),
				'elements'   => $elements,
			)
		);
	}

	/**
	 * Keep only the branches an allowlist names, dropping empty ones entirely.
	 *
	 * @param array $styles    A styles tree, or a branch of one.
	 * @param array $allowlist The matching branch of the allowlist.
	 * @return array
	 */
	private static function intersect( array $styles, array $allowlist ) {
		$kept = array();

		foreach ( $allowlist as $key => $permitted ) {
			if ( ! isset( $styles[ $key ] ) ) {
				continue;
			}

			if ( true === $permitted ) {
				$kept[ $key ] = $styles[ $key ];
				continue;
			}

			if ( ! is_array( $styles[ $key ] ) ) {
				continue;
			}

			$branch = self::intersect( $styles[ $key ], $permitted );
			if ( ! empty( $branch ) ) {
				$kept[ $key ] = $branch;
			}
		}

		return $kept;
	}

	/**
	 * Flatten an origin-keyed palette into the flat list `WP_Theme_JSON` expects for one origin.
	 *
	 * @param array $palette Palette that may be origin-keyed or already flat.
	 * @return array
	 */
	private static function flatten_palette( array $palette ) {
		if ( empty( $palette ) || isset( $palette[0] ) ) {
			return $palette;
		}

		return array_merge(
			$palette['default'] ?? array(),
			$palette['blocks'] ?? array(),
			$palette['theme'] ?? array(),
			$palette['custom'] ?? array()
		);
	}
}
