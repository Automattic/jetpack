<?php
/**
 * Action bar.
 *
 * @package automattic/jetpack-action-bar
 */

namespace Automattic\Jetpack\ActionBar;

use Automattic\Jetpack\Assets;

/**
 * Action_Bar class.
 */
class Action_Bar {
	/**
	 * Enqueue scripts for rendering Action Bar client.
	 */
	public function enqueue_scripts() {
		if ( ! $this->is_active() ) {
			return;
		}

		Assets::register_script(
			'jetpack-action-bar',
			'../build/action-bar.js',
			__FILE__,
			array(
				'dependencies' => array(),
				'in_footer'    => true,
				'enqueue'      => true,
			)
		);
		wp_localize_script(
			'jetpack-action-bar',
			'actionBarConfig',
			array(
				'like_post_error'     => esc_html__( 'Error liking post', 'jetpack-action-bar' ),
				'unlike_post_error'   => esc_html__( 'Error un-liking post', 'jetpack-action-bar' ),
				'follow_site_error'   => esc_html__( 'Error following site', 'jetpack-action-bar' ),
				'unfollow_site_error' => esc_html__( 'Error un-following site', 'jetpack-action-bar' ),
			)
		);
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( ! $this->is_active() ) {
			return;
		}

		$post_id = get_the_ID();

		if ( ! is_numeric( $post_id ) ) {
			return;
		}

		$protocol = is_ssl() ? 'https' : 'http';

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
			// Use the mapped domain, if there is one.
			$domain = get_primary_redirect( $blog_id );
			$url    = "https://$domain";
		} else {
			$blog_id   = \Jetpack_Options::get_option( 'id' );
			$url       = home_url();
			$url_parts = wp_parse_url( $url );
			$domain    = $url_parts['host'];
		}

		$blog_name  = get_bloginfo( 'name' );
		$post_url   = get_permalink( $post_id );
		$reader_url = $this->get_reader_url( $blog_id );
		$widget_src = sprintf( 'https://widgets.wp.com/action-bar/#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post_id, $domain );

		require_once __DIR__ . '/action-bar-icons.php';

		?>
		<div class="jetpack-action-bar-container">
			<div id="jetpack-action-bar" class="jetpack-action-bar">
				<ul class="jetpack-action-bar__action-list">
					<li>
						<button class="jetpack-action-bar__action-button jetpack-action-bar__more">
							<?php ellipsis_icon( __( 'More options', 'jetpack-action-bar' ) ); ?>
						</button>
					</li>
					<li>
						<button class="jetpack-action-bar__action-button">
							<?php comment_icon( __( 'Leave a comment', 'jetpack-action-bar' ) ); ?>
						</button>
					</li>
					<!-- TODO: remove iframe focus state and tab directly to buttons in iframe, if possible -->
					<!-- TODO: placeholder and/or error state if iframe does not load? -->
					<iframe class="jetpack-action-bar-widget" scrolling="no" frameBorder="0" name="jetpack-action-bar-widget" src="<?php echo esc_url( $widget_src ); ?>"></iframe>
				</ul>
			</div>
			<div class="jetpack-action-bar__snackbar"></div>
			<div class="jetpack-action-bar__shade"></div>
			<div class="jetpack-action-bar__modal">
				<header>
					<object data="/favicon.ico" class="site-icon" type="image/x-icon" >
						<?php globe_icon( __( 'site icon', 'jetpack-action-bar' ) ); ?>
					</object>

					<a href="<?php echo esc_url( $url ); ?>" class="jetpack-action-bar__modal-title"><strong><?php echo esc_html( $blog_name ? $blog_name : $domain ); ?></strong></a>
					<a href="#" class="jetpack-action-bar__close close"><?php close_icon( __( 'close', 'jetpack-action-bar' ) ); ?></a>
				</header>
				<section class="menu">
					<a href="https://wordpress.com/abuse/?report_url=<?php echo rawurlencode( $post_url ); ?>"><?php esc_html_e( 'Report this content', 'jetpack-action-bar' ); ?></a>
					<a href="<?php echo esc_url( $reader_url ); ?>"><?php esc_html_e( 'View site in reader', 'jetpack-action-bar' ); ?></a>
					<a href="https://wordpress.com/following/manage?s=<?php echo esc_attr( rawurlencode( $domain ) ); ?>" class="subscription-link"><?php esc_html_e( 'Manage subscriptions', 'jetpack-action-bar' ); ?></a>
				</section>
			</div>
		</div>
		<?php
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}

	/**
	 * Determine if the action bar is displayed for this request.
	 *
	 * @return boolean
	 */
	public function is_active() {
		return ! is_admin() && is_single();
	}

	/**
	 * Gets the url for the sites reader feed.
	 *
	 * @param string $blog_id blog id or jetpack blog id.
	 */
	private function get_reader_url( $blog_id ) {
		$feed_id = null;

		if ( class_exists( 'FeedBag' ) ) {
			$feed_id = FeedBag::get_feed_id_for_blog_id( $blog_id );
		}

		if ( $feed_id ) {
			return 'https://wordpress.com/read/feeds/' . esc_attr( $feed_id );
		} else {
			return 'https://wordpress.com/read/blogs/' . esc_attr( $blog_id );
		}
	}
}
