<?php
/**
 * Subscribe modal popup feature
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 2.2.1
 */

/**
 * Creates modal content.
 *
 * @return void
 */
function wpcom_subscribe_modal_content() {
	?>
	<div id="myModal" class="modal">
		<div class="modal-content">
			<span class="close">&times;</span>
			<p>Some text in the Modal..</p>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', 'wpcom_add_subscribe_modal' );

/**
 * Enqueues JS to load modal.
 *
 * @return void
 */
function wpcom_subscribe_modal_enqueue() {
	// Add newsletter conditional
	wp_enqueue_script( 'subscribe-modal-js', plugins_url( 'subscribe-modal.js', __FILE__ ), array(), Jetpack_Mu_Wpcom::PACKAGE_VERSION, false );
}
add_action( 'wp_enqueue_scripts', 'wpcom_subscribe_modal_enqueue' );
