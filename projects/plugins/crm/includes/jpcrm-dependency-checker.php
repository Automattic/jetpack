<?php
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

/**
 * 
 * The JPCRMDependencyChecker class provides various functions that
 * can be used to verify dependencies for features and extensions
 * 
 */

class JPCRM_DependencyChecker {

  protected $core_ver;
  protected $dal_ver;

  public function __construct( ) {
    if ( ! function_exists( 'get_plugins' ) ) {
      require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    global $zbs;
    $this->all_plugins = get_plugins();
    $this->core_ver = $zbs->version;
    $this->dal_ver = $zbs->dal_version;
  }

  /**
   * 
   * Checks if a feature's dependency requirements are met
   * 
   * @param		str $feature_name		public-facing feature name
   * @param		arr $core_reqs			array with core req_core_ver and req_DAL_ver
   * @param		arr $plugin_reqs		array of required plugins (each with a slug and req_ver)
   * @param		bool $is_silent			determine whether to show notices to the end user or not
   * 
   * @return	bool
   * 
   */
  public function check_all_reqs( $feature_name='', $core_reqs=array() , $plugin_reqs=array(), $is_silent=false ) {
    $meets_core_reqs = $this->check_core_reqs($feature_name, $core_reqs, $is_silent);
    $meets_plug_reqs = $this->check_plugin_reqs($feature_name, $plugin_reqs, $is_silent);
    
    // everything checks out
    if ( $meets_core_reqs && $meets_plug_reqs ) return true;

    // something didn't pass
    return false;
  }

  /**
   * 
   * Checks if feature meets core dependency requirements
   * If it doesn't, it will trigger an admin notice
   * 
   * @param		str $feature_name		public-facing feature name
   * @param		arr $core_reqs			details required for feature (req_core_ver and req_DAL_ver)
   * @param		bool $is_silent			determine whether to show notices to the end user or not
   * 
   * @return	bool
   * 
   */
  public function check_core_reqs( $feature_name='', $args=array(), $is_silent=false ) {
    $req_core_ver = !empty( $args['req_core_ver'] ) ? $args['req_core_ver'] : 1e6; //high version number
    $is_good_core_ver = version_compare( $this->core_ver, $req_core_ver, '>=' );
    $req_DAL_ver = !empty( $args['req_DAL_ver'] ) ? $args['req_DAL_ver'] : false;
    $is_good_DAL_ver = version_compare( $this->dal_ver, $req_DAL_ver, '>=' );

    // return true if everything checks out
    if ( $is_good_core_ver && $is_good_DAL_ver) {
      return true;
    }
    // return false if silent check
    elseif ($is_silent) {
      return false;
    }

    global $zbs;
    // otherwise, proceed to trigger an admin notice
    $feature_name = !empty( $feature_name ) ? $feature_name : __( 'CRM feature', 'zero-bs-crm' );

    if ( !$is_good_core_ver ) {
      $error_msg = sprintf( __( '%s requires CRM version %s or greater, but version %s is currently installed. Please update your CRM to use this feature.', 'zero-bs-crm' ), $feature_name, $req_core_ver, $this->core_ver );
      ##WLREMOVE
      $error_msg = sprintf( __( '%s requires Jetpack CRM version %s or greater, but version %s is currently installed. Please update Jetpack CRM to use this feature.', 'zero-bs-crm' ), $feature_name, $req_core_ver, $this->core_ver );
      ##/WLREMOVE
    }
    else if ( !$is_good_DAL_ver ) {
      $error_msg = sprintf( __( '%s requires your CRM database to be updated. Please visit <a href="%s">your CRM dashboard</a> for more information.', 'zero-bs-crm' ), $feature_name, zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) );
    }

    $error_fn = function() use( $error_msg ) {
      $this->show_dependency_error( $error_msg );
    };
    add_action( 'admin_notices', $error_fn );

    return false;
  }

  /**
   * 
   * Checks if a plugin is installed
   * 
   * @param		str $slug		plugin slug
   * 
   * @return	bool
   * 
   */
  private function is_plugin_installed( $slug='' ){
    if ( array_key_exists( $slug, $this->all_plugins ) ) {
      return true;
    }
    return false;
  }

  /**
   * Gets plugin version
   * 
   * @param		str $slug		plugin slug
   * 
   * @return	str					plugin version
   * @return	bool false	if slug is not found
   * 
   */
  private function get_plugin_version( $slug='' ) {
    if ( $this->is_plugin_installed( $slug ) ) {
      return $this->all_plugins[$slug]['Version'];
    }
    return false;
  }

