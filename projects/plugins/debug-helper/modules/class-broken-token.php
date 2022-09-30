<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * Plugin Name: Broken Token
 * Description: Give me a Jetpack connection, and I'll break it every way possible.
 * Author: Bestpack
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Require the XMLRPC functionality.
 */
require __DIR__ . '/inc/class-broken-token-connection-errors.php';

/**
 * Class Broken_Token
 */
class Broken_Token {
	/**
	 * Notice type.
	 *
	 * @var mixed|string
	 */
	public $notice_type = '';

	/**
	 * Blog token.
	 *
	 * @var bool|mixed
	 */
	public $blog_token;

	/**
	 * User token.
	 *
	 * @var bool|mixed
	 */
	public $user_tokens;

	/**
	 * Jetpack Primary User.
	 *
	 * @var bool|mixed
	 */
	public $master_user;

	/**
	 * Site ID.
	 *
	 * @var bool|mixed
	 */
	public $id;

	/**
	 * Whether the user has agreed to the TOS.
	 *
	 * @var bool
	 */
	public $tos_agreed;

	/**
	 * Options.
	 */
	const STORED_OPTIONS_KEY = 'broken_token_stored_options';

	/**
	 * Token name.
	 *
	 * @var string
	 */
	public $invalid_blog_token = 'broken.token';

	/**
	 * User token name.
	 *
	 * @var string
	 */
	public $invalid_user_token = 'broken.token.%d';

	/**
	 * Broken_Token constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'broken_token_register_submenu_page' ), 1000 );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Stored options.
		add_action( 'admin_post_clear_stored_options', array( $this, 'admin_post_clear_stored_options' ) );
		add_action( 'admin_post_store_current_options', array( $this, 'admin_post_store_current_options' ) );
		add_action( 'admin_post_restore_from_stored_options', array( $this, 'admin_post_restore_from_stored_options' ) );
		add_action( 'admin_post_clear_tos', array( $this, 'admin_post_clear_tos' ) );

		// Break stuff.
		add_action( 'admin_post_set_invalid_blog_token', array( $this, 'admin_post_set_invalid_blog_token' ) );
		add_action( 'admin_post_set_invalid_user_tokens', array( $this, 'admin_post_set_invalid_user_tokens' ) );
		add_action( 'admin_post_set_invalid_current_user_token', array( $this, 'admin_post_set_invalid_current_user_token' ) );
		add_action( 'admin_post_clear_blog_token', array( $this, 'admin_post_clear_blog_token' ) );
		add_action( 'admin_post_clear_current_user_token', array( $this, 'admin_post_clear_current_user_token' ) );
		add_action( 'admin_post_clear_user_tokens', array( $this, 'admin_post_clear_user_tokens' ) );
		add_action( 'admin_post_randomize_master_user', array( $this, 'admin_post_randomize_master_user' ) );
		add_action( 'admin_post_randomize_master_user_and_token', array( $this, 'admin_post_randomize_master_user_and_token' ) );
		add_action( 'admin_post_clear_master_user', array( $this, 'admin_post_clear_master_user' ) );
		add_action( 'admin_post_set_current_master_user', array( $this, 'admin_post_set_current_master_user' ) );
		add_action( 'admin_post_randomize_blog_id', array( $this, 'admin_post_randomize_blog_id' ) );
		add_action( 'admin_post_clear_blog_id', array( $this, 'admin_post_clear_blog_id' ) );

		$this->blog_token  = Jetpack_Options::get_option( 'blog_token' );
		$this->user_tokens = Jetpack_Options::get_option( 'user_tokens' );
		$this->master_user = Jetpack_Options::get_option( 'master_user' );
		$this->id          = Jetpack_Options::get_option( 'id' );
		$this->tos_agreed  = Jetpack_Options::get_option( 'tos_agreed' );

		if ( isset( $_GET['notice'] ) && check_admin_referer( 'jetpack_debug_broken_token_admin_notice', 'nonce' ) ) {
			$this->notice_type = sanitize_key( $_GET['notice'] );
			add_action( 'admin_notices', array( $this, 'render_admin_notice' ) );
		}
	}

	/**
	 * Enqueue scripts.
	 *
	 * @param string $hook Called hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'jetpack_page_broken-token' ) === 0 ) {
			wp_enqueue_style( 'broken_token_style', plugin_dir_url( __FILE__ ) . '/css/style.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Register's submenu.
	 */
	public function broken_token_register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Broken Token',
			'Broken Token',
			'manage_options',
			'broken-token',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		$stored_options = $this->get_stored_connection_options();
		?>
		<h1>Broken Token 😱!</h1>
		<p>This plugin will help you break the Jetpack connection in various ways.</p>
		<p>All instances of breaking only involve modifying the local DB options. Nothing done here will alter tokens stored in wp.com</p>
		<hr>

