<?php
/**
 * Render callback for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

use Automattic\Jetpack\VideoPress\Divi5\VideoPress_Module;
use Automattic\Jetpack\VideoPress\Jwt_Token_Bridge;
use Automattic\Jetpack\VideoPress\Package_Version;
use ET\Builder\FrontEnd\BlockParser\BlockParserStore;
use ET\Builder\Packages\Module\Module;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Builds the front-end markup for the VideoPress module.
 */
trait Render_Callback_Trait {

	/**
	 * Renders the module on the front end.
	 *
	 * @param array  $attrs    The module attributes.
	 * @param string $content  The module content.
	 * @param object $block    The parsed block object.
	 * @param object $elements The module element helpers.
	 *
	 * @return string The rendered HTML, or an empty string when no valid GUID is set.
	 */
	public static function render_callback( $attrs, $content, $block, $elements ) {
		$guid_value = $attrs['guid']['innerContent']['desktop']['value'] ?? '';

		$matches = array();
		if ( ! preg_match( VideoPress_Module::VIDEOPRESS_REGEX, (string) $guid_value, $matches ) || ! isset( $matches[1] ) ) {
			return '';
		}

		Jwt_Token_Bridge::enqueue_jwt_token_bridge();

		$video_player = self::render_video_player( $matches[1], $attrs );
		$parent       = BlockParserStore::get_parent( $block->parsed_block['id'], $block->parsed_block['storeInstance'] );

		return Module::render(
			array(
				'orderIndex'          => $block->parsed_block['orderIndex'],
				'storeInstance'       => $block->parsed_block['storeInstance'],
				'attrs'               => $attrs,
				'elements'            => $elements,
				'id'                  => $block->parsed_block['id'],
				'moduleClassName'     => '',
				'name'                => $block->block_type->name,
				'classnamesFunction'  => array( VideoPress_Module::class, 'module_classnames' ),
				'moduleCategory'      => $block->block_type->category,
				'stylesComponent'     => array( VideoPress_Module::class, 'module_styles' ),
				'scriptDataComponent' => array( VideoPress_Module::class, 'module_script_data' ),
				'parentAttrs'         => $parent->attrs ?? array(),
				'parentId'            => $parent->id ?? '',
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Property defined by the Divi 5 framework.
				'parentName'          => $parent->blockName ?? '',
				'children'            => $elements->style_components(
					array(
						'attrName' => 'module',
					)
				) . $video_player,
			)
		);
	}

	/**
	 * Builds the VideoPress iframe wrapper markup for a GUID.
	 *
	 * @param string $guid  The VideoPress GUID.
	 * @param array  $attrs The module attributes, used to derive player options.
	 *
	 * @return string The iframe wrapper markup.
	 */
	private static function render_video_player( $guid, $attrs ) {
		/*
		 * Enqueue the shared VideoPress iframe API bootstrap rather than printing a
		 * <script> per render. This reuses the `videopress-iframe` handle the
		 * VideoPress block registers, so the script loads once per page no matter
		 * how many videos (or blocks) are present.
		 */
		wp_enqueue_script(
			'videopress-iframe',
			'https://videopress.com/videopress-iframe.js',
			array(),
			Package_Version::PACKAGE_VERSION,
			true
		);

		$iframe_title = sprintf(
			/* translators: %s: Video GUID. */
			esc_html__( 'Video player for %s', 'jetpack-videopress-pkg' ),
			esc_html( $guid )
		);

		$iframe_src = self::build_embed_url( $guid, $attrs );

		return '<div class="vidi-videopress-wrapper" style="position:relative;width:100%;height:0;padding-bottom:56.25%;">' .
			'<iframe title="' . esc_attr( $iframe_title ) . '" src="' . esc_url( $iframe_src ) . '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" frameborder="0" allowfullscreen></iframe>' .
			'</div>';
	}

	/**
	 * Builds the VideoPress embed URL, applying only the player options that differ
	 * from the VideoPress player defaults (for a clean URL, mirroring the block).
	 * Kept in sync with `getEmbedUrl()` in the Visual Builder's `utils.js`.
	 *
	 * @param string $guid  The VideoPress GUID.
	 * @param array  $attrs The module attributes.
	 *
	 * @return string The embed URL.
	 */
	private static function build_embed_url( $guid, $attrs ) {
		$options = self::get_player_options( $attrs );

		$params = array();
		if ( $options['autoplay'] ) {
			$params['autoPlay'] = '1';
		}
		if ( $options['loop'] ) {
			$params['loop'] = '1';
		}
		if ( $options['muted'] ) {
			$params['muted']         = '1';
			$params['persistVolume'] = '0';
		}
		if ( ! $options['controls'] ) {
			$params['controls'] = '0';
		}
		if ( $options['playsinline'] ) {
			$params['playsinline'] = '1';
		}
		// Always identify the embedder so VideoPress can attribute Divi traffic.
		$params['embedder'] = 'divi-builder';

		return add_query_arg( $params, 'https://videopress.com/embed/' . rawurlencode( $guid ) );
	}

	/**
	 * Resolves the module's player options from its attributes, falling back to the
	 * VideoPress player defaults when a toggle is unset.
	 *
	 * @param array $attrs The module attributes.
	 *
	 * @return array<string, bool> The resolved player options.
	 */
	private static function get_player_options( $attrs ) {
		return array(
			'autoplay'    => self::is_toggle_on( $attrs, 'autoplay', false ),
			'loop'        => self::is_toggle_on( $attrs, 'loop', false ),
			'muted'       => self::is_toggle_on( $attrs, 'muted', false ),
			'controls'    => self::is_toggle_on( $attrs, 'controls', true ),
			'playsinline' => self::is_toggle_on( $attrs, 'playsinline', false ),
		);
	}

	/**
	 * Reads a Divi 5 toggle attribute, which stores `'on'`/`'off'` strings.
	 *
	 * @param array  $attrs        The module attributes.
	 * @param string $name         The attribute name.
	 * @param bool   $default_value The value to use when the toggle is unset.
	 *
	 * @return bool Whether the toggle is on.
	 */
	private static function is_toggle_on( $attrs, $name, $default_value ) {
		$value = $attrs[ $name ]['innerContent']['desktop']['value'] ?? ( $default_value ? 'on' : 'off' );

		return 'on' === $value;
	}
}
