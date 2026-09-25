<?php
/**
 * The slice of the active theme's design that a post email can inherit.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

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
		$styles = self::inheritable_styles( $raw['styles'] ?? array() );

		// Reported even when empty: sync skips a null value, which would leave the receiving end
		// holding the previous theme's design with nothing to say the theme had changed.
		$slice = array(
			'stylesheet' => get_stylesheet(),
			// Core's own, not a literal: it migrates raw data to the latest schema, so labelling a
			// later shape with an older number would have the receiving end migrate it a second time.
			'version'    => $raw['version'] ?? 3,
			'settings'   => self::preset_sources( $raw['settings'] ?? array() ),
			'styles'     => $styles,
		);

		// phpcs:ignore Jetpack.Functions.JsonEncodeFlags.Missing -- measuring the wire representation, which Sync encodes with default flags.
		$encoded = wp_json_encode( $slice );
		if ( false === $encoded || strlen( $encoded ) > self::MAX_PAYLOAD_BYTES ) {
			return null;
		}

		return $slice;
	}

	/**
	 * The preset definitions a style's `var(--wp--preset--…)` reference needs to be resolved.
	 *
	 * Styles travel unresolved on purpose. Resolving here would bake in the theme's stock value and
	 * lose the reference, so a creator who recolours a palette slug would keep getting the stock
	 * colour in their email while their site renders the new one. The receiving end resolves instead,
	 * against these merged under the creator's own record, which is the only place both are known.
	 *
	 * @param array $settings The theme's settings.
	 * @return array
	 */
	private static function preset_sources( array $settings ) {
		$sources = array( 'color' => array( 'palette' => self::flatten_presets( $settings['color']['palette'] ?? array() ) ) );

		$wanted = array(
			'typography' => array( 'fontSizes', 'fontFamilies' ),
			'spacing'    => array( 'spacingSizes' ),
		);

		foreach ( $wanted as $group => $keys ) {
			foreach ( $keys as $key ) {
				$presets = self::flatten_presets( $settings[ $group ][ $key ] ?? array() );
				if ( ! empty( $presets ) ) {
					$sources[ $group ][ $key ] = $presets;
				}
			}
		}

		// The font files are two thirds of a family's bytes and no use to a mail client, which cannot
		// load a web font. Only the family name resolves a `var(--wp--preset--font-family--…)`.
		if ( isset( $sources['typography']['fontFamilies'] ) ) {
			$sources['typography']['fontFamilies'] = array_map( array( self::class, 'without_font_files' ), $sources['typography']['fontFamilies'] );
		}

		return $sources;
	}

	/**
	 * One font-family preset without its `fontFace` declarations.
	 *
	 * @param mixed $family A `fontFamilies` entry.
	 * @return mixed
	 */
	private static function without_font_files( $family ) {
		if ( is_array( $family ) ) {
			unset( $family['fontFace'] );
		}

		return $family;
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
	 * Flatten an origin-keyed preset list into the flat list `WP_Theme_JSON` expects for one origin.
	 *
	 * Each origin is checked rather than assumed: core's schema leaves a non-array preset list
	 * untouched and the `WP_Theme_JSON` constructor origin-keys it anyway, so a theme.json
	 * declaring a scalar there reaches this with a string where a list belongs.
	 *
	 * @param array $presets Preset list that may be origin-keyed or already flat.
	 * @return array
	 */
	private static function flatten_presets( array $presets ) {
		if ( empty( $presets ) || isset( $presets[0] ) ) {
			return $presets;
		}

		$flat = array();
		foreach ( array( 'default', 'blocks', 'theme', 'custom' ) as $origin ) {
			if ( isset( $presets[ $origin ] ) && is_array( $presets[ $origin ] ) ) {
				$flat = array_merge( $flat, $presets[ $origin ] );
			}
		}

		return $flat;
	}
}
