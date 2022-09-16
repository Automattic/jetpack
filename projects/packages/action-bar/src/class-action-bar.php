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
		if ( is_admin() || ! is_single() ) {
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
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( is_admin() || ! is_single() ) {
			return;
		}

		$post_id = get_the_ID();

		if ( ! is_numeric( $post_id ) ) {
			return;
		}

		$protocol = 'http';
		if ( is_ssl() ) {
			$protocol = 'https';
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id  = get_current_blog_id();
			$bloginfo = get_blog_details( (int) $blog_id );
			$domain   = $bloginfo->domain;
		} else {
			$blog_id   = \Jetpack_Options::get_option( 'id' );
			$url       = home_url();
			$url_parts = wp_parse_url( $url );
			$domain    = $url_parts['host'];
		}

		$post_url   = get_post_permalink( $blog_id );
		$reader_url = $this->get_reader_url( $blog_id );

		$src = sprintf( 'https://widgets.wp.com/action-bar/like#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post_id, $domain );

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
					<li>
						<iframe class="jetpack-action-bar-widget" scrolling="no" frameBorder="0" name="jetpack-action-bar-widget" src="<?php echo esc_url( $src ); ?>"></iframe>
					</li>
					<li>
						<button class="jetpack-action-bar__action-button">
							<?php follow_icon( __( 'Follow site', 'jetpack-action-bar' ) ); ?>
						</button>
					</li>
				</ul>
			</div>
			<div class="jetpack-action-bar__shade"></div>
			<div class="jetpack-action-bar__modal">
				<header>
					<img src="/favicon.ico" class="site-icon"/>
					<a href="<?php echo esc_html( $url ); ?>" class="jetpack-action-bar__modal-title"><strong><?php echo esc_html( $url ); ?></strong></a>
					<a href="#" class="jetpack-action-bar__close close"><?php close_icon(); ?></a>
				</header>
				<section class="menu">
					<a href="https://wordpress.com/abuse/?report_url=<?php echo esc_html( $post_url ); ?>"><?php echo esc_html__( 'Report this content', 'jetpack-action-bar' ); ?></a>
					<a href="<?php echo esc_html( $reader_url ); ?>"><?php echo esc_html__( 'View site in reader', 'jetpack-action-bar' ); ?></a>
					<a href="https://wordpress.com/following/manage?s=<?php echo esc_html( $post_url ); ?>" class="subscription-link"><?php echo esc_html__( 'Manage subscriptions', 'jetpack-action-bar' ); ?></a>
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
