<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Export CRM segment to MailPoet list class
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Export CRM segment to MailPoet list class
 */
class Mailpoet_Export_Segment_To_MailPoet {


	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup Mailpoet_Export_Segment_To_MailPoet
	 */
	public function __construct( ) {

		// Initialise Hooks
		$this->init_hooks();

	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Mailpoet_Export_Segment_To_MailPoet is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Mailpoet_Admin_Integration main instance
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

		add_action( 'jpcrm_segment_edit_export_mailpoet_button', function() {
			// AJAX call to action 'jpcrm_segment_export_to_mailpoet'
			?>
			<button class="ui submit teal large icon button zbs-segment-export-mailpoet">
				<?php esc_html_e( 'Export to MailPoet', 'zero-bs-crm' ); ?> <i class="mail forward icon"></i>
			</button>
			<?php
		} );

		// enqueue our listview script additions
		add_action( 'jpcrm_enqueue_styles_listview', function() {
			
			global $zbs;
			wp_enqueue_script( 'jpcrm-mailpoet-listview', plugins_url( '/js/jpcrm-mailpoet-listview-additions' . wp_scripts_get_suffix() . '.js', JPCRM_MAILPOET_ROOT_FILE ), array( 'jquery' ), $zbs->version );

		} );

		// hook into zbs_root.lang to add lang labels on our page
		add_filter( 'zbs_globaljs_lang', function( $language_labels = array() ){

			global $zbs, $pagenow;

			// only on our page
			if ( zeroBS_hasGETParamsWithValues( array( 'admin.php' ), array( 'page' => $zbs->slugs['addedit'], 'zbstype' => 'segment' ) ) ){

				$language_labels['mailpoet_list_exists']        = __( 'Previously Exported', 'zero-bs-crm' );
				$language_labels['mailpoet_list_exists_detail'] = __( 'This segment was previously exported to MailPoet. Are you sure you want to export it again?<br>(Doing so will overwrite the existing MailPoet List.)', 'zero-bs-crm' );
				$language_labels['continue_export']             = __( 'Start Export', 'zero-bs-crm' );

			}

			return $language_labels;

		});

		add_action( 'segment_edit_extra_js', function() {
			
			// JS to initiate export when window param passed
			?>

			    // Export segment as MailPoet list.
			    jQuery( '.zbs-segment-export-mailpoet' ).off( 'click' ).on( 'click', function ( e ) {
			        let exportButton = jQuery( e.target );
			        jpcrm_segment_export_to_mailpoet( exportButton );
			    });

			    // Check if mailpoet_export URL param is present, and start auto-export.
			    let searchParams = new URLSearchParams(window.location.search);
			    if ( searchParams.has('mailpoet_export') ) {
			        jQuery( '.zbs-segment-export-mailpoet' ).click();
			    }

			<?php

		} );

		/**
		 * AJAX endpoint to kick off export from Segments to MailPoet
		 * This function only returns the total count of contacts that will
		 * be created as subscribers. Another AJAX request will POST-batch them
		 */
		add_action( 'wp_ajax_jpcrm_mailpoet_export_kick_off', function() {
			
			// Check nonce
			check_ajax_referer( 'zbs-ajax-nonce', 'sec' );

			header( 'Content-Type: application/json' );

			if ( current_user_can( 'admin_zerobs_customers' ) ) {
				global $zbs;

				$segment_id = -1;
				if ( isset( $_POST['segment_id'] ) ) {
					$segment_id = (int) sanitize_text_field( $_POST['segment_id'] );
				}

				try {

					$retrieve_fields = array( 'email' );
					$segment_contacts = $zbs->DAL->segments->getSegmentAudience( $segment_id, 0, 100000, 'ID', 'DESC', false, false, $retrieve_fields );

					$segment = $zbs->DAL->segments->getSegment( $segment_id );

					if ( ! empty( $segment ) && is_array( $segment_contacts ) ) {

						$valid_emails = array_filter( $segment_contacts, function( $sc ) {
							return zeroBSCRM_validateEmail( $sc['email'] );
						} );

						$count_valid_emails = count( $valid_emails );
						$extra_message = '';
						if ( $count_valid_emails > 500 ) {
							$extra_message = __('This might take a while.','zero-bs-crm');
						}

						$list_name = $this->get_export_list_name( $segment['name'] );
						$list_id = $zbs->modules->mailpoet->reset_mailpoet_list_by_segment_name( $list_name );

						if ( ! empty( $list_id ) ) {
							echo json_encode(
								array(
									'jpcrm_segment_ID' => $segment_id,
									'mailpoet_list_ID' => $list_id,
									'success'     	   => true,
									'total_contacts' => $count_valid_emails,
									'lang'		 	 => array(
										'export_in_progress'  	   => __('Export in progress','zero-bs-crm'),
										'export_finished'  	   	   => __('Export finished','zero-bs-crm'),
										'export_in_progress_long'  => __('This Segment is being exported to a MailPoet List.','zero-bs-crm') . ' ' . $extra_message,
										'export_finished_long'     => __('The export process is now complete. Click the button below to view the list of subscribers.','zero-bs-crm'),
										'go_to_mailpoet_list' 	   => __('Go to MailPoet','zero-bs-crm'),
									)
								)
							);
							exit();
						}
					}
				} catch (\Throwable $th) {
					//var_dump($th);
					echo json_encode(
						array(
							'success'   => false,
							'lang'		=> array(
								'error_title'	=> __('Something went wrong','zero-bs-crm'),
								'error_message'	=> $th->getMessage(),
							)
						)
					);
					exit();
				}
			}

			// empty handed
			echo json_encode(
				array(
					'segmentID'     => $segment_id,
					'success'     	=> false,
					'lang'		 	=> array(
						'error_title'	=> __('Something went wrong','zero-bs-crm'),
						'error_message'	=> __('The segment could not be exported to MailPoet','zero-bs-crm'),
					)
				)
			);
			exit();

			
	   	} );

		/**
		 * AJAX endpoint to export to MailPoet Segment, by batch
		 */
		add_action( 'wp_ajax_jpcrm_mailpoet_export_segment', function () {

			header( 'Content-Type: application/json' );

			global $zbs;

			try {

				if ( ! current_user_can( 'admin_zerobs_customers' ) ) {
					echo esc_html__( 'Not enough permissions.', 'zero-bs-crm' );
					exit();
				}

				if ( ! isset( $_POST['segment_id'] ) || ! isset( $_POST['mailpoet_id'] ) ) {
					echo esc_html__( 'Not enough data provided to perform export.', 'zero-bs-crm' );
					exit();
				}

				$segment_id = (int) sanitize_text_field( $_POST['segment_id'] );
				$mailpoet_id = (int) sanitize_text_field( $_POST['mailpoet_id'] );
				$page = (int) sanitize_text_field( $_POST['page'] );
				$per_page = (int) sanitize_text_field( $_POST['per_page'] );

				$retrieve_fields = $retrieve_fields = array( 'email', 'fname', 'lname' );
				$contacts_batch = $zbs->DAL->segments->getSegmentAudience( $segment_id, $page, $per_page, 'ID', 'DESC', false, false, $retrieve_fields );

				// Create MailPoet Mailing List
				$response = $zbs->modules->mailpoet->contacts_to_subscribers( $mailpoet_id, $contacts_batch );

				if ( ! empty( $response['success'] ) ) {

					$is_last_batch = ( count($contacts_batch) < $per_page );

					echo json_encode(
						array(
							'success'     	=> true,
							'segmentID'     => $segment_id,
							'current_page'  => $page,
							'is_last_batch' => $is_last_batch
						)
					);
					exit();

				} else {

					echo json_encode(
						array(
							'segmentID' => $segment_id,
							'success'   => false,
							'error'		=> $response['error'],
							'lang'		 	 => array(
								'error_title'	=> __('Something went wrong','zero-bs-crm'),
								'error_message'	=> __('The segment could not be exported to MailPoet','zero-bs-crm'),
							)
						)
					);
					exit();

				}

			} catch (\Throwable $th) {

				echo json_encode(
					array(
						'segmentID' => $segment_id,
						'success'   => false,
						'error'		=> $th->getMessage(),
						'lang'		 	 => array(
							'error_title'	=> __('Something went wrong','zero-bs-crm'),
							'error_message'	=> __('The segment could not be exported to MailPoet','zero-bs-crm'),
						)
					)
				);
				exit();

			}

		} );


		/**
		 * AJAX endpoint to retrieve summary data about a mailpoet list
		 */
		add_action( 'wp_ajax_jpcrm_mailpoet_retrieve_list_summary', function () {

			header( 'Content-Type: application/json' );

			global $zbs;

			try {

				if ( ! current_user_can( 'admin_zerobs_customers' ) ) {
					echo esc_html__( 'Not enough permissions.', 'zero-bs-crm' );
					exit();
				}

				if ( ! isset( $_POST['list_name'] ) ) {
					echo esc_html__( 'Not enough data provided to perform export.', 'zero-bs-crm' );
					exit();
				}

				$list_name = sanitize_text_field( $_POST['list_name'] );
				$list_suffix = (int)sanitize_text_field( $_POST['add_suffix'] );

				// add ` | CRM`?
				if ( $list_suffix ){
					 $list_name = $this->get_export_list_name( $list_name );
				}

				$list_details = $zbs->modules->mailpoet->get_mailpoet_list_summary_by_name( $list_name );


				if ( ! is_array( $list_details ) ) {

					// nope
	    			zeroBSCRM_sendJSONSuccess( false );
	    			exit();

				} else {

					// success
	    			zeroBSCRM_sendJSONSuccess( $list_details );
					exit();

				}

			} catch (\Throwable $th) {

			    zeroBSCRM_sendJSONError( array( 'fail' => 1 ) );
			    exit();

			}

		} );

	}



	/**
	 * Returns the name that a segment would be exported to
	 */
	public function get_export_list_name( $list_name = '' ) {

		$name = $list_name . ' | CRM';
		##WLREMOVE
		$name = $list_name . ' | Jetpack CRM';
		##/WLREMOVE

		return $name;

	}

}