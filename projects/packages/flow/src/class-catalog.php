<?php
/**
 * Catalog of the triggers and actions Jetpack Flow can connect.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Describes every trigger and action: its label, config fields, and whether it is usable on this site.
 */
class Catalog {

	/**
	 * Trigger definitions keyed by ID.
	 *
	 * `hook` and `args` wire the trigger to a WordPress action. Triggers without a hook fire through
	 * `do_action( 'jetpack_flow_event', $id, $payload )` or the inbound events endpoint.
	 *
	 * @return array<string,array>
	 */
	public static function triggers() {
		$has_woo      = class_exists( 'WooCommerce' );
		$has_crm      = function_exists( 'zeroBSCRM_install_core' ) || defined( 'ZBS_ROOTFILE' );
		$form_tokens  = array( 'name', 'email', 'message', 'form_title', 'entry_url' );
		$order_tokens = array( 'order_id', 'order_total', 'currency', 'email', 'name', 'products' );

		$triggers = array(
			'form_submitted'        => array(
				'label'       => __( 'Form submitted', 'jetpack-flow-pkg' ),
				'description' => __( 'Someone submits a Jetpack Form.', 'jetpack-flow-pkg' ),
				'group'       => 'forms',
				'hook'        => 'grunion_after_feedback_post_inserted',
				'args'        => 4,
				'tokens'      => $form_tokens,
				'available'   => true,
			),
			'newsletter_subscribed' => array(
				'label'       => __( 'New newsletter subscriber', 'jetpack-flow-pkg' ),
				'description' => __( 'A visitor subscribes through a Jetpack Subscribe form.', 'jetpack-flow-pkg' ),
				'group'       => 'newsletter',
				'hook'        => 'jetpack_subscriptions_form_submission',
				'args'        => 1,
				'tokens'      => array( 'email' ),
				'available'   => true,
			),
			'payment_received'      => array(
				'label'       => __( 'Payment received', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce payment completes.', 'jetpack-flow-pkg' ),
				'group'       => 'payments',
				'hook'        => 'woocommerce_payment_complete',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $has_woo,
				'requires'    => 'WooCommerce',
			),
			'woo_product_purchased' => array(
				'label'       => __( 'Product purchased', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce order is completed.', 'jetpack-flow-pkg' ),
				'group'       => 'woocommerce',
				'hook'        => 'woocommerce_order_status_completed',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $has_woo,
				'requires'    => 'WooCommerce',
			),
			'woo_new_order'         => array(
				'label'       => __( 'New WooCommerce order', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce order is placed.', 'jetpack-flow-pkg' ),
				'group'       => 'woocommerce',
				'hook'        => 'woocommerce_new_order',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $has_woo,
				'requires'    => 'WooCommerce',
			),
			'post_published'        => array(
				'label'       => __( 'New post published', 'jetpack-flow-pkg' ),
				'description' => __( 'A post is published.', 'jetpack-flow-pkg' ),
				'group'       => 'content',
				'hook'        => 'transition_post_status',
				'args'        => 3,
				'tokens'      => array( 'post_id', 'post_title', 'post_url', 'author_name', 'author_email' ),
				'available'   => true,
			),
			'comment_posted'        => array(
				'label'       => __( 'New comment', 'jetpack-flow-pkg' ),
				'description' => __( 'A visitor leaves a comment.', 'jetpack-flow-pkg' ),
				'group'       => 'content',
				'hook'        => 'comment_post',
				'args'        => 2,
				'tokens'      => array( 'name', 'email', 'message', 'post_title', 'post_url' ),
				'available'   => true,
			),
			'user_registered'       => array(
				'label'       => __( 'New user registered', 'jetpack-flow-pkg' ),
				'description' => __( 'A new user account is created.', 'jetpack-flow-pkg' ),
				'group'       => 'users',
				'hook'        => 'user_register',
				'args'        => 1,
				'tokens'      => array( 'user_id', 'name', 'email', 'username' ),
				'available'   => true,
			),
			'crm_contact_created'   => array(
				'label'       => __( 'New CRM contact', 'jetpack-flow-pkg' ),
				'description' => __( 'A contact is added in Jetpack CRM.', 'jetpack-flow-pkg' ),
				'group'       => 'crm',
				'hook'        => 'zbs_new_customer',
				'args'        => 1,
				'tokens'      => array( 'contact_id', 'email', 'name' ),
				'available'   => $has_crm,
				'requires'    => 'Jetpack CRM',
			),
			'site_down'             => array(
				'label'       => __( 'Site goes down', 'jetpack-flow-pkg' ),
				'description' => __( 'Jetpack Monitor reports downtime. Send the event to the inbound URL shown on the dashboard.', 'jetpack-flow-pkg' ),
				'group'       => 'monitor',
				'tokens'      => array( 'site_url', 'reason' ),
				'available'   => true,
				'inbound'     => true,
			),
			'site_recovered'        => array(
				'label'       => __( 'Site is back up', 'jetpack-flow-pkg' ),
				'description' => __( 'Jetpack Monitor reports the site recovered.', 'jetpack-flow-pkg' ),
				'group'       => 'monitor',
				'tokens'      => array( 'site_url', 'downtime' ),
				'available'   => true,
				'inbound'     => true,
			),
			'stats_spike'           => array(
				'label'       => __( 'Traffic spike', 'jetpack-flow-pkg' ),
				'description' => __( 'Stats show a sudden jump in visits. Send the event to the inbound URL shown on the dashboard.', 'jetpack-flow-pkg' ),
				'group'       => 'stats',
				'tokens'      => array( 'site_url', 'views', 'post_title' ),
				'available'   => true,
				'inbound'     => true,
			),
			'schedule_daily'        => array(
				'label'       => __( 'Every day', 'jetpack-flow-pkg' ),
				'description' => __( 'Runs once a day.', 'jetpack-flow-pkg' ),
				'group'       => 'schedule',
				'tokens'      => array( 'date' ),
				'available'   => true,
			),
		);

		/**
		 * Filters the Flow trigger catalog.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $triggers Trigger definitions keyed by ID.
		 */
		return apply_filters( 'jetpack_flow_triggers', $triggers );
	}

	/**
	 * Action definitions keyed by ID.
	 *
	 * @return array<string,array>
	 */
	public static function actions() {
		$text = static function ( $name, $label, $required = false, $type = 'text' ) {
			return array(
				'name'     => $name,
				'label'    => $label,
				'type'     => $type,
				'required' => $required,
			);
		};

		$actions = array(
			'email_user'                => array(
				'label'       => __( 'Email a user', 'jetpack-flow-pkg' ),
				'description' => __( 'Send an email to any user on this site, a role, or an address.', 'jetpack-flow-pkg' ),
				'group'       => 'email',
				'fields'      => array(
					array(
						'name'     => 'recipient_type',
						'label'    => __( 'Send to', 'jetpack-flow-pkg' ),
						'type'     => 'select',
						'required' => true,
						'default'  => 'user',
						'options'  => array(
							array(
								'value' => 'user',
								'label' => __( 'A specific user', 'jetpack-flow-pkg' ),
							),
							array(
								'value' => 'role',
								'label' => __( 'Everyone with a role', 'jetpack-flow-pkg' ),
							),
							array(
								'value' => 'trigger_email',
								'label' => __( 'The email from the trigger', 'jetpack-flow-pkg' ),
							),
							array(
								'value' => 'email',
								'label' => __( 'An email address', 'jetpack-flow-pkg' ),
							),
						),
					),
					array(
						'name'    => 'user_id',
						'label'   => __( 'User', 'jetpack-flow-pkg' ),
						'type'    => 'user',
						'showIf'  => array( 'recipient_type' => 'user' ),
						'default' => '',
					),
					array(
						'name'    => 'role',
						'label'   => __( 'Role', 'jetpack-flow-pkg' ),
						'type'    => 'role',
						'showIf'  => array( 'recipient_type' => 'role' ),
						'default' => 'administrator',
					),
					array_merge( $text( 'email', __( 'Email address', 'jetpack-flow-pkg' ), false, 'email' ), array( 'showIf' => array( 'recipient_type' => 'email' ) ) ),
					$text( 'subject', __( 'Subject', 'jetpack-flow-pkg' ), true ),
					$text( 'message', __( 'Message', 'jetpack-flow-pkg' ), true, 'textarea' ),
				),
				'available'   => true,
			),
			'webhook'                   => array(
				'label'       => __( 'Send a webhook', 'jetpack-flow-pkg' ),
				'description' => __( 'Send the trigger data to any HTTPS URL.', 'jetpack-flow-pkg' ),
				'group'       => 'developer',
				'fields'      => array(
					$text( 'url', __( 'HTTPS URL', 'jetpack-flow-pkg' ), true, 'url' ),
					array(
						'name'    => 'method',
						'label'   => __( 'Method', 'jetpack-flow-pkg' ),
						'type'    => 'select',
						'default' => 'POST',
						'options' => array(
							array(
								'value' => 'POST',
								'label' => 'POST',
							),
							array(
								'value' => 'PUT',
								'label' => 'PUT',
							),
							array(
								'value' => 'GET',
								'label' => 'GET',
							),
						),
					),
					array(
						'name'    => 'format',
						'label'   => __( 'Format', 'jetpack-flow-pkg' ),
						'type'    => 'select',
						'default' => 'json',
						'options' => array(
							array(
								'value' => 'json',
								'label' => 'JSON',
							),
							array(
								'value' => 'urlencoded',
								'label' => 'URL-encoded',
							),
						),
					),
				),
				'available'   => true,
			),
			'post_to_url'               => array(
				'label'       => __( 'POST to a URL', 'jetpack-flow-pkg' ),
				'description' => __( 'POST the trigger data to a URL.', 'jetpack-flow-pkg' ),
				'group'       => 'developer',
				'fields'      => array(
					$text( 'url', __( 'URL', 'jetpack-flow-pkg' ), true, 'url' ),
					array(
						'name'    => 'format',
						'label'   => __( 'Format', 'jetpack-flow-pkg' ),
						'type'    => 'select',
						'default' => 'json',
						'options' => array(
							array(
								'value' => 'json',
								'label' => 'JSON',
							),
							array(
								'value' => 'urlencoded',
								'label' => 'URL-encoded',
							),
						),
					),
				),
				'available'   => true,
			),
			'mailpoet_subscribe'        => array(
				'label'       => __( 'Add to MailPoet list', 'jetpack-flow-pkg' ),
				'description' => __( 'Subscribe an email address to a MailPoet list.', 'jetpack-flow-pkg' ),
				'group'       => 'newsletter',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
					$text( 'list_name', __( 'List name', 'jetpack-flow-pkg' ) ),
				),
				'available'   => class_exists( '\MailPoet\API\API' ),
				'requires'    => 'MailPoet',
			),
			'hostinger_reach_subscribe' => array(
				'label'       => __( 'Add to Hostinger Reach', 'jetpack-flow-pkg' ),
				'description' => __( 'Add a contact to a Hostinger Reach group.', 'jetpack-flow-pkg' ),
				'group'       => 'newsletter',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
					$text( 'group', __( 'Group', 'jetpack-flow-pkg' ) ),
				),
				'available'   => class_exists( '\Hostinger\Reach\Api\Handlers\ReachApiHandler' ),
				'requires'    => 'Hostinger Reach',
			),
			'google_sheet'              => array(
				'label'       => __( 'Create a Google Sheet', 'jetpack-flow-pkg' ),
				'description' => __( 'Create a spreadsheet in Google Drive with the trigger data.', 'jetpack-flow-pkg' ),
				'group'       => 'data',
				'fields'      => array(
					$text( 'title', __( 'Sheet title', 'jetpack-flow-pkg' ), true ),
				),
				'available'   => true,
			),
			'crm_add_contact'           => array(
				'label'       => __( 'Add CRM contact', 'jetpack-flow-pkg' ),
				'description' => __( 'Create or update a contact in Jetpack CRM.', 'jetpack-flow-pkg' ),
				'group'       => 'crm',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
				),
				'available'   => function_exists( 'zeroBS_integration_addOrUpdateCustomer' ),
				'requires'    => 'Jetpack CRM',
			),
			'create_draft'              => array(
				'label'       => __( 'Create a draft post', 'jetpack-flow-pkg' ),
				'description' => __( 'Save a draft post with the trigger data.', 'jetpack-flow-pkg' ),
				'group'       => 'content',
				'fields'      => array(
					$text( 'title', __( 'Title', 'jetpack-flow-pkg' ), true ),
					$text( 'content', __( 'Content', 'jetpack-flow-pkg' ), false, 'textarea' ),
				),
				'available'   => true,
			),
		);

		/**
		 * Filters the Flow action catalog.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $actions Action definitions keyed by ID.
		 */
		return apply_filters( 'jetpack_flow_actions', $actions );
	}

	/**
	 * Catalog in the shape the dashboard consumes.
	 *
	 * @return array
	 */
	public static function for_rest() {
		$shape = static function ( $items ) {
			$out = array();
			foreach ( $items as $id => $item ) {
				unset( $item['hook'], $item['args'] );
				$out[] = array_merge(
					array(
						'id'       => $id,
						'fields'   => array(),
						'tokens'   => array(),
						'requires' => '',
					),
					$item
				);
			}
			return $out;
		};

		return array(
			'triggers' => $shape( self::triggers() ),
			'actions'  => $shape( self::actions() ),
		);
	}
}
