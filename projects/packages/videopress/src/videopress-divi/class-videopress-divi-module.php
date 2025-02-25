<?php
/**
 * VideoPress Divi Editor module.
 *
 * @package VideoPress
 */

use Automattic\Jetpack\VideoPress\Jwt_Token_Bridge;

/**
 * VideoPress Divi module
 **/
class VideoPress_Divi_Module extends ET_Builder_Module {

	/**
	 * Module slug
	 *
	 * @var string
	 */
	public $slug = 'divi_videopress';

	/**
	 * For matching VideoPress urls or guids.
	 *
	 * @var string
	 */
	const VIDEOPRESS_REGEX = '/^(?:(?:http(?:s)?:\/\/)?(?:www\.)?video(?:\.word)?press\.com\/(?:v|embed)\/)?([a-zA-Z\d]+)(?:.*)?/i';

	/**
	 * Vd support.
	 *
	 * @var string
	 */
	public $vb_support = 'on';

	/**
	 * Credits.
	 *
	 * @var array
	 */
	protected $module_credits = array(
		'module_uri' => 'https://automattic.com',
		'author'     => 'Automattic Inc',
		'author_uri' => 'https://automattic.com',
	);

	/**
	 * Name.
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Icon.
	 *
	 * @var string
	 */
	public $icon;

	/**
	 * Properties.
	 *
	 * @var array
	 */
	public $props;

	/**
	 * Initialize the thing.
	 */
	public function init() {
		$this->name = esc_html__( 'VideoPress', 'jetpack-videopress-pkg' );
		$this->icon = 'q';
	}

	/**
	 * Get the fields of the block.
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'guid' => array(
				'label'           => esc_html__( 'URL or Video ID', 'jetpack-videopress-pkg' ),
				'type'            => 'text',
				'option_category' => 'basic_option',
				'description'     => esc_html__( 'Paste a VideoPress URL or Video ID', 'jetpack-videopress-pkg' ),
				'toggle_slug'     => 'main_content',
			),
		);
	}

	/**
	 * Render.
	 *
	 * Note: while phpcs complains about unused vars in the method signature, they SHOULD be there. We override an existing method.
	 *
	 * @param array       $attrs       The attributes.
	 * @param string|null $content     The content.
	 * @param string|null $render_slug The render slug.
	 *
	 * @return string
	 */
	public function render( $attrs, $content = null, $render_slug = null ) { // phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$matches = array();

		if ( ! preg_match( self::VIDEOPRESS_REGEX, $this->props['guid'], $matches ) ) {
			return '';
		}

		if ( ! isset( $matches[1] ) ) {
			return '';
		}

		Jwt_Token_Bridge::enqueue_jwt_token_bridge();

		$guid         = $matches[1];
		$iframe_title = sprintf(
			/* translators: %s: Video title. */
			esc_html__( 'Video player for %s', 'jetpack-videopress-pkg' ),
			esc_html( $guid )
		);

		$iframe_src    = sprintf(
			'https://videopress.com/embed/%s?autoPlay=0&permalink=0&loop=0&embedder=divi-builder',
			esc_attr( $guid )
		);
		$format_string = '<div class="vidi-videopress-wrapper"><iframe title="' .
			esc_attr( $iframe_title ) .
			'" src="' .
			$iframe_src .
			'" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>' .
			// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
			'<script src="https://en.wordpress.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js?m=1658739239"></script></div>';

		return $format_string;
	}
}