		<h2>Current token options being used by Jetpack:</h2>
		<p>Blog Token: <?php echo esc_html( $this->blog_token ); ?></p>
		<p>User Tokens: <?php print_r( $this->user_tokens ); ?></p>
		<p>Primary User: <?php echo esc_html( $this->master_user ); ?></p>
		<p>Blog ID: <?php echo esc_html( $this->id ); ?></p>

		<?php
		if ( $this->tos_agreed ) {
			?>
			<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
				<p>TOS Accepted: ✅ &nbsp;
				<input type="hidden" name="action" value="clear_tos">
				<?php wp_nonce_field( 'clear-tos' ); ?>
				<input type="submit" value="Clear" class="button button-secondary button-small">
				</p>
			</form>
			<?php
		} else {
			?>
			<p>TOS Accepted: ❌</p>
			<?php
		}
		?>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="store_current_options">
			<?php wp_nonce_field( 'store-current-options' ); ?>
			<input type="submit" value="Store these options" class="button button-primary">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="restore_from_stored_options">
			<?php wp_nonce_field( 'restore-stored-options' ); ?>
			<input type="submit" value="Restore from stored options" class="button button-primary <?php echo empty( $stored_options ) ? 'disabled' : ''; ?>">
		</form>

		<?php
		echo '<h2>Stored connection options.</h2>';
		echo '<p>Might be useful to store valid connection options before breaking it, so you can restore later.</p>';
		if ( empty( $stored_options ) ) {
			echo '<p>No connection options are currently stored!</p>';
		} else {
			echo '<pre>';
			print_r( $stored_options );
			echo '</pre>';
		}
		?>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_stored_options">
			<?php wp_nonce_field( 'clear-stored-options' ); ?>
			<input type="submit" value="Clear stored options" class="button button-primary <?php echo empty( $stored_options ) ? 'disabled' : ''; ?>">
		</form>

		<hr>

		<h2>Break some stuff:</h2>
		<p><strong>Break the blog token:</strong></p>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="set_invalid_blog_token">
			<?php wp_nonce_field( 'set-invalid-blog-token' ); ?>
			<input type="submit" value="Set invalid blog token" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_blog_token">
			<?php wp_nonce_field( 'clear-blog-token' ); ?>
			<input type="submit" value="Clear blog token" class="button button-primary button-break-it">
		</form>

		<p><strong>Break the user tokens:</strong></p>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_user_tokens">
			<?php wp_nonce_field( 'clear-user-tokens' ); ?>
			<input type="submit" value="Clear user tokens" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="set_invalid_user_tokens">
			<?php wp_nonce_field( 'set-invalid-user-tokens' ); ?>
			<input type="submit" value="Set invalid user tokens" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_current_user_token">
			<?php wp_nonce_field( 'clear-current-user-token' ); ?>
			<input type="submit" value="Clear user token (current user)" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="set_invalid_current_user_token">
			<?php wp_nonce_field( 'set-invalid-current-user-token' ); ?>
			<input type="submit" value="Set invalid user token (current user)" class="button button-primary button-break-it">
		</form>

		<p><strong>Break the Primary User:</strong></p>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="randomize_master_user">
			<?php wp_nonce_field( 'randomize-master-user' ); ?>
			<input type="submit" value="Randomize Primary User ID" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="randomize_master_user_and_token">
			<?php wp_nonce_field( 'randomize-master-user-and-token' ); ?>
			<input type="submit" value="Randomize Primary User ID and move the user token together" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_master_user">
			<?php wp_nonce_field( 'clear-master-user' ); ?>
			<input type="submit" value="Clear the Primary User" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="set_current_master_user">
			<?php wp_nonce_field( 'set-current-master-user' ); ?>
			<input type="submit" value="Set Current Primary User" class="button button-primary button-break-it">
		</form>

