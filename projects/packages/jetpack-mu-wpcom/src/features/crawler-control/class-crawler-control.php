<?php
/**
 * Crawler Control
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Crawler Control
 *
 * @package automattic/jetpack-mu-wpcom
 */
class Crawler_Control {

	const OPTION_NAME     = 'wpcom_is_crawlable';
	const TERMS_URL       = 'https://wp.me/Pe4R-180z';
	const ERROR_MESSAGE   = 'Howdy! We are as excited about the treasure trove of great content on this blog as you are, and we are happy to discuss data research partnerships. Please learn more and contact us at: ' . self::TERMS_URL;
	const X_TERMS         = 'X-Terms: Howdy! We appreciate this content too. Learn more about our data research partnerships: ' . self::TERMS_URL;
	const BOT_USER_AGENTS = array(
		'a8ctest',
		'GPTBot',
		'CCBot',
		'sentibot',
		'Google-Extended',
		'FacebookBot',
		'omgili',
		'Amazonbot',
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->hooks();
	}

	/**
	 * Hooks into WordPress.
	 */
	public function hooks() {
		add_action( 'template_redirect', array( $this, 'exit_for_bots_unless_permitted' ) );
	}

	/**
	 * Returns the user agent.
	 *
	 * @return string
	 */
	public function get_useragent() {
		return ! empty( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
	}

	/**
	 * Returns whether the user agent is a bot.
	 *
	 * @param string $user_agent The user agent.
	 * @return bool
	 */
	public function is_useragent_a_bot( $user_agent ) {
		$bots = apply_filters( 'wpcom_crawler_control_bots', self::BOT_USER_AGENTS );
		foreach ( $bots as $bot ) {
			if ( stristr( $user_agent, $bot ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Sends a header.
	 * We have to mock it due to test env.
	 *
	 * @param string $header The header to send.
	 */
	public function header( $header ) {
		header( $header );
	}

	/**
	 * Handles crawler control.
	 */
	public function exit_for_bots_unless_permitted() {
		if ( $this->is_crawlable() ) {
			return;
		}
		$user_agent = $this->get_useragent();
		if ( ! $user_agent ) {
			return;
		}

		// Special handling for Bingbot.
		if ( stristr( $user_agent, 'bingbot' ) ) {
			$this->header( 'X-Robots-Tag: nocache' );
		}

		// Send a friendly message to the user agent.
		if ( $this->is_useragent_a_bot( $user_agent ) ) {
			$this->header( self::X_TERMS );
			wp_die(
				esc_html( self::ERROR_MESSAGE ),
				402
			);
		}
	}

	/**
	 * Returns whether the current blog is crawlable.
	 *
	 * @return bool
	 */
	public function is_crawlable() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
			if ( function_exists( 'is_automattic' ) && is_automattic( $blog_id ) ) {
				return true;
			}
			return get_blog_option( $blog_id, self::OPTION_NAME, false );
		}

		return get_option( self::OPTION_NAME, false );
	}
}

new Crawler_Control();
