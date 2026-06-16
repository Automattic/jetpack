<?php
/**
 * Render callback for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

use Automattic\Jetpack\VideoPress\Divi5\VideoPress_Module;
use Automattic\Jetpack\VideoPress\Jwt_Token_Bridge;
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

		$video_player = self::render_video_player( $matches[1] );
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
	 * @param string $guid The VideoPress GUID.
	 *
	 * @return string The iframe wrapper markup.
	 */
	private static function render_video_player( $guid ) {
		$iframe_title = sprintf(
			/* translators: %s: Video GUID. */
			esc_html__( 'Video player for %s', 'jetpack-videopress-pkg' ),
			esc_html( $guid )
		);

		$iframe_src = sprintf(
			'https://videopress.com/embed/%s?autoPlay=0&permalink=0&loop=0&embedder=divi-builder',
			esc_attr( $guid )
		);

		return '<div class="vidi-videopress-wrapper" style="position:relative;width:100%;height:0;padding-bottom:56.25%;">' .
			'<iframe title="' . esc_attr( $iframe_title ) . '" src="' . $iframe_src . '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" frameborder="0" allowfullscreen></iframe>' .
			// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Third-party player bootstrap injected inline, matching the legacy Divi 4 module.
			'<script src="https://en.wordpress.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js?m=1658739239"></script></div>';
	}
}
