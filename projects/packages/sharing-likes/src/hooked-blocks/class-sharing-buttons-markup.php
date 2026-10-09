<?php
/**
 * Builds the Sharing Buttons block that gets hooked into templates.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

/**
 * A `jetpack/sharing-buttons` block with its buttons, carried over from the
 * site's legacy sharing services where the block offers them.
 *
 * @since $$next-version$$
 */
final class Sharing_Buttons_Markup {

	/**
	 * The parent block's markup around its buttons, as `sharing-buttons/save.jsx` saves it.
	 * The misspelt id is that save output; changing it would invalidate every saved block.
	 */
	private const LIST_OPEN  = '<ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="jetpack-sharing-serivces-list">';
	private const LIST_CLOSE = '</ul>';

	/**
	 * Buttons when the site has no legacy service the block offers.
	 */
	private const DEFAULT_SERVICES = array( 'facebook', 'x', 'mastodon' );

	/**
	 * Legacy service IDs the block knows under another name.
	 */
	private const LEGACY_ALIASES = array(
		'email'            => 'mail',
		'jetpack-whatsapp' => 'whatsapp',
		'twitter'          => 'x',
	);

	/**
	 * Legacy button styles the block styles too. It accepts `official` but has no styles for it.
	 */
	private const STYLE_TYPES = array( 'icon-text', 'icon', 'text' );

	/**
	 * Fill a hooked `jetpack/sharing-buttons` block with its buttons and markup.
	 *
	 * @param array $block The hooked block, in parsed block format.
	 * @return array
	 */
	public static function fill( array $block ): array {
		$labels   = self::labels();
		$children = array();

		foreach ( self::services() as $service ) {
			$children[] = array(
				'blockName'    => 'jetpack/sharing-button',
				'attrs'        => array(
					'service' => $service,
					'label'   => $labels[ $service ],
				),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			);
		}

		$block['attrs'] = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();

		$style = self::legacy_button_style();
		if ( '' !== $style ) {
			$block['attrs']['styleType'] = $style;
		}

		$block['innerBlocks']  = $children;
		$block['innerHTML']    = self::LIST_OPEN . self::LIST_CLOSE;
		$block['innerContent'] = array_merge(
			array( self::LIST_OPEN ),
			array_fill( 0, count( $children ), null ),
			array( self::LIST_CLOSE )
		);

		return $block;
	}

	/**
	 * The block's services for the legacy buttons the site shows, those behind "More" when none
	 * are visible, or the defaults.
	 *
	 * Reads the option rather than `Sharing_Service`, which may not be loaded, and saves defaults on read.
	 *
	 * @return string[]
	 */
	public static function services(): array {
		$stored = get_option( 'sharing-services' );

		foreach ( array( 'visible', 'hidden' ) as $list ) {
			$services = is_array( $stored ) && isset( $stored[ $list ] ) && is_array( $stored[ $list ] ) ? self::block_services( $stored[ $list ] ) : array();

			if ( $services ) {
				return $services;
			}
		}

		return self::DEFAULT_SERVICES;
	}

	/**
	 * The block's services for some legacy service IDs, dropping those it does not offer.
	 *
	 * @param array $legacy_ids Legacy service IDs.
	 * @return string[]
	 */
	private static function block_services( array $legacy_ids ): array {
		$labels   = self::labels();
		$services = array();

		foreach ( $legacy_ids as $legacy_id ) {
			if ( ! is_string( $legacy_id ) ) {
				continue;
			}

			$service = self::LEGACY_ALIASES[ $legacy_id ] ?? $legacy_id;

			if ( isset( $labels[ $service ] ) && ! in_array( $service, $services, true ) ) {
				$services[] = $service;
			}
		}

		return $services;
	}

	/**
	 * The legacy button style, when the block accepts it.
	 */
	private static function legacy_button_style(): string {
		$options = get_option( 'sharing-options' );
		$style   = is_array( $options ) ? ( $options['global']['button_style'] ?? '' ) : '';

		return in_array( $style, self::STYLE_TYPES, true ) ? $style : '';
	}

	/**
	 * Button labels for the services carried over, as the block's variations set them.
	 *
	 * The block prints the label, falling back to the raw service slug.
	 *
	 * @return array<string, string>
	 */
	private static function labels(): array {
		return array(
			'bluesky'   => 'Bluesky',
			// translators: option to print the content - a verb labelling a button.
			'print'     => __( 'Print', 'jetpack-sharing-likes' ),
			'facebook'  => 'Facebook',
			'linkedin'  => 'LinkedIn',
			// translators: option to share the content by email - a verb labelling a button.
			'mail'      => __( 'Mail', 'jetpack-sharing-likes' ),
			'mastodon'  => 'Mastodon',
			'pinterest' => 'Pinterest',
			'reddit'    => 'Reddit',
			'telegram'  => 'Telegram',
			'threads'   => 'Threads',
			'tumblr'    => 'Tumblr',
			'whatsapp'  => 'WhatsApp',
			'x'         => 'X',
			'nextdoor'  => 'Nextdoor',
		);
	}
}