		<p><strong>Break the blog ID:</strong></p>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="randomize_blog_id">
			<?php wp_nonce_field( 'randomize-blog-id' ); ?>
			<input type="submit" value="Randomize Blog ID" class="button button-primary button-break-it">
		</form>
		<br>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="clear_blog_id">
			<?php wp_nonce_field( 'clear-blog-id' ); ?>
			<input type="submit" value="Clear the Blog ID" class="button button-primary button-break-it">
		</form>
		<?php
	}

	/**
	 * Store options.
	 */
	public function admin_post_store_current_options() {
		check_admin_referer( 'store-current-options' );
		$this->notice_type = 'store-options';
		$this->store_current_options();

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear options.
	 */
	public function admin_post_clear_stored_options() {
		check_admin_referer( 'clear-stored-options' );
		$this->clear_stored_options();

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Restore from options.
	 */
	public function admin_post_restore_from_stored_options() {
		check_admin_referer( 'restore-stored-options' );
		$this->notice_type = 'restore-options';
		foreach ( $this->get_stored_connection_options() as $key => $value ) {
			if ( empty( $value ) ) {
				if ( 'tos_agreed' === $key ) {
					Jetpack_Options::delete_option( 'tos_agreed' );
				}

				continue;
			}
			Jetpack_Options::update_option( $key, $value );
		}

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Set invalid blog token.
	 */
	public function admin_post_set_invalid_blog_token() {
		check_admin_referer( 'set-invalid-blog-token' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::update_option( 'blog_token', $this->invalid_blog_token );

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Set invalid user token.
	 */
	public function admin_post_set_invalid_user_tokens() {
		check_admin_referer( 'set-invalid-user-tokens' );
		$this->notice_type = 'jetpack-broken';

		$new_tokens = array();

		foreach ( Jetpack_Options::get_option( 'user_tokens' ) as $id => $token ) {
			$new_tokens[ $id ] = sprintf( $this->invalid_user_token, $id );
		}

		Jetpack_Options::update_option( 'user_tokens', $new_tokens );

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Set invalid current user token.
	 */
	public function admin_post_set_invalid_current_user_token() {
		check_admin_referer( 'set-invalid-current-user-token' );
		$this->notice_type = 'jetpack-broken';

		$tokens = Jetpack_Options::get_option( 'user_tokens' );

		$id            = get_current_user_id();
		$tokens[ $id ] = sprintf( $this->invalid_user_token, $id );

		Jetpack_Options::update_option( 'user_tokens', $tokens );

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear blog token.
	 */
	public function admin_post_clear_blog_token() {
		check_admin_referer( 'clear-blog-token' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::delete_option( 'blog_token' );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear user token.
	 */
	public function admin_post_clear_user_tokens() {
		check_admin_referer( 'clear-user-tokens' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::delete_option( 'user_tokens' );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear current user token.
	 */
	public function admin_post_clear_current_user_token() {
		check_admin_referer( 'clear-current-user-token' );
		$this->notice_type = 'jetpack-broken';

		$tokens = Jetpack_Options::get_option( 'user_tokens' );

		$id = get_current_user_id();
		if ( isset( $tokens[ $id ] ) ) {
			unset( $tokens[ $id ] );
		}

		Jetpack_Options::update_option( 'user_tokens', $tokens );

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Randomize master user.
	 */
	public function admin_post_randomize_master_user() {
		check_admin_referer( 'randomize-master-user' );
		$this->notice_type = 'jetpack-broken';
		$current_id        = Jetpack_Options::get_option( 'master_user' );
		Jetpack_Options::update_option( 'master_user', wp_rand( $current_id + 1, $current_id + 100 ) );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Randomize master user and its token.
	 */
	public function admin_post_randomize_master_user_and_token() {
		check_admin_referer( 'randomize-master-user-and-token' );
		$this->notice_type = 'jetpack-broken';
		$current_id        = Jetpack_Options::get_option( 'master_user' );
		$random_id         = wp_rand( $current_id + 1, $current_id + 100 );
		Jetpack_Options::update_option( 'master_user', $random_id );
		$user_tokens = Jetpack_Options::get_option( 'user_tokens', array() );
		if ( isset( $user_tokens[ $current_id ] ) ) {
			$user_tokens[ $random_id ] = substr( $user_tokens[ $current_id ], 0, strrpos( $user_tokens[ $current_id ], '.' ) ) . ".$random_id";
			unset( $user_tokens[ $current_id ] );
		}
		Jetpack_Options::update_option( 'user_tokens', $user_tokens );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear master user.
	 */
	public function admin_post_clear_master_user() {
		check_admin_referer( 'clear-master-user' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::delete_option( 'master_user' );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Set current master user.
	 */
	public function admin_post_set_current_master_user() {
		check_admin_referer( 'set-current-master-user' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::update_option( 'master_user', get_current_user_id() );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Randomize blog ID.
	 */
	public function admin_post_randomize_blog_id() {
		check_admin_referer( 'randomize-blog-id' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::update_option( 'id', wp_rand( 100, 10000 ) );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear blog ID.
	 */
	public function admin_post_clear_blog_id() {
		check_admin_referer( 'clear-blog-id' );
		$this->notice_type = 'jetpack-broken';
		Jetpack_Options::delete_option( 'id' );
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Stores a backup of the current Jetpack connection options.
	 */
	public function store_current_options() {
		update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'blog_token'  => $this->blog_token,
				'user_tokens' => $this->user_tokens,
				'master_user' => $this->master_user,
				'id'          => $this->id,
				'tos_agreed'  => $this->tos_agreed,
			)
		);
	}

	/**
	 * Retrieves the stored connection options.
	 *
	 * @return array
	 */
	public function get_stored_connection_options() {
		return get_option( self::STORED_OPTIONS_KEY );
	}

	/**
	 * Clears all stored connection option values.
	 */
	public function clear_stored_options() {
		delete_option( self::STORED_OPTIONS_KEY );
	}

	/**
	 * Just redirects back to the referrer. Keeping it DRY.
	 */
	public function admin_post_redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect(
				add_query_arg(
					array(
						'notice' => $this->notice_type,
						'nonce'  => wp_create_nonce( 'jetpack_debug_broken_token_admin_notice' ),
					),
					wp_get_referer()
				)
			);
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

	/**
	 * Displays an admin notice...
	 */
	public function render_admin_notice() {
		switch ( $this->notice_type ) {
			case 'jetpack-broken':
				$message = 'Nice! You broke Jetpack!';
				break;
			case 'store-options':
				$message = 'Success! Backup of the connection options stored safely.';
				break;
			case 'restore-options':
				$message = 'Success! You\'ve restored the connection options. I hope things are working well now.';
				break;
			case 'clear-tos':
				$message = 'You cleared the TOS option! Nicely done!';
				break;
			default:
				$message = 'Setting saved!';
				break;
		}

		printf( '<div class="notice notice-success"><p>%s</p></div>', esc_html( $message ) );
	}

	/**
	 * Clear TOS action.
	 */
	public function admin_post_clear_tos() {
		check_admin_referer( 'clear-tos' );
		$this->notice_type = 'clear-tos';
		$this->clear_tos();

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Clear the TOS option.
	 */
	public function clear_tos() {
		Jetpack_Options::delete_option( 'tos_agreed' );
	}
}

add_action( 'plugins_loaded', 'register_broken_token', 1000 );

/**
 * Load the brokenness.
 */
function register_broken_token() {
	if ( class_exists( 'Jetpack_Options' ) ) {
		new Broken_Token();
		if ( class_exists( 'Automattic\Jetpack\Connection\Error_Handler' ) ) {
			new Broken_Token_Connection_Errors();
		}
	} else {
		add_action( 'admin_notices', 'broken_token_jetpack_not_active' );
	}
}

/**
 * Notice for if Jetpack is not active.
 */
function broken_token_jetpack_not_active() {
	echo '<div class="notice info"><p>Jetpack Debug tools: Jetpack_Options package must be present for the Broken Token to work.</p></div>';
}

// phpcs:enable
