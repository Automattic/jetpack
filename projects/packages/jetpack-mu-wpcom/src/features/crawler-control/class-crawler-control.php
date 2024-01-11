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
		'#a8ctest#is',
		'#GPTBot#is',
		'#CCBot#is',
		'#sentibot#is',
		'#Google\-Extended#is',
		'#FacebookBot#is',
		'#omgili#is',
		'#Amazonbot#is',
		'#bingbot#is',
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->hooks();
	}

	/**
	 * Returns whether the current request is a frontend request.
	 * We have to make it mockable due to test env.
	 *
	 * @return bool
	 */
	public function is_frontend() {
		return jetpack_is_frontend();
	}

	/**
	 * Hooks into WordPress.
	 */
	public function hooks() {
		add_action( 'plugins_loaded', array( $this, 'exit_for_bots_unless_permitted' ) );
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
			if ( preg_match( $bot, $user_agent ) ) {
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

		// Special handling for Bingbot.
		if ( preg_match( '#bingbot#is', $user_agent ) ) {
			$this->header( 'X-Robots-Tag: nocache' );
		}

		// Send a friendly message to the user agent.
		if ( $this->is_frontend() && $this->is_useragent_a_bot( $user_agent ) ) {
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
			if ( is_automattic( $blog_id ) ) {
				return true;
			}
			return get_blog_option( $blog_id, self::OPTION_NAME, false );
		}

		return get_option( self::OPTION_NAME, false );
	}
}

new Crawler_Control();
