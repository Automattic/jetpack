<?php

/**
 * Renders extra controls in the Gallery Settings section of the new media UI.
 */
class Jetpack_Gallery_Settings {
	function __construct() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
	}

	function admin_init() {
		$this->gallery_types = apply_filters( 'jetpack_gallery_types', array() );

		// Enqueue the media UI only if needed.
		if ( ! empty( $this->gallery_types ) ) {
			add_action( 'wp_enqueue_media', array( $this, 'wp_enqueue_media' ) );
			add_action( 'print_media_templates', array( $this, 'print_media_templates' ) );
		}
	}

	/**
	 * Registers/enqueues the gallery settings admin js.
	 */
	function wp_enqueue_media() {
		if ( ! wp_script_is( 'jetpack-gallery-settings', 'registered' ) )
			wp_register_script( 'jetpack-gallery-settings', plugins_url( 'gallery-settings/gallery-settings.js', __FILE__ ), array( 'media-views' ), '20121225' );

		wp_enqueue_script( 'jetpack-gallery-settings' );
	}

	/**
	 * Outputs a view template which can be used with wp.media.template
	 */
	function print_media_templates() {
		?>
		<script type="text/html" id="tmpl-jetpack-gallery-settings">
			<label class="setting">
				<span><?php _e( 'Type', 'jetpack' ); ?></span>
				<select class="type" name="type" data-setting="type">
					<option value="default" <?php selected( true ); ?>><?php _e( 'Default', 'jetpack' ); ?></option>
					<?php foreach ( $this->gallery_types as $value => $caption ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $caption ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
		</script>
		<?php
	}
}
new Jetpack_Gallery_Settings;
