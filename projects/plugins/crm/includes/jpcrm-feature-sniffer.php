<?php
if ( !defined( 'ZEROBSCRM_PATH' ) ) exit;

/**
 *
 * The JPCRM_FeatureSniffer class lets core detect installed
 * plugins for which we already have integrations
 *
 */
class JPCRM_FeatureSniffer {

	public function __construct() {
		if ( !function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$this->all_plugins = get_plugins();
		$this->alerts = array();
	}

	/**
	 *
	 * Checks if there is an unused CRM integration
	 * with installed plugins
	 *
	 * @param str $args params passed to check, e.g.:
	 *  array(
	 *    'feature_slug'    => 'feature_slug',
	 *    'plugin_slug'     => 'plugin.php',
	 *    'more_info_link'  => 'https://kb.jetpackcrm.com/some_link_to_docs'
	 *  )
	 * @param bool $is_silent determine whether to show notices to the end user or not
	 *
	 * @return    bool
	 *
	 */
	public function sniff_for_plugin( $args = array(), $is_silent = false ) {

		if (
			// bad params
			empty( $args )
			|| !isset( $args['feature_slug'] )
			|| !isset( $args['plugin_slug'] )
			|| !isset( $args['more_info_link'] )
			// target plugin isn't active
			|| !is_plugin_active( $args['plugin_slug'] )
			// feature is already enabled
			|| zeroBSCRM_isExtensionInstalled( $args['feature_slug'] )
		) {
			return false;
		}

		$is_dismissed = get_option( 'jpcrm_hide_' . $args['feature_slug'] . '_feature_alert', false );

		// handle messaging if not silent
		if ( !$is_silent && !$is_dismissed && current_user_can( 'activate_plugins' ) ) {
			$plugin_details = $this->all_plugins[ $args['plugin_slug'] ];

			global $zbs;

			$message_template = sprintf( __( 'Jetpack CRM has an optional integration with your <code>%s</code> plugin, but the feature is not currently enabled.' ), $plugin_details['Name'] );
			if ( isset( $args['is_module'] ) && $args['is_module'] ) {
				$message_template .= ' ' . sprintf( __( 'If you want to use this feature, please activate it in <a href="%s">Core Modules</a>.' ), zeroBSCRM_getAdminURL( $zbs->slugs['modules'] ) );
			}

			##WLREMOVE
			$message_template .= '<br><br>' . sprintf( __( 'Learn more by going <a href="%s" target="_blank">here</a>.' ), $args['more_info_link'] );
			##/WLREMOVE

			$this->alerts[] = array(
				'feature_slug' => $args['feature_slug'],
				'message' => $message_template,
			);
		}

		return true;
	}

	/**
	 *
	 * Show alert if there is a feature one might find useful
	 *
	 * Note that this will only show the first unused feature detected
	 * that has not been dismissed
	 *
	 */
	public function show_feature_alerts() {
		// no untapped features, so no messaging needed
		if ( count( $this->alerts ) == 0 ) {
			return false;
		}
		if ( zeroBSCRM_isAdminPage() ) {

			$feature_alert_fn = function () {
				// only show first message; no need to overload user
				?>
          <div id="<?php echo $this->alerts[0]['feature_slug'] ?>_feature_alert"
               class="ui segment jpcrm-promo notice jpcrm_feature_alert is-dismissible">
              <div class="content">
                  <p><strong><?php echo $this->alerts[0]['message'] ?></strong></p>
              </div>
          </div>
				<?php
			};
			add_action( 'admin_notices', $feature_alert_fn );
		}

	}

	/**
	 * Sets alert to be dismissed
	 * (Effectively backend variant of `jpcrm_hide_feature_alert()`)
	 */
	public function dismiss_alert( $feature_slug ) {

		if ( !empty( $feature_slug ) ) {

			update_option( 'jpcrm_hide_' . $feature_slug . '_feature_alert', 1, false );
			return true;

		}

		return false;
	}
}

