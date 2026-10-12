<?php
/**
 * Reads and saves the sharing buttons' global options.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Button style, label and link target, stored in `sharing-options['global']`.
 *
 * Every write goes through `Sharing_Service`, which only loads with the legacy
 * sharing buttons, so callers check `is_available()` first.
 */
final class Sharing_Options {

	/**
	 * Values `Sharing_Service::set_global_options()` accepts for `button_style`.
	 */
	public const BUTTON_STYLES = array( 'icon-text', 'icon', 'text', 'official' );

	/**
	 * Whether sharedaddy is loaded to read and save these options.
	 */
	public static function is_available(): bool {
		return class_exists( 'Sharing_Service' );
	}

	/**
	 * The options as sharedaddy applies them, defaults included.
	 *
	 * @return array{button_style: string, sharing_label: string, open_links: string}
	 */
	public static function get(): array {
		$global = ( new \Sharing_Service() )->get_global_options();

		return array(
			'button_style'  => (string) ( $global['button_style'] ?? 'icon-text' ),
			'sharing_label' => (string) ( $global['sharing_label'] ?? '' ),
			'open_links'    => (string) ( $global['open_links'] ?? 'same' ),
		);
	}

	/**
	 * Save the given options and keep the stored value of every other one.
	 *
	 * `Sharing_Service::set_global_options()` rebuilds the global array from defaults,
	 * so anything the payload leaves out, placement included, would be reset.
	 *
	 * @param array<string, mixed> $changes Options to change, slashed as in `$_POST` and keyed as `set_global_options()` reads them.
	 * @return array<string, mixed> The global options as saved.
	 */
	public static function update( array $changes ): array {
		$current = self::get();
		if ( Placement_Section::is_saved() ) {
			$current['show'] = Placement_Section::selected_post_types();
		}
		$current['sharing_label'] = wp_slash( $current['sharing_label'] );
		$sharer                   = new \Sharing_Service();
		$options                  = array_merge( $current, $changes );

		// The default is stored as `false` only on an exact match, checked before unslashing.
		if ( is_string( $options['sharing_label'] ) && wp_unslash( $options['sharing_label'] ) === $sharer->default_sharing_label ) {
			$options['sharing_label'] = $sharer->default_sharing_label;
		}

		return $sharer->set_global_options( $options );
	}
}
