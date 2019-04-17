<?php
/**
 * Custom logo uploader control for the Customizer.
 *
 * @package Jetpack
 */
class Site_Logo_Image_Control extends WP_Customize_Control {
	/**
	 * Constructor for our custom control.
	 *
	 * @param object $wp_customize
	 * @param string $control_id
	 * @param array  $args
	 * @uses Site_Logo_Image_Control::l10n()
	 */
	public function __construct( $wp_customize, $control_id, $args = array() ) {
		// declare these first so they can be overridden
		$this->l10n = array(
			'upload'      => __( 'Add logo', 'jetpack' ),
			'set'         => __( 'Set as logo', 'jetpack' ),
			'choose'      => __( 'Choose logo', 'jetpack' ),
			'change'      => __( 'Change logo', 'jetpack' ),
			'remove'      => __( 'Remove logo', 'jetpack' ),
			'placeholder' => __( 'No logo set', 'jetpack' ),
		);

		parent::__construct( $wp_customize, $control_id, $args );
	}

	/**
	 * This will be critical for our JS constructor.
	 */
	public $type = 'site_logo';

	/**
	 * Allows overriding of global labels by a specific control.
	 */
	public $l10n = array();

	/**
	 * The type of files that should be allowed by the media modal.
	 */
	public $mime_type = 'image';

	/**
	 * Enqueue our media manager resources, scripts, and styles.
	 *
	 * @uses wp_enqueue_media()
	 * @uses wp_enqueue_style()
	 * @uses wp_enqueue_script()
	 * @uses plugins_url()
	 */
	public function enqueue() {
		// Enqueues all needed media resources.
		wp_enqueue_media();

		// Enqueue our control script and styles.
		wp_enqueue_style( 'site-logo-control', plugins_url( '../css/site-logo-control.css', __FILE__ ) );
		wp_enqueue_script( 'site-logo-control', plugins_url( '../js/site-logo-control.js', __FILE__ ), array( 'media-views', 'customize-controls', 'underscore' ), '', true );
	}

	/**
	 * Check if we have an active site logo.
	 *
	 * @uses get_option()
	 * @return boolean
	 */
	public function has_site_logo() {
		$logo = get_option( 'site_logo' );

		if ( empty( $logo['url'] ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Display our custom control in the Customizer.
	 *
	 * @uses Site_Logo_Image_Control::l10n()
	 * @uses Site_Logo_Image_Control::mime_type()
	 * @uses Site_Logo_Image_Control::label()
	 * @uses Site_Logo_Image_Control::description()
	 * @uses esc_attr()
	 * @uses esc_html()
	 */
	public function render_content() {
		// We do this to allow the upload control to specify certain labels
		$l10n = json_encode( $this->l10n );

		// Control title
		printf(
			'<span class="customize-control-title" data-l10n="%s" data-mime="%s">%s</span>',
			esc_attr( $l10n ),
			esc_attr( $this->mime_type ),
			esc_html( $this->label )
		);

		// Control description
		if ( ! empty( $this->description ) ) : ?>
			<span class="description customize-control-description"><?php echo $this->description; ?></span>
		<?php endif; ?>

		<div class="current"></div>
		<div class="actions"></div>
		<?php
	}
}
