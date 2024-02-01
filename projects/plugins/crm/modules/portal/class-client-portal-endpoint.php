<?php
/*!
* Jetpack CRM
* https://jetpackcrm.com
*
* Client Portal Endpoint
*
*/
namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * 
 * This class represents a single Client Portal endpoint (e.g. Quotes)
 * 
 */
#[\AllowDynamicProperties]
abstract class Client_Portal_Endpoint {
	public $portal                       = null;
	public $template_name                = null;
	public $should_check_user_permission = true;
	public $slug                         = null;
	public $name                         = null;
	public $icon                         = null;
	public $hide_from_menu               = null;
	public $hide_from_settings_page      = false;
	public $add_rewrite_endpoint         = null;
	public $menu_order                   = null;
	public $template_args                = array();
	public $template_path                = '';
	public $default_template_path        = '';
	/**
	 * Option param value used by some endpoints
	 * @var string
	 */
	public $param_value;

	abstract public static function register_endpoint( $endpoints, $client_portal );

	public function __construct( $portal ) {
		$this->portal = $portal;
	}

	/**
	 * This function will perform all actions from this endpoint, including
	 * the permission check.
	 */
	public function perform_endpoint_action() {
		// Some endpoints from the Client Portal bypass user permissions and 
		// allow users that are not logged in to see the content. 
		// e.g. Invoices with easy links.
		if ( $this->should_check_user_permission ) {
			if ( ! is_user_logged_in() ) {
				return $this->portal->get_template('login.php');
			}

			if ( ! $this->portal->is_user_enabled() ) {
				return $this->portal->get_template('disabled.php');
			}
		}

		$this->pre_content_action();
		$this->output_html();
		$this->post_content_action();
	}

	public function output_html() {
		if ($this->template_name != '') {
			$this->portal->get_template( 
				$this->template_name,
				$this->template_args, 
				$this->template_path, 
				$this->default_template_path
			);
		}
	}

	/**
	 * This action gets called before any action (even permission checks)
	 * are performed by this endpoint.
	*/
	public function before_endpoint_actions() {
		// Do nothing. Should be overwritten by child classes if needed.
	}

	/**
	 * This action gets called before any rendering is made by the endpoint.
	*/
	public function pre_content_action() {
		// Do nothing. Should be overwritten by child classes if needed.
	}

	/**
	 * This action gets called after all rendering is finished.
	*/
	public function post_content_action() {
		// Do nothing. Should be overwritten by child classes if needed.
	}
}
