<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Subscriptions Ability Class
 *
 * Provides read-only access to user billing and subscription information
 */
class UserSubscriptionsAbility implements AbilityInterface {
	use AbilityTrait;

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		wp_register_ability(
			$this->get_ability_name(),
			$this->get_config()
		);
	}

	/**
	 * Get the ability configuration array.
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array {
		return array(
			'label'               => 'User Subscriptions',
			'description'         => 'View user billing information, subscriptions, and payment details (read-only)',
			'input_schema'        => $this->get_input_schema(),
			'output_schema'       => $this->get_output_schema(),
			'execute_callback'    => array( $this, 'execute' ),
			'permission_callback' => array( $this, 'check_permission' ),
		);
	}

	/**
	 * Get the input schema for the ability.
	 *
	 * @return array The input schema.
	 */
	private function get_input_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'action'          => array(
					'type'        => 'string',
					'enum'        => array( 'list', 'get_details', 'get_billing_history', 'get_usage', 'get_payment_methods' ),
					'default'     => 'list',
					'description' => 'Subscription action to perform',
				),
				'subscription_id' => array(
					'type'        => 'integer',
					'description' => 'Subscription ID for detailed queries',
				),
				'limit'           => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'default'     => 10,
					'description' => 'Number of items to return',
				),
				'status'          => array(
					'type'        => 'string',
					'enum'        => array( 'active', 'cancelled', 'expired', 'all' ),
					'default'     => 'active',
					'description' => 'Filter subscriptions by status',
				),
			),
			'required'   => array( 'action' ),
		);
	}

	/**
	 * Get the output schema for the ability.
	 *
	 * @return array The output schema.
	 */
	private function get_output_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success'         => array( 'type' => 'boolean' ),
				'subscriptions'   => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'             => array( 'type' => 'integer' ),
							'product_name'   => array( 'type' => 'string' ),
							'product_slug'   => array( 'type' => 'string' ),
							'site_id'        => array( 'type' => 'integer' ),
							'site_url'       => array( 'type' => 'string' ),
							'status'         => array( 'type' => 'string' ),
							'cost'           => array( 'type' => 'number' ),
							'currency'       => array( 'type' => 'string' ),
							'billing_period' => array( 'type' => 'string' ),
							'next_payment'   => array( 'type' => 'string' ),
							'expiry_date'    => array( 'type' => 'string' ),
							'auto_renew'     => array( 'type' => 'boolean' ),
							'purchase_date'  => array( 'type' => 'string' ),
							'features'       => array( 'type' => 'array' ),
						),
					),
				),
				'billing_history' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'transaction_id' => array( 'type' => 'string' ),
							'date'           => array( 'type' => 'string' ),
							'amount'         => array( 'type' => 'number' ),
							'currency'       => array( 'type' => 'string' ),
							'description'    => array( 'type' => 'string' ),
							'status'         => array( 'type' => 'string' ),
							'payment_method' => array( 'type' => 'string' ),
							'receipt_url'    => array( 'type' => 'string' ),
						),
					),
				),
				'payment_methods' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'           => array( 'type' => 'string' ),
							'type'         => array( 'type' => 'string' ),
							'last4'        => array( 'type' => 'string' ),
							'brand'        => array( 'type' => 'string' ),
							'expiry_month' => array( 'type' => 'integer' ),
							'expiry_year'  => array( 'type' => 'integer' ),
							'is_default'   => array( 'type' => 'boolean' ),
						),
					),
				),
				'usage_data'      => array(
					'type'       => 'object',
					'properties' => array(
						'storage_used'    => array( 'type' => 'number' ),
						'storage_limit'   => array( 'type' => 'number' ),
						'bandwidth_used'  => array( 'type' => 'number' ),
						'bandwidth_limit' => array( 'type' => 'number' ),
						'sites_count'     => array( 'type' => 'integer' ),
						'sites_limit'     => array( 'type' => 'integer' ),
					),
				),
				'summary'         => array(
					'type'       => 'object',
					'properties' => array(
						'total_subscriptions'  => array( 'type' => 'integer' ),
						'active_subscriptions' => array( 'type' => 'integer' ),
						'monthly_cost'         => array( 'type' => 'number' ),
						'yearly_cost'          => array( 'type' => 'number' ),
						'next_payment_date'    => array( 'type' => 'string' ),
						'is_paying_customer'   => array( 'type' => 'boolean' ),
					),
				),
			),
		);
	}
}
