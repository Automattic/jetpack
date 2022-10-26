<?php

namespace Automattic\Jetpack_Boost\Deactivation;

class Deactivation_Handler {
	private $plugin;
	private $feedback_url;
	private $dialog_view;

	public function __construct( $plugin, $feedback_url, $dialog_view ) {
		$this->plugin       = $plugin;
		$this->feedback_url = $feedback_url;
		$this->dialog_view  = $dialog_view;

		add_action( 'load-plugins.php', array( $this, 'enqueue_script' ) );
        add_action( 'admin_footer-plugins.php', array( $this, 'embed_dialog' ) );
	}

	public static function init( $plugin, $feedback_url, $dialog_view ) {
		$instance = new self( $plugin, $feedback_url, $dialog_view );
		return $instance;
	}

	public function enqueue_script() {
		wp_enqueue_script(
			'jetpack-boost-deactivation',
			plugins_url( 'dist/deactivation.js', __FILE__ ),
			array(),
			JETPACK_BOOST_VERSION,
			true
		);

		wp_enqueue_style(
			'jetpack-boost-deactivation',
			plugins_url( 'dist/deactivation.css', __FILE__ ),
			array(),
			JETPACK_BOOST_VERSION
		);
	}

    public function embed_dialog() {
		echo "<div id='jb-deactivation-$this->plugin' class='jb-deactivation'>";
		include( $this->dialog_view );
		echo "</div>";
        echo "<script>new DeactivationDialog('".esc_attr( $this->plugin )."', '".esc_url( $this->feedback_url )."');</script>";
	}
}