  /**
   * 
   * Checks if feature's plugin dependency requirements are met
   * If it doesn't, it will trigger an admin notice
   * 
   * @param		arr $plugins		array of required plugins (each with an array of name, slug, and req_ver)
   * @param		bool $is_silent			determine whether to show notices to the end user or not
   * @param		str $error_msg	custom failure message (optional)
   * 
   * @return	bool
   * 
   */
  public function check_plugin_reqs( $feature_name='', $plugins=array(), $is_silent=false, $error_msg='' ) {
    $everything_is_fine = true;
    $feature_name = !empty( $feature_name ) ? $feature_name : __( 'CRM feature', 'zero-bs-crm' );

    // if we don't have an array of arrays (e.g. only one plugin is passed), make one
    if ( !isset( $plugins[0] ) ) {
      $plugins = array( $plugins );
    }
    foreach ( $plugins as $args ) {
      $slug = !empty( $args['slug'] ) ? $args['slug'] : '';
      $cur_ver = $this->get_plugin_version( $slug );
      $req_ver = !empty( $args['req_ver'] ) ? $args['req_ver'] : 1e6; //high version number
      $is_good_ver = version_compare($cur_ver, $req_ver, '>=');
      $is_active = is_plugin_active( $slug );

      // move to next plugin check if everything checks out
      if ( $is_active && $is_good_ver ) {
        continue;
      }

      $everything_is_fine = false;

      // short-circuit if silent check
      if ( $is_silent || ! current_user_can( 'activate_plugins' ) ) {
        break;
      }

      // otherwise, proceed to trigger an admin notice
      $plugin_name = !empty( $args['name'] ) ? $args['name'] : $slug; //use slug if no name
      $plugin_link = !empty( $args['link'] ) ? $args['link'] : false;
      $is_installed = $this->is_plugin_installed( $slug );

      if ( empty( $slug ) ) {
        $error_msg = __( 'A CRM feature has an unknown missing dependency. Please contact support!' );
        ##WLREMOVE
        $error_msg = __( 'A Jetpack CRM feature has an unknown missing dependency. Please contact support!' );
        ##/WLREMOVE
      }
      else if ( empty( $error_msg ) ) {
        if ( !$is_installed ) {
          $error_msg = sprintf( __( '%s requires %s version %s or greater. Please install and activate %s to use this feature.', 'zero-bs-crm' ), $feature_name, $plugin_link?'<a target="_blank" href="'.$plugin_link.'">'.$plugin_name.'</a>':$plugin_name, $req_ver, $plugin_name );
        }
        else if ( $is_installed && !$is_good_ver ) {
          $error_msg = sprintf( __( '%s requires %s version %s or greater, but version %s is currently installed. Please update %s to use this feature.', 'zero-bs-crm' ), $feature_name, $plugin_name, $req_ver, $cur_ver, $plugin_name );
        }
        else if ( !$is_active ) {
          $error_msg = sprintf( __( '%s requires the %s plugin to be active. Please activate %s to use this feature.', 'zero-bs-crm' ), $feature_name, $plugin_name, $plugin_name );
          ##WLREMOVE
          if ( !empty( $args['kb_link'] ) ) {
            $error_msg .= '<br><br>';
            $error_msg .= sprintf( __( 'To learn more about how this feature works, click <a href="%s" target="_blank">here</a>.', 'zero-bs-crm' ), $args['kb_link'] );
          }
          ##/WLREMOVE
        }
      }

      $error_fn = function() use( $error_msg ) {
        $this->show_dependency_error( $error_msg );
      };
      add_action( 'admin_notices', $error_fn );
    }
    return $everything_is_fine;
  }

  /**
   * 
   * Show error message if feature's dependency requirements are not met
   * 
   * @param		str $error_msg
   * 
   */
  private function show_dependency_error( $error_msg ) {
    if ( zeroBSCRM_isAdminPage() ) {
      ?>
      <div class="ui segment jpcrm-error">
        <div class="content">
          <b><?php esc_html_e( 'CRM dependency error', 'zero-bs-crm' ) ?></b><br>
          <p><?php echo $error_msg; ?></p>
        </div>
      </div>
      <?php
    }
    else {
      ?>
      <div class="error"><p><?php echo $error_msg; ?></p></div>
      <?php
    }
  }
}

