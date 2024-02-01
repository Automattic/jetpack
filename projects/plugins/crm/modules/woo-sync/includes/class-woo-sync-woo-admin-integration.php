<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Woo Admin class
 *  Collects CRM additions to the WooCommerce backend UI
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync Woo Admin class
 */
class Woo_Sync_Woo_Admin_Integration {


	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup WooSync
	 * Note: This will effectively fire after core settings and modules loaded
	 * ... effectively on tail end of `init`
	 */
	public function __construct( ) {

		// Initialise Hooks
		$this->init_hooks();

	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Woo_Sync_Woo_Admin_Integration is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Woo_Sync_Woo_Admin_Integration main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}


	/**
	 * Initialise Hooks
	 */
	private function init_hooks( ) {

		// Shop Orders: Add CRM column
		add_filter( 'manage_edit-shop_order_columns', array( $this, 'append_orders_column' ), 20 );
		add_action( 'manage_shop_order_posts_custom_column' , array( $this, 'render_orders_column_content' ), 20, 2 );

		// Add CRM meta boxes to Woo Pages
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
	}


	/**
	 * Append our CRM column to the WooCommerce orders view columns
	 *  This should be fired via filter `manage_edit-shop_order_columns`
	 *
	 * @param array $columns
	 */
	public function append_orders_column( $columns ){

		$rebuilt_columns = array();

		// Inserting columns to a specific location
		foreach( $columns as $key => $column){

			$rebuilt_columns[$key] = $column;

			if ( $key ==  'order_status' ){

				// Inserting after "Status" column
				$rebuilt_columns['jpcrm'] = __( 'CRM Contact','zero-bs-crm');

			}

		}

		return $rebuilt_columns;

	}


	/**
	 * HTML rendering of our custom orders view column content
	 *
	 * @param string $column
	 * @param int $order_post_id
	 */
	public function render_orders_column_content( $column, $order_post_id ) {

		global $zbs;

		switch ( $column ){
		
			case 'jpcrm' :
			
				$order = wc_get_order( $order_post_id );
				$email = $order->get_billing_email();

				if ( $email != '' ){

					$contact_id = zeroBS_getCustomerIDWithEmail($email);

					if ( $contact_id > 0 ){

						//we have an email. Add in some actions
						echo '<div class="zbs-actions">';
							$url = jpcrm_esc_link( 'view', $contact_id, 'zerobs_customer' );
							echo '<a class="button button-primary" href="' . esc_url( $url ) . '">' . esc_html__( 'View Contact', 'zero-bs-crm' ) . '</a>';
						echo '</div>';

					} else {

						echo '<div class="zbs-actions">';
							$url = admin_url( 'admin.php?page=' . $zbs->modules->woosync->slugs['hub'] );
							echo '<a class="button button-secondary" href="' . esc_url( $url ) . '">' . esc_html__( 'Add Contact', 'zero-bs-crm' ) . '</a>';
						echo '</div>';

					}
				}

				break;
				
		}
	}


	/**
	 * Add CRM meta boxes to Woo pages
	 */
	public function add_meta_boxes(){
		
		add_meta_box( 
			'zbs_crm_contact',
			__( 'CRM Contact', 'zero-bs-crm' ),
			array( $this, 'render_woo_order_page_contact_box' ),
			['shop_order', 'shop_subscription'],
			'side',
			'core'
		);

	}


	/**
	 * Renders HTML for contact metabox on Woo pages
	 */
	public function render_woo_order_page_contact_box(){

		global $zbs, $post; ?>

			<div class='zbs-crm-contact' style="margin-bottom:20px;">

				<style>
					.zbs-crm-contact{
						text-align:center;
					}
					.zbs-custom-avatar{
						border-radius: 50% !important;
						max-width:80px;
						text-align:center;
						padding:10px;
					}
					.edit-contact-lin{
						margin-top:10px !important;
					}
					.cust-email{
						padding-bottom:10px;
						padding-top:10px;
						color: black;
						font-weight:700;
					}
					.jpcrm-name{
						font-weight:900;
					}
					.status{
						margin-left: 0;
						padding: 0.3em 0.78571429em;
						display: inline-block;
						border-radius: 5px;
						margin-top: 3px;
						margin-bottom: 3px;
						font-size: 12px !important;
						font-weight: 500;
						background-color: #ccc;
					}
					.customer{
						background-color: #21BA45 !important;
						border-color: #21BA45 !important;
						color: #FFFFFF !important;
										
					}
					</style>
				<?php 

					// the customer information pane
					$order = wc_get_order( $post->ID );
					$email = $order->get_billing_email();
					if ( $email != '' ){

						// retrieve contact id
						$contact_id = zeroBS_getCustomerIDWithEmail( $email );
						
						if ( $contact_id > 0 ){

							// retrieve contact
							$crm_contact = $zbs->DAL->contacts->getContact( $contact_id );
							$contact_name = $zbs->DAL->contacts->getContactFullNameEtc( $contact_id, $crm_contact, array( false, false ) );
							$contact_transaction_count = $zbs->DAL->specific_obj_type_count_for_assignee( $contact_id, ZBS_TYPE_TRANSACTION, ZBS_TYPE_CONTACT ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

							// check avatar mode
							$avatar = '';
							$avatar_mode = zeroBSCRM_getSetting('avatarmode'); 
             				if ( $avatar_mode !== 3 ) {
             					$avatar = zeroBS_customerAvatarHTML( $contact_id, $crm_contact, 100, 'ui small image centered' );
             				}

							// Render HTML
							echo "<div class='customer-panel-header'>";
								echo "<div id='panel-customer-avatar'>" . $avatar . "</div>";
								echo "<div id='panel-name'><span class='jpcrm-name'>" . esc_html( $contact_name ) . "</span></div>";
								echo "<div id='panel-status' class='ui label status " . esc_attr( strtolower( $crm_contact['status'] ) ) . "'>" . esc_html( $crm_contact['status'] ) . "</div>";
								echo "<div class='simple-actions zbs-hide'>";
									echo "<a class='ui label circular'><i class='ui icon phone'></i></a>";
									echo "<a class='ui label circular'><i class='ui icon envelope'></i></a>";
								echo "</div>";
							echo "</div>";

							echo "<div class='ui divider'></div>";

							echo "<div class='total-paid-wrap'>";
									echo "<div class='total-paid cell'><div class='heading'> " . esc_html( zeroBSCRM_prettifyLongInts( $contact_transaction_count) . ' ' . ( $contact_transaction_count > 1 ? __( 'Transactions', 'zero-bs-crm' ) : __( 'Transaction', 'zero-bs-crm' ) ) ) . "</div></div>";
							echo "</div>";

							echo "<div class='clear'></div>";
							echo "<div class='ui divider'></div>";

							echo "<div class='panel-left-info cust-email'>";
								echo "<i class='ui icon envelope outline'></i> <span class='panel-customer-email'>" . esc_html( $email ) . "</span>";
							echo "</div>";

							echo "<div class='panel-edit-contact'>";
								echo "<a class='edit-contact-link button button-primary' href='" . jpcrm_esc_link( 'view', $contact_id, 'zerobs_customer' ) . "'>" . esc_html__( 'View Contact', 'zero-bs-crm' ) . "</a>";
							echo "</div>";

							echo "<div class='clear'></div>";
						}

					} else {

						echo "<div class='no-crm-contact'><p style='margin-top:20px;'>";
							esc_html_e( "Once you save your order to a customer with a billing email the CRM contact card will display here.", 'zero-bs-crm' );
						echo "</p></div>";

					} ?>
			</div>
		<?php
		
	}
}