<?php
/**
 * One-time wp-admin notice for a domain that connected while nobody was looking.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Shows "Send is on for {domain}" once, on the next wp-admin page that isn't Send's own.
 */
class Ready_Notice {

	/**
	 * Hook the notice.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_notices', array( __CLASS__, 'render' ) );
	}

	/**
	 * Whether the notice should show on this request.
	 *
	 * @return bool
	 */
	public static function should_show() {
		if ( ! current_user_can( 'manage_options' ) || is_network_admin() || Admin_Page::is_dashboard_request() ) {
			return false;
		}
		if ( ! Account::get() || empty( Settings::get()['enabled'] ) ) {
			return false;
		}
		$state = Onboarding::state();
		// The automatic test has to have gone out, and nobody has seen the ready state yet.
		return null !== $state['auto_test_log_id'] && null !== $state['test_sent_at'] && null === $state['verified_seen_at'];
	}

	/**
	 * Print the notice once, then mark the ready state seen.
	 *
	 * @return void
	 */
	public static function render() {
		if ( ! self::should_show() ) {
			return;
		}
		$account = Account::get();
		$state   = Onboarding::state();
		$domain  = (string) ( $account['domain'] ?? '' );
		$test_to = (string) ( $state['test_to'] ?? '' );
		$url     = add_query_arg(
			array(
				'page'  => Admin_Page::MENU_SLUG,
				'p'     => '/log',
				'entry' => (string) $state['auto_test_log_id'],
			),
			admin_url( 'admin.php' )
		);

		$message = sprintf(
			'<strong>%1$s</strong> %2$s <a href="%3$s">%4$s</a>',
			/* translators: %s: the sending domain, e.g. example.com. */
			esc_html( sprintf( __( 'Send is on for %s.', 'jetpack-send-pkg' ), $domain ) ),
			'' === $test_to
				? esc_html__( 'Both records were found, so sending turned on. We sent you a test email.', 'jetpack-send-pkg' )
				/* translators: %s: the email address the test went to. */
				: esc_html( sprintf( __( 'Both records were found, so sending turned on. We sent a test email to %s.', 'jetpack-send-pkg' ), $test_to ) ),
			esc_url( $url ),
			esc_html__( 'See it in your log', 'jetpack-send-pkg' )
		);

		wp_admin_notice(
			$message,
			array(
				'type'        => 'success',
				'dismissible' => true,
			)
		);

		Onboarding::update_from_client( array( 'verified_seen' => true ) );
	}
}
