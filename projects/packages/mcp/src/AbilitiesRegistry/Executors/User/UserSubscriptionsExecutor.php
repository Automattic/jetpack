<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Executors\User;

use Automattic\Jetpack\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\Jetpack\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use WP_Error;

/**
 * User Subscriptions Executor Class
 *
 * Handles user billing and subscription operations
 */
class UserSubscriptionsExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user subscriptions ability.
	 *
	 * @param array $input The input parameters.
	 * @return WP_Error|array The subscription data or error.
	 */
	public function execute( array $input = array() ) {
		try {
			$action = ValidationHelper::validate_action(
				$input['action'] ?? 'list',
				array( 'list', 'get_details', 'get_billing_history', 'get_usage', 'get_payment_methods' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			switch ( $action ) {
				case 'list':
					$result = $this->list_subscriptions( $input );
					break;
				case 'get_details':
					$result = $this->get_subscription_details( $input['subscription_id'] ?? 0 );
					break;
				case 'get_billing_history':
					$result = $this->get_billing_history( $input['limit'] ?? 10 );
					break;
				case 'get_usage':
					$result = $this->get_usage_data();
					break;
				case 'get_payment_methods':
					$result = $this->get_payment_methods();
					break;
				default:
					$result = $this->create_error( 'invalid_action', 'Invalid action specified' );
			}

			// Ensure we always return an array or WP_Error, never null.
			if ( null === $result ) {
				return $this->create_error(
					'unexpected_null',
					'Unexpected null result from action: ' . $action,
					500
				);
			}

			return $result;
		} catch ( Exception $e ) {
			return $this->create_error(
				'subscriptions_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user subscriptions ability.
	 *
	 * @param array $input The input parameters.
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

	/**
	 * List user subscriptions
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Subscriptions list or error.
	 */
	private function list_subscriptions( array $input ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$status_filter   = $input['status'] ?? 'active';
		$limit           = $input['limit'] ?? 10;

		// Get subscriptions using WordPress.com Store functions if available.
		$subscriptions = array();
		if ( class_exists( 'WPCOM_Store' ) ) {
			$all_subscriptions = \WPCOM_Store::get_subscriptions( null, $current_user_id );

			if ( is_array( $all_subscriptions ) ) {
				foreach ( $all_subscriptions as $subscription ) {
					$formatted_subscription = $this->format_subscription( $subscription );

					// Apply status filter.
					if ( 'all' === $status_filter || $formatted_subscription['status'] === $status_filter ) {
						$subscriptions[] = $formatted_subscription;
					}
				}
			}
		} else {
			// Fallback to placeholder data.
			$subscriptions = $this->get_placeholder_subscriptions();
		}

		// Apply limit.
		$subscriptions = array_slice( $subscriptions, 0, $limit );

		return array(
			'success'       => true,
			'subscriptions' => $subscriptions,
			'total'         => count( $subscriptions ),
			'summary'       => $this->generate_subscriptions_summary( $subscriptions ),
		);
	}

	/**
	 * Get detailed subscription information
	 *
	 * @param int $subscription_id Subscription ID.
	 * @return WP_Error|array Subscription details or error.
	 */
	private function get_subscription_details( int $subscription_id ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		if ( empty( $subscription_id ) ) {
			return $this->create_error( 'missing_subscription_id', 'Subscription ID is required' );
		}

		$current_user_id = $this->get_current_user_id();

		// Get specific subscription.
		if ( class_exists( 'WPCOM_Store' ) ) {
			$subscription = \WPCOM_Store::get_subscription( $subscription_id );

			if ( ! $subscription || $subscription->get_user_id() !== $current_user_id ) {
				return $this->create_error( 'subscription_not_found', 'Subscription not found or access denied' );
			}

			$details = $this->format_subscription( $subscription, true );
		} else {
			// Fallback placeholder.
			$details = $this->get_placeholder_subscription_details( $subscription_id );
		}

		return array(
			'success'      => true,
			'subscription' => $details,
		);
	}

	/**
	 * Get billing history
	 *
	 * @param int $limit Number of transactions to return.
	 * @return WP_Error|array Billing history or error.
	 */
	private function get_billing_history( int $limit ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $current_user_id will be used in future implementation

		// This would typically use billing history functions
		// For now, return placeholder data.
		$history = array(
			array(
				'transaction_id' => 'txn_123456789',
				'date'           => gmdate( 'Y-m-d H:i:s', strtotime( '-1 month' ) ),
				'amount'         => 96.00,
				'currency'       => 'USD',
				'description'    => 'WordPress.com Personal Plan Renewal',
				'status'         => 'completed',
				'payment_method' => 'Credit Card ending in 4242',
				'receipt_url'    => 'https://wordpress.com/receipt/123456789',
			),
		);

		return array(
			'success'         => true,
			'billing_history' => array_slice( $history, 0, $limit ),
			'total'           => count( $history ),
		);
	}

	/**
	 * Get usage data
	 *
	 * @return WP_Error|array Usage data or error.
	 */
	private function get_usage_data() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();

		// Get user sites for usage calculation.
		$user_sites  = get_ordered_blogs_of_user( $current_user_id );
		$sites_count = is_array( $user_sites ) ? count( $user_sites ) : 0;

		// Calculate storage usage (simplified).
		$storage_used  = 0;
		$storage_limit = 3000; // Default 3GB limit.

		if ( $user_sites ) {
			foreach ( $user_sites as $site ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $site will be used in future implementation
				// This would typically query actual storage usage.
				$storage_used += 100; // Placeholder: 100MB per site.
			}
		}

		return array(
			'success'    => true,
			'usage_data' => array(
				'storage_used'    => $storage_used,
				'storage_limit'   => $storage_limit,
				'bandwidth_used'  => 0,
				'bandwidth_limit' => 0,
				'sites_count'     => $sites_count,
				'sites_limit'     => 100, // Default limit.
			),
		);
	}

	/**
	 * Get payment methods
	 *
	 * @return WP_Error|array Payment methods or error.
	 */
	private function get_payment_methods() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		// This would typically query stored payment methods
		// For now, return placeholder data.
		$payment_methods = array(
			array(
				'id'           => 'pm_123456789',
				'type'         => 'card',
				'last4'        => '4242',
				'brand'        => 'visa',
				'expiry_month' => 12,
				'expiry_year'  => 2025,
				'is_default'   => true,
			),
		);

		return array(
			'success'         => true,
			'payment_methods' => $payment_methods,
			'total'           => count( $payment_methods ),
		);
	}

	/**
	 * Format subscription data
	 *
	 * @param object $subscription Raw subscription object.
	 * @param bool   $detailed     Include detailed information.
	 * @return array Formatted subscription data.
	 */
	private function format_subscription( $subscription, bool $detailed = false ): array {
		$formatted = array(
			'id'             => $subscription->get_id(),
			'product_name'   => $subscription->get_product_name(),
			'product_slug'   => $subscription->get_product_slug(),
			'site_id'        => $subscription->get_blog_id(),
			'site_url'       => get_site_url( $subscription->get_blog_id() ),
			'status'         => $subscription->get_status(),
			'cost'           => $subscription->cost()->amount,
			'currency'       => $subscription->cost()->currency,
			'billing_period' => $subscription->get_renew_interval(),
			'next_payment'   => $subscription->get_expiry(),
			'expiry_date'    => $subscription->get_expiry(),
			'auto_renew'     => $subscription->is_renewable(),
			'purchase_date'  => $subscription->get_subscribed_date(),
		);

		if ( $detailed ) {
			$formatted['features'] = $this->get_subscription_features( $subscription );
		}

		return $formatted;
	}

	/**
	 * Get subscription features
	 *
	 * @param object $subscription Subscription object.
	 * @return array Features list.
	 */
	private function get_subscription_features( $subscription ): array {
		// This would typically query actual features from the subscription
		// For now, return basic features based on product.
		$features = array();

		$product_slug = $subscription->get_product_slug();

		switch ( $product_slug ) {
			case 'personal-bundle':
				$features = array( 'Custom Domain', 'Email Support', 'No Ads' );
				break;
			case 'premium-bundle':
				$features = array( 'Custom Domain', 'Premium Themes', 'Advanced Design', 'Email Support' );
				break;
			case 'business-bundle':
				$features = array( 'Custom Domain', 'Premium Themes', 'Plugins', 'Live Chat Support' );
				break;
			default:
				$features = array( 'Basic Features' );
		}

		return $features;
	}

	/**
	 * Generate subscriptions summary
	 *
	 * @param array $subscriptions Array of subscriptions.
	 * @return array Summary data.
	 */
	private function generate_subscriptions_summary( array $subscriptions ): array {
		$total_subscriptions  = count( $subscriptions );
		$active_subscriptions = 0;
		foreach ( $subscriptions as $sub ) {
			if ( 'active' === $sub['status'] ) {
				++$active_subscriptions;
			}
		}

		$monthly_cost      = 0;
		$yearly_cost       = 0;
		$next_payment_date = null;

		foreach ( $subscriptions as $subscription ) {
			if ( 'active' === $subscription['status'] ) {
				if ( 'monthly' === $subscription['billing_period'] ) {
					$monthly_cost += $subscription['cost'];
				} elseif ( 'yearly' === $subscription['billing_period'] ) {
					$yearly_cost += $subscription['cost'];
				}

				if ( ! $next_payment_date || $subscription['next_payment'] < $next_payment_date ) {
					$next_payment_date = $subscription['next_payment'];
				}
			}
		}

		return array(
			'total_subscriptions'  => $total_subscriptions,
			'active_subscriptions' => $active_subscriptions,
			'monthly_cost'         => $monthly_cost,
			'yearly_cost'          => $yearly_cost,
			'next_payment_date'    => $next_payment_date,
			'is_paying_customer'   => $active_subscriptions > 0,
		);
	}

	/**
	 * Get placeholder subscriptions data
	 *
	 * @return array Placeholder subscriptions.
	 */
	private function get_placeholder_subscriptions(): array {
		return array(
			array(
				'id'             => 123456,
				'product_name'   => 'WordPress.com Personal',
				'product_slug'   => 'personal-bundle',
				'site_id'        => 12345,
				'site_url'       => 'https://example.wordpress.com',
				'status'         => 'active',
				'cost'           => 96.00,
				'currency'       => 'USD',
				'billing_period' => 'yearly',
				'next_payment'   => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
				'expiry_date'    => gmdate( 'Y-m-d', strtotime( '+1 year' ) ),
				'auto_renew'     => true,
				'purchase_date'  => gmdate( 'Y-m-d', strtotime( '-1 year' ) ),
				'features'       => array( 'Custom Domain', 'Email Support', 'No Ads' ),
			),
		);
	}

	/**
	 * Get placeholder subscription details
	 *
	 * @param int $subscription_id Subscription ID.
	 * @return array Placeholder subscription details.
	 */
	private function get_placeholder_subscription_details( int $subscription_id ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $subscription_id will be used in future implementation
		$subscriptions = $this->get_placeholder_subscriptions();
		return $subscriptions[0] ?? array();
	}
}
