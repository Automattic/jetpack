<?php
/**
 * VideoPress Divi Editor module.
 *
 * @package VideoPress
 */

/**
 * VideoPress Divi module
 **/
class VideoPress_Divi_Module extends ET_Builder_Module {

	/**
	 * Module slug
	 *
	 * @var string
	 */
	public $slug = 'vidi_videopress';

	/**
	 * For matching VideoPress urls or guids.
	 *
	 * @var string
	 */
	const VIDEOPRESS_REGEX = '/^(?:http(?:s)?:\/\/)?(?:www\.)?video(?:\.word)?press\.com\/(?:v|embed)\/([a-zA-Z\d]{8,})(.+)?/i';

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
	 * Initialize the thing.
	 */
	public function init() {
		$this->name = esc_html__( 'VideoPress', 'jetpack-videopress-pkg' );
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
				'description'     => esc_html__( 'Paste a URL or Video ID', 'jetpack-videopress-pkg' ),
				'toggle_slug'     => 'main_content',
			),
		);
	}

	/**
	 * Render.
	 *
	 * @param array       $attrs       The attributes.
	 * @param string|null $content     The content.
	 * @param string|null $render_slug The render slug.
	 *
	 * @return string
	 */
	public function render( $attrs, $content = null, $render_slug = null ) {
		$matches = array();

		if ( ! preg_match( self::VIDEOPRESS_REGEX, $this->props['guid'], $matches ) ) {
			return '';
		}

		if ( ! isset( $matches[1] ) ) {
			return '';
		}

		$guid         = $matches[1];
		$iframe_title = sprintf(
			/* translators: %s: Video title. */
			esc_html__( 'Video player for %s', 'jetpack-videopress-pkg' ),
			esc_html( $guid )
		);

		$iframe_src = sprintf(
			'https://videopress.com/embed/%s?autoPlay=0&permalink=0&loop=0&embedder=divi-builder',
			esc_attr( $guid )
		);

		$format_string = '<div class="vidi-videopress-wrapper"><iframe title="' .
			esc_attr( $iframe_title ) .
			'" src="' .
			$iframe_src .
			'" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>' .
			'<script src="https://en.wordpress.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js?m=1658739239"></script></div>'; // phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript

		return $format_string;
	}
}

