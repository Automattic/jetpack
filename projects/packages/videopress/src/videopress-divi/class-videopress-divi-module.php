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
	 * Vd support.
	 *
	 * @var string
	 */
	public $vb_support = 'on';

	/**
	 * The regex that extracts a video guid.
	 *
	 * @var string
	 */
	const VIDEOPRESS_REGEX = '/^(?:http(?:s)?:\/\/)?(?:www\.)?video(?:\.word)?press\.com\/(?:v|embed)\/([a-zA-Z\d]{8,})(.+)?/';

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
				'label'           => esc_html__( 'Guid or URL', 'jetpack-videopress-pkg' ),
				'type'            => 'text',
				'option_category' => 'basic_option',
				'description'     => esc_html__( 'paste a url or guid', 'jetpack-videopress-pkg' ),
				'toggle_slug'     => 'main_content',
			),
		);
	}

	/**
	 * Render.
	 *
	 * @return string
	 */
	public function render( /* $attrs, $content = null, $render_slug = null */ ) {
		$iframe_title = sprintf(
			/* translators: %s: Video title. */
			esc_html__( 'Video player for %s', 'jetpack-videopress-pkg' ),
			esc_html( $this->props['guid'] )
		);
		$iframe_src = sprintf(
			'https://videopress.com/embed/%s?hd=0&autoPlay=0&permalink=0&loop=0',
			esc_attr( $this->props['guid'] )
		);
		return sprintf( '<iframe title="%1$s" src="%2$s"></iframe>', esc_attr( $iframe_title ), esc_attr( $iframe_src ) );
	}
}

new VideoPress_Divi_Module();
