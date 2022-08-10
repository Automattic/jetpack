<?php

/**
 * Custom Control class for the Colors
 */
class Colors_Manager_Control extends WP_Customize_Control {
	public $type = 'colorsTool';

	public function __construct( $manager, $id, $args = array() ) {
		parent::__construct( $manager, $id, $args );
	}

	public function enqueue() {
		wp_enqueue_media();
		Colors_Manager::admin_scripts_and_css();
	}

	public function to_json() {
		parent::to_json();
	}

	public function render_content() {
		?>
		<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
		<div class="customize-control-content">
			<?php Colors_Manager::color_grid(); ?>
		</div>
		<?php
	}
}
