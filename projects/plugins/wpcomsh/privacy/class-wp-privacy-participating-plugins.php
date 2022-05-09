<?php
/**
 * Privacy Participating Plugins file.
 *
 * @package privacy
 */

if ( ! class_exists( 'WP_Privacy_Participating_Plugins' ) ) {
	/**
	 * WP Privacy Participating Plugins
	 *
	 * Adds additional information to the export and erasure pages to clarify
	 * scope of the exporters, erasers and privacy policy guide.
	 */
	class WP_Privacy_Participating_Plugins {
		/**
		 * WP_Privacy_Participating_Plugins instance.
		 *
		 * @var WP_Privacy_Participating_Plugins
		 */
		private static $instance;

		/**
		 * Returns a class instance.
		 *
		 * @return WP_Privacy_Participating_Plugins
		 */
		public static function getInstance() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Prevent cloning.
		 */
		private function __clone() {
		}

		/**
		 * Prevent unserialization.
		 */
		public function __wakeup() {
		}

		/**
		 * Constructor.
		 */
		protected function __construct() {
			add_action( 'admin_footer', array( $this, 'maybe_add_erasers_info' ) );
			add_action( 'admin_footer', array( $this, 'maybe_add_exporters_info' ) );
			add_action( 'admin_footer', array( $this, 'maybe_add_privacy_info' ) );
		}

		/**
		 * Determines if erasers info should be displayed and does so. Or not.
		 */
		public function maybe_add_erasers_info() {
			if ( ! function_exists( 'get_current_screen' ) ) {
				return;
			}

			$screen = get_current_screen();
			if ( is_null( $screen ) ) {
				return;
			}

			if ( 'tools_page_remove_personal_data' !== $screen->id ) {
				return;
			}

			$prompt = __(
				'Please note - this tool only erases the personal data stored by WordPress and
participating plugins. It does not delete registered users, nor does it erase
personal data stored by non-participating plugins. It is your responsibility
to delete registered users as well as personal data stored by non-participating
plugins. The personal data erased includes only the following items at this
time:',
				'wpcomsh'
			);

			$erasers = apply_filters( 'wp_privacy_personal_data_erasers', array() );
			?>
				<script type="text/javascript">
					jQuery( document ).ready( function( $ ) {
						var prompt = <?php echo wp_json_encode( $prompt ); ?>;
						var erasers = <?php echo wp_json_encode( $erasers ); ?>;
						var isRemovePage = $( 'body' ).hasClass( 'tools_page_remove_personal_data' );

						if ( isRemovePage ) {
							$( '.wp-header-end' ).after(
								"<div class='notice notice-info wp-privacy-eraser-notice'></div>"
							);
							$( '.wp-privacy-eraser-notice' ).html( '<p>' + prompt + '</p>' );
							if ( erasers ) {
								$( '.wp-privacy-eraser-notice' ).append( '<ul></ul>' );
								$.map( erasers, function( val ) {
									$( '.wp-privacy-eraser-notice ul' ).append( '<li>' + val.eraser_friendly_name + '</li>' );
								} );
							}
						}
					} );
				</script>
			<?php
		}

		/**
		 * Determines if exporters info should be displayed and does so. Or not.
		 */
		public function maybe_add_exporters_info() {
			if ( ! function_exists( 'get_current_screen' ) ) {
				return;
			}

			$screen = get_current_screen();
			if ( is_null( $screen ) ) {
				return;
			}

			if ( 'tools_page_export_personal_data' !== $screen->id ) {
				return;
			}

			$prompt = __(
				'Please note - this tool only exports the personal data stored by WordPress and
participating plugins. It does not export personal data stored by
non-participating plugins. It is your responsibility to export personal data
stored by non-participating plugins separately. The personal data exported
includes only the following items at this time:',
				'wpcomsh'
			);

			$exporters = apply_filters( 'wp_privacy_personal_data_exporters', array() );
			?>
				<script type="text/javascript">
					jQuery( document ).ready( function( $ ) {
						var prompt = <?php echo wp_json_encode( $prompt ); ?>;
						var exporters = <?php echo wp_json_encode( $exporters ); ?>;
						var isExportPage = $( 'body' ).hasClass( 'tools_page_export_personal_data' );

						if ( isExportPage ) {
							$( '.wp-header-end' ).after(
								"<div class='notice notice-info wp-privacy-exporter-notice'></div>"
							);
							$( '.wp-privacy-exporter-notice' ).html( '<p>' + prompt + '</p>' );
							if ( exporters ) {
								$( '.wp-privacy-exporter-notice' ).append( '<ul></ul>' );
								$.map( exporters, function( val ) {
									$( '.wp-privacy-exporter-notice ul' ).append( '<li>' + val.exporter_friendly_name + '</li>' );
								} );
							}
						}
					} );
				</script>
			<?php
		}

		/**
		 * Determines if privacy info should be displayed and does so. Or not.
		 */
		public function maybe_add_privacy_info() {
			if ( ! function_exists( 'get_current_screen' ) ) {
				return;
			}

			$screen = get_current_screen();
			if ( is_null( $screen ) ) {
				return;
			}

			if ( 'tools' !== $screen->id ) {
				return;
			}

			if ( ! isset( $_GET['wp-privacy-policy-guide'] ) ) { // phpcs:ignore WordPress.Security
				return;
			}

			$prompt = __(
				'Please note - this tool only displays privacy policy information provided by
WordPress and participating plugins. It does not include privacy policy
information for non-participating plugins. It is your responsibility to
obtain privacy policy information for non-participating plugins separately.',
				'wpcomsh'
			);
			?>
				<script type="text/javascript">
					jQuery( document ).ready( function( $ ) {
						var hasPrivacyDiv = 0 < $( 'div.wp-privacy-policy-guide' ).length;
						var prompt = <?php echo wp_json_encode( $prompt ); ?>;
						if ( hasPrivacyDiv ) {
							$( 'h1' ).after(
								"<div class='notice notice-info wp-privacy-policy-notice'></div>"
							);
							$( '.wp-privacy-policy-notice' ).html( '<p>' + prompt + '</p>' );
						}
					} );
				</script>
			<?php
		}
	}

	WP_Privacy_Participating_Plugins::getInstance();
}
