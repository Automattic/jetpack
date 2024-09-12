<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Custom Control class for the Colors
 */
class Colors_Manager_Control extends WP_Customize_Control {

	/**
	 * The color tool slug.
	 *
	 * @var String $type
	 */
	public $type = 'colorsTool';

	/**
	 * Constructor.
	 *
	 * @param WP_Customize_Manager $manager the manager object.
	 * @param string               $id      the control ID.
	 * @param array                $args    An associative array containing arguments for the setting.
	 */
	public function __construct( $manager, $id, $args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found -- not useless, the third argument is made optional.
		parent::__construct( $manager, $id, $args );
	}

	/**
	 * Enqueues the scripts and css.
	 */
	public function enqueue() {
		wp_enqueue_media();
		Colors_Manager::admin_scripts_and_css();
	}

	/**
	 * Renders the control content.
	 */
	public function render_content() {
		?>
		<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
		<div class="customize-control-content">
			<?php Colors_Manager::color_grid(); ?>
		</div>
		<?php
	}
}
