<?php
/*!
* Jetpack CRM
* https://jetpackcrm.com
*
* Client Portal Module
*
*/
namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

require_once plugin_dir_path( __FILE__ ) . 'class-client-portal-endpoint.php';

/**
 * 
 * Client Portal Module class for Jetpack CRM.
 * To add a new endpoint use one of the existing endpoints located inside the 
 * './endpoints' folder.
 */
class Client_Portal {
	public $router    = null;
	public $render    = null;
	public $endpoints = null;

	/**
	 * The class constructor initializes the attribbutes and calls an init function.
	 * 
	 */
	public function __construct() {
		require_once plugin_dir_path( __FILE__ ) . 'class-client-portal-render-helper.php';
		require_once plugin_dir_path( __FILE__ ) . 'class-client-portal-router.php';

		$this->router = new Client_Portal_Router();
		$this->render = new Client_Portal_Render_Helper( $this );

		// Initializes it later. Priority 10
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Initializes the Client Portal Module.
	 * Mainly sets ups all needed hooks.
	 *
	 */
	function init() {
		// Adding the shortcode function for the Client Portal.
		add_shortcode( 'jetpackcrm_clientportal', array( $this, 'client_portal_shortcode' ) );
		add_shortcode( 'zerobscrm_clientportal',  array( $this, 'client_portal_shortcode' ) );
		// Basic theme support (here for now, probs needs option).
		add_filter( 'body_class', array( $this, 'portal_theme_support' ) );
		// Fixes a bug when the Client Portal is set to the homepage (more info: gh-15).
		add_filter( 'redirect_canonical', array( $this, 'redirect_fix_portal_as_homepage' ), 10, 2 );
		// Hook used by our custom rewrite rules.
		add_filter( 'query_vars', array( $this, 'get_portal_query_vars' ), 0 );
		// Styles needed by the Client Portal.
		add_action( 'zbs_enqueue_scripts_and_styles', array( $this, 'portal_enqueue_scripts_and_styles' ) );
		// Custom login redirect hook (this one is in our $router).
		add_action( 'login_redirect', array( $this->router, 'redirect_contacts_upon_login' ), 10, 3 );
		// Initializes all endpoints (including the ones from external plugins).
		$this->init_endpoints();
		// this catches failed logins, checks if from our page, then redirs
		// From mr pippin https://pippinsplugins.com/redirect-to-custom-login-page-on-failed-login/
		add_action( 'wp_login_failed', array( $this, 'portal_login_fail_redirect' ) );  // hook failed login
	}

	/**
	 *
	 */
	public function add_endpoint_class_folder( $endpoint_folder_path ) {
		$endpoint_directory = glob( $endpoint_folder_path . '/class*endpoint.php' );
		foreach ( $endpoint_directory as $endpoint_file ) {
			require_once $endpoint_file;
			// Gets the filename without the ';php' suffix. e.g. 'class-single-invoice-endpoint'.
			$base_filename = basename( $endpoint_file, '.php' );
			// Turns the snake case filename into pascal case separated by '_'. e.g. 'Class_Single_Invoice_Endpoint'
			$pascal_case_filename = str_replace('-', '_', ucwords($base_filename, '-'));
			// Removes the 'Class' prefix and adds the hardcoded namespace. e.g. 'Automattic\JetpackCRM\SingleInvoiceEndpoint'
			$endpoint_class = 'Automattic\JetpackCRM\\' . str_replace('Class_', '', $pascal_case_filename);
			// Registers the endpoint
			$this->endpoints = $endpoint_class::register_endpoint($this->endpoints, $this);
		}
	}

	public function sort_endpoints_by_menu_order() {
		// Sort all endpoints by their order
		usort ( $this->endpoints, function( $endpoint_a, $endpoint_b ) {
			if ( $endpoint_a->menu_order == $endpoint_b->menu_order ) {
				return 0;
			} else {
    			return ( $endpoint_a->menu_order < $endpoint_b->menu_order ) ? -1 : 1;
			}
		} );
	}

	/**
	 *  Initializes all the endpoints for the Client Portal
	 */
	public function init_endpoints() {
		// Since this is the init function, we should start with an empty array.
		$this->endpoints = array();
		// By default we load all classes in the endpoints folder.
		$this->add_endpoint_class_folder( plugin_dir_path( __FILE__ ) . 'endpoints' );
		// Allowing plugins to declare their endpoint classes.
		do_action( 'jpcrm_client_portal_register_endpoint', $this );

		do_action( 'jpcrm_client_portal_post_init_endpoints', $this );

		$this->sort_endpoints_by_menu_order();
		$this->add_all_rewrite_endpoints();
	}

	/**
	 * Sorts out the stylesheet includes.
	 *
	 */
	function portal_enqueue_scripts_and_styles() {
		global $zbs;

		wp_enqueue_style( 'zbs-portal', plugins_url( '/css/jpcrm-public-portal' . wp_scripts_get_suffix() . '.css', __FILE__ ), array(), $zbs->version );
		wp_enqueue_style('zbs-fa', ZEROBSCRM_URL . 'css/font-awesome.min.css', array(), $zbs->version );

		// This do_action call was left here for compatibility purposes (legacy).
		do_action('zbs_enqueue_portal', 'zeroBS_portal_enqueue_stuff');
		// This new action should be used for newer implementations.
		do_action('jpcrm_enqueue_client_portal_styles');
	}

	/**
	 * Function used to offer css support for some themes.
	 */
	function portal_theme_support( $classes = array() ) {
		$theme_slug = get_stylesheet();

		switch( $theme_slug ) {
			case 'twentyseventeen':
				$classes[] ='zbs-theme-support-2017';
				break;
			case 'twentynineteen':
				$classes[] = 'zbs-theme-support-2019';
				break;
			case 'twentytwenty':
				$classes[] = 'zbs-theme-support-2020';
				break;
			case 'twentytwentyone':
				$classes[] = 'zbs-theme-support-2021';
				break;
			case 'twentytwentytwo':
				$classes[] = 'zbs-theme-support-2022';
				break;
		}
		return $classes;
	}

	/**
	* Locate template.
	*
	* Locate the called template.
	* Search Order:
	* 1. /themes/theme/zerobscrm-plugin-templates/$template_name
	* 2. /themes/theme/$template_name
	* 3. /plugins/portal/v3/templates/$template_name.
	*
	* @since 1.2.7
	*
	* @param string $template_name Template to load.
	* @param string $string $template_path Path to templates.
	* @param string $default_path Default path to template files.
	* @return string Path to the template file.
	*/
	function locate_template( $template_name, $template_path = '', $default_path = '' ) {
		// Set variable to search in zerobscrm-plugin-templates folder of theme.
		if ( ! $template_path ) :
			$template_path = 'zerobscrm-plugin-templates/';
		endif;
		// Set default plugin templates path.
		if ( ! $default_path ) :
			$default_path = ZEROBSCRM_PATH . 'modules/portal/templates/'; // Path to the template folder
		endif;
		// Search template file in theme folder.
		$template = locate_template( array(
			$template_path . $template_name,
			$template_name
		) );
		// Get plugins template file.
		if ( ! $template ) :
			$template = $default_path . $template_name;
		endif;
		return apply_filters( 'locate_template', $template, $template_name, $template_path, $default_path );
	}

	/**
	* Get template.
	*
	* Search for the template and include the file.
	*
	* @since 1.2.7
	*
	* @see get_template()
	*
	* @param string $template_name Template to load.
	* @param array $args Args passed for the template file.
	* @param string $string $template_path Path to templates.
	* @param string $default_path Default path to template files.
	*/
	function get_template( $template_name, $args = array(), $tempate_path = '', $default_path = '' ) {

		if ( is_array( $args ) && isset( $args ) ) :
			extract( $args );
		endif;	
		$template_file = $this->locate_template( $template_name, $tempate_path, $default_path );
		if ( ! file_exists( $template_file ) ) :
			_doing_it_wrong( __FUNCTION__, sprintf( '<code>%s</code> does not exist.', esc_html( $template_file ) ), '1.0.0' );
			return;
		endif;
		include_once $template_file;
	}

	// this handles contact detail updates via $_POST from the client portal
	// this is a #backward-compatibility landmine; proceed with caution (see gh-1642)
	function jpcrm_portal_update_details_from_post($cID=-1 ){

		global $zbs, $zbsCustomerFields;

		/**
		* This gets fields hidden in Client Portal settings.
		* Eventually we should expand this to preprocess and filter
		* the following fields altogether if disabled:
		*   - countries: zeroBSCRM_getSetting('countries')
		*   - second addresses: zeroBSCRM_getSetting('secondaddress')
		*   - all addresses: zeroBSCRM_getSetting('showaddress')
		*   - not sure what this is: $zbs->settings->get('fieldhides')
		*/
		$hidden_fields    = $zbs->settings->get( 'portal_hidefields' );
		$hidden_fields    = !empty( $hidden_fields ) ? explode( ',', $hidden_fields ) : array();
		$read_only_fields = $zbs->settings->get( 'portal_readonlyfields' );
		$read_only_fields = !empty( $read_only_fields ) ? explode( ',', $read_only_fields ) : array();

		// get existing contact data
		$old_contact_data = $zbs->DAL->contacts->getContact( $cID );

		// downgrade to old-style second address keys so that field names match the object generated by zeroBS_buildCustomerMeta()
		$key_map = array(
			'secaddr_addr1' => 'secaddr1',
			'secaddr_addr2' => 'secaddr2',
			'secaddr_city' => 'seccity',
			'secaddr_county' => 'seccounty',
			'secaddr_country' => 'seccountry',
			'secaddr_postcode' => 'secpostcode'
		);
		foreach ( $key_map as $newstyle_key => $oldstyle_key ) {
			if ( isset( $old_contact_data[$newstyle_key] ) ){
				$old_contact_data[$oldstyle_key] = $old_contact_data[$newstyle_key];
				unset($old_contact_data[$newstyle_key]);
			}
		}

		// create new (sanitised) contact data from $_POST
		$new_contact_data = zeroBS_buildCustomerMeta($_POST, $old_contact_data);

		// process fields
		$fields_to_change = array();
		foreach ( $new_contact_data as $key => $value ) {
			// check for hidden or read only field groups
			$is_hidden_or_readonly_field_group = false;
			if ( isset( $zbsCustomerFields[$key] ) && isset( $zbsCustomerFields[$key]['area'] ) ) {
				$area_key = ( $zbsCustomerFields[$key]['area'] == "Main Address" ) ? 'jpcrm-main-address' : '';
				$area_key = ( $zbsCustomerFields[$key]['area'] == "Second Address" ) ? 'jpcrm-main-address' : $area_key;
				if ( in_array( $area_key, $hidden_fields ) || in_array( $area_key, $read_only_fields ) ) {
					$is_hidden_or_readonly_field_group = true;
				}
			}

			// if invalid or unauthorised field, keep old value
			if ( !isset( $zbsCustomerFields[$key] ) || in_array( $key, $hidden_fields ) || in_array( $key, $read_only_fields) || $is_hidden_or_readonly_field_group ) {
				$new_contact_data[$key] = $old_contact_data[$key];
			}

			// collect fields that changed
			elseif ( $old_contact_data[$key] != $value ) {
				$fields_to_change[] = $key;
			}
		}
		// update contact if fields changed
		if ( count( $fields_to_change ) > 0 ) {

			$cID = $zbs->DAL->contacts->addUpdateContact(
				array(
					'id'    =>  $cID,
					'data'  => $new_contact_data,
					'do_not_update_blanks' => false
				)
			);


			// update log if contact update was successful
			if ( $cID ){

				// build long description string for log
				$longDesc = '';
				foreach ( $fields_to_change as $field ) {
					if ( !empty( $longDesc ) ) {
						$longDesc .= '<br>';
					}
					$longDesc .= sprintf( '%s: <code>%s</code> → <code>%s</code>', $field, $old_contact_data[$field], $new_contact_data[$field]);
				}

				zeroBS_addUpdateLog(
					$cID,
					-1,
					-1,
					array(
						'type' => __( 'Details updated via Client Portal', 'zero-bs-crm' ),
						'shortdesc' => __( 'Contact changed some of their details via the Client Portal', 'zero-bs-crm' ),
						'longdesc' => $longDesc,
					),
					'zerobs_customer'
				);

				echo "<div class='zbs_alert'>" . esc_html__( 'Details updated.', 'zero-bs-crm') . "</div>";

			}
			else {
				echo "<div class='zbs-alert-danger'>" . esc_html__( 'Error updating details!', 'zero-bs-crm' ) . "</div>";
			}
		}

		return $cID;
	}

	/**
	 * Checks if a user has "enabled" or "disabled" access.
	 * 
	 * @return bool True if the user is enabled in the Client Portal.
	 */
	function is_user_enabled() {
		// cached?
		if (defined('ZBS_CURRENT_USER_DISABLED')) return false;

		global $wpdb;
		$uid = get_current_user_id();
		$cID = zeroBS_getCustomerIDFromWPID($uid);

		// these ones definitely work
		$uinfo = get_userdata( $uid );
		$potentialEmail = ''; if (isset($uinfo->user_email)) $potentialEmail = $uinfo->user_email;
		$cID = zeroBS_getCustomerIDWithEmail($potentialEmail);

		$disabled = zeroBSCRM_isCustomerPortalDisabled($cID);

		if (!$disabled) return true;

		// cache to avoid multi-check
		define('ZBS_CURRENT_USER_DISABLED',true);
		return false;

	}

	/**
	 * Fixes a bug when the Client Portal is set to the homepage.
	 */
	function redirect_fix_portal_as_homepage( $redirect_url, $requested_url ) {
		// When the Client Portal is set to the homepage we have to allow the slug
		// to be used for the child pages. We have to do this because WordPress will
		// redirect child pages to the root (e.g. '/clients/invoices' to '/invoices')
		// when the Client Portal is set to the homepage. This will fix it.
		if ( $this->is_a_client_portal_endpoint() ) {
			return $requested_url;
		}

		return $redirect_url;
	}

	function add_all_rewrite_endpoints() {
		foreach ( $this->endpoints as $endpoint ) {
			if ( $endpoint->add_rewrite_endpoint ) {
				$slug = $endpoint->slug;
				// TODO: remove reliance on Client Portal Pro from Core
				if ( function_exists( 'zeroBSCRM_clientPortalgetEndpoint' ) ) {
					$slug = zeroBSCRM_clientPortalgetEndpoint( $slug );
				}
				add_rewrite_endpoint( $slug, EP_ROOT | EP_PAGES );
			}
		}
		jpcrm_client_portal_flush_rewrite_rules_if_needed();
	}

	/**
	 * Returns the query vars associated with the Client Portal.
	 *
	 * @return array The list of the query vars associated with the Client Portal.
	 */
	function get_portal_query_vars( $vars ) {
		foreach ( $this->endpoints as $endpoint ) {
			if ( $endpoint->add_rewrite_endpoint ) {
				$slug = $endpoint->slug;
				// TODO: remove reliance on Client Portal Pro from Core
				if ( function_exists( 'zeroBSCRM_clientPortalgetEndpoint' ) ) {
					$slug = zeroBSCRM_clientPortalgetEndpoint( $slug );
				}
				$vars[] = $slug;
			}
		}
		return $vars;
	}

	/**
	 * Lets us check early on in the action stack to see if page is ours.
	 * Only works after 'wp' in action order (needs wp_query->query_var)
	 * Is also used by zeroBSCRM_isClientPortalPage in Admin Checks 
	 * (which affects force redirect to dash, so be careful).
	 * 
	 * @return bool Returns true if the current page is a portal page.
	 */
	function is_portal_page() {
		return ! is_admin() && $this->is_a_client_portal_endpoint();
	}

	/**
	 * Checks if is a child, or a child of a child, of the client portal main page.
	 *
	 * @return bool Returns true if is a child, or a child of a child, of the client portal main page.
	 */
	function is_child_of_portal_page() {
		global $post; 
		
		if (!is_admin() && function_exists('zeroBSCRM_getSetting') && zeroBSCRM_isExtensionInstalled('portal')){

			$portalPage = (int)zeroBSCRM_getSetting('portalpage');
			
			if ($portalPage > 0 && isset($post) && is_object($post)){

				if ( is_page() && ($post->post_parent == $portalPage) ) {
						return true;
				} else { 

					// check 1 level deeper
					if ($post->post_parent > 0){

						$parentsParentID = (int)wp_get_post_parent_id($post->post_parent);
						
						if ($parentsParentID > 0 && ($parentsParentID == $portalPage) ) return true;

					}
					return false; 
				}
			}
		}
		return false;

	}
	
	/**
	 * Only works after 'wp' in action order (needs $wp_query->post).
	 *
	 *	@return bool If current page loaded has an endpoint that matches ours returns true. False otherwise.
	 */
	function is_a_client_portal_endpoint() {
		global $wp_query;
		// We get the post id (which will be the page id) + compare to our setting.
		$portalPage = zeroBSCRM_getSetting('portalpage');
		if (
			! empty( $portalPage ) &&
			$portalPage > 0 &&
			isset( $wp_query->post ) &&
			gettype( $wp_query->post ) == 'object' &&
			isset( $wp_query->post->ID ) &&
			$wp_query->post->ID == $portalPage
		) {
			return true;
		} else {
			return $this->is_child_of_portal_page();
		}
	}

	/**
	 * This is the shortcode function for the Client Portal. 
	 *
	 */
	function client_portal_shortcode() {
		// This function is being called by a shortcode (add_shortcode) and should never return any output (e.g. echo).
		// The implementation is old and removing all the output requires a lot of work. This is a quick workaround to fix it.
		ob_start();
		// this checks that we're on the front-end
		// ... a necessary step, because the editor (wp) now runs the shortcode on loading (probs gutenberg)
		// ... and because this should RETURN, instead it ECHO's directly
		// ... it should not run on admin side, because that means is probs an edit page!
		if ( !is_admin() ) {
			global $wp_query;

			// Setting the default endpoint to be the dashboard.
			// This could be customizable by the user if we want to.
			$endpoints_slug_array_column = array_column($this->endpoints, null, 'slug');
			// Let the default endpoint to be overriden by plugins.
			$default_endpoint_slug = apply_filters( 'jpcrm_client_portal_default_endpoint_slug', 'dashboard', $this );
			$endpoint = $endpoints_slug_array_column[$default_endpoint_slug];
			$portal_query_vars = $this->get_portal_query_vars( $wp_query->query_vars );

			foreach( $portal_query_vars as $var_key => $var_value ) {
				foreach ( $this->endpoints as $endpoint_search ) {
					if ( $endpoint_search->slug === $var_key ) {
						$endpoint = $endpoint_search;
						$endpoint->param_value = $var_value;
						break 2; // Breaks this loop and the outer loop, hence 2.
					}
				}
			}

			// allows one to tweak endpoint properties as needed before running endpoint actions
			$endpoint->before_endpoint_actions();
			$endpoint->perform_endpoint_action();
		}

		$result = ob_get_contents();
		ob_end_clean();
		return $result;
	}

	/**
	 * This catches failed logins, checks if from our page, then redirs
	 * From mr pippin https://pippinsplugins.com/redirect-to-custom-login-page-on-failed-login/
	 *
	 */
	function portal_login_fail_redirect( $username ) {
		$referrer = '';
		if(array_key_exists('HTTP_REFERER', $_SERVER)){
			$referrer = $_SERVER['HTTP_REFERER'];  // where did the post submission come from?
		}

		// if there's a valid referrer, and it's not the default log-in screen + it's got our post
		if ( !empty($referrer) && !strstr($referrer,'wp-login') && !strstr($referrer,'wp-admin') && isset($_POST['fromzbslogin'])) {
				wp_redirect(zeroBS_portal_link('dash') . '?login=failed' );  // let's append some information (login=failed) to the URL for the theme to use
				exit;
		}
	}

	/**
	* Gets client portal endpoint name for a given object type.
	* 
	* @param   int $obj_type_id  object type ID
	* 
	* @return	str
	* @return	bool false if endpoint is not supported
	*/
	function get_endpoint( $obj_type_id ) {
		return $this->router->get_endpoint( $obj_type_id );
	}

	/**
	* Returns bool if current portal access is provided via easy-access hash
	* 
	* @return	bool - true if current access is via hash
	*/
	function access_is_via_hash( $obj_type_id ){
		return $this->router->access_is_via_hash( $obj_type_id );
	}

	/**
	* Gets current object ID based on portal page URL.
	* 
	* @param   int $obj_type_id  object type ID
	* 
	* @return	int
	* @return	false if invalid object, bad permissions, or any other failure
	*/
	function get_obj_id_from_current_portal_page_url( $obj_type_id ) {
		return $this->router->get_obj_id_from_current_portal_page_url( $obj_type_id );
	}	
}
