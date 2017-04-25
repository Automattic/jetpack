<?php

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 3.7.0
 */
class Jetpack_JITM {

	/**
	 * @var Jetpack_JITM
	 **/
	private static $instance = null;

	/**
	 * Get user dismissed messages.
	 *
	 * @var array
	 */
	private static $jetpack_hide_jitm = null;

	/**
	 * Whether plugin auto updates are allowed in this WordPress installation or not.
	 *
	 * @var bool
	 */
	private static $auto_updates_allowed = false;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}

		return self::$instance;
	}

	private function __construct() {
		if ( ! Jetpack::is_active() || self::is_jitm_dismissed() ) {
			return;
		}
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
	}

	function get_emblem()
	{
		return '<div class="jp-emblem">' . Jetpack::get_jp_emblem() . '</div>';
	}

	/**
	 * Prepare actions according to screen and post type.
	 *
	 * @since 3.8.2
	 *
	 * @uses Jetpack_Autoupdate::get_possible_failures()
	 *
	 * @param object $screen
	 */
	function prepare_jitms( $screen ) {
		if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
			return;
		}

		if ( 'edit-comments' == $screen->base && ! Jetpack::is_plugin_active( 'akismet/akismet.php' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'admin_notices', array( $this, 'akismet_msg' ) );
		}
		elseif (
			'post' == $screen->base
			&& ( isset( $_GET['message'] ) && 6 == $_GET['message'] )
			&& ! Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' )
		) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'edit_form_top', array( $this, 'backups_after_publish_msg' ) );
		}
		elseif ( 'update-core' == $screen->base && ! Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'admin_notices', array( $this, 'backups_updates_msg' ) );
		}
		elseif ( ! Jetpack::is_plugin_active( 'woocommerce-services/woocommerce-services.php' ) ) {
			 $pages_to_display = array(
				 'woocommerce_page_wc-settings', // WooCommerce > Settings
				 'edit-shop_order', // WooCommerce > Orders
				 'shop_order', // WooCommerce > Edit Order
			 );

			if ( in_array( $screen->id, $pages_to_display ) ) {
				add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
				add_action( 'admin_notices', array( $this, 'woocommerce_services_msg' ) );
			}
		}
	}

	/*
	 * Present Manage just in time activation msg on update-core.php
	 *
	 */
	function manage_msg() {
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		?>
		<div class="jp-jitm">
			<a href="#" data-module="manage" class="dismiss"><span class="genericon genericon-close"></span></a>

			<?php echo self::get_emblem(); ?>

			<p class="msg">
				<?php esc_html_e( 'Reduce security risks with automated plugin updates.', 'jetpack' ); ?>
			</p>

			<p>
				<img class="j-spinner hide" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="<?php echo esc_attr__( 'Loading...', 'jetpack' ); ?>" /><a href="#" data-module="manage" class="activate button <?php if ( Jetpack::is_module_active( 'manage' ) ) {
					echo 'hide';
				} ?>"><?php esc_html_e( 'Activate Now', 'jetpack' ); ?></a><a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url ); ?>" target="_blank" title="<?php esc_attr_e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>" id="jetpack-wordpressdotcom" class="button button-jetpack <?php if ( ! Jetpack::is_module_active( 'manage' ) ) {
					echo 'hide';
				} ?>"><?php esc_html_e( 'Go to WordPress.com', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'manage-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/*
	 * Present Photon just in time activation msg
	 *
	 */
	function photon_msg() {
		?>
		<div class="jp-jitm">
			<a href="#" data-module="photon" class="dismiss"><span class="genericon genericon-close"></span></a>

			<?php echo self::get_emblem(); ?>

			<p class="msg">
				<?php esc_html_e( 'Speed up your photos and save bandwidth costs by using a free content delivery network.', 'jetpack' ); ?>
			</p>

			<p>
				<img class="j-spinner hide" style="margin-top: 13px;" width="17" height="17" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="<?php echo esc_attr__( 'Loading...', 'jetpack' ); ?>" /><a href="#" data-module="photon" class="activate button button-jetpack"><?php esc_html_e( 'Activate Photon', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'photon-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Display Photon JITM template in Media Library after user uploads an image.
	 *
	 * @since 3.9.0
	 */
	function photon_tmpl() {
		?>
		<script id="tmpl-jitm-photon" type="text/html">
			<div class="jp-jitm" data-track="photon-modal">
				<a href="#" data-module="photon" class="dismiss"><span class="genericon genericon-close"></span></a>

				<?php echo self::get_emblem(); ?>

				<p class="msg">
					<?php esc_html_e( 'Let Jetpack deliver your images optimized and faster than ever.', 'jetpack' ); ?>
				</p>

				<p>
					<img class="j-spinner hide" style="margin-top: 13px;" width="17" height="17" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="<?php echo esc_attr__( 'Loading...', 'jetpack' ); ?>" /><a href="#" data-module="photon" class="activate button button-jetpack"><?php esc_html_e( 'Activate Photon', 'jetpack' ); ?></a>
				</p>
			</div>
		</script>
		<?php
	}

	/**
	 * Display message prompting user to enable auto-updates in WordPress.com.
	 *
	 * @since 3.8.2
	 */
	function manage_pi_msg() {
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		$manage_active       = Jetpack::is_module_active( 'manage' );

		// Check if plugin has auto update already enabled in WordPress.com and don't show JITM in such case.
		$active_before = get_option( 'jetpack_temp_active_plugins_before', array() );
		delete_option( 'jetpack_temp_active_plugins_before' );
		$active_now                  = get_option( 'active_plugins', array() );
		$activated                   = array_diff( $active_now, $active_before );
		$auto_update_plugin_list     = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		$plugin_auto_update_disabled = false;
		foreach ( $activated as $plugin ) {
			if ( ! in_array( $plugin, $auto_update_plugin_list ) ) {

				// Plugin doesn't have auto updates enabled in WordPress.com yet.
				$plugin_auto_update_disabled = true;

				// We don't need to continue checking, it's ok to show JITM for this plugin.
				break;
			}
		}

		// Check if the activated plugin is in the WordPress.org repository
		$plugin_can_auto_update = false;
		$plugin_updates 		= get_site_transient( 'update_plugins' );
		if ( false === $plugin_updates ) {

			// If update_plugins doesn't exist, display message anyway
			$plugin_can_auto_update = true;
		} else {
			$plugin_updates = array_merge( $plugin_updates->response, $plugin_updates->no_update );
			foreach ( $activated as $plugin ) {
				if ( isset( $plugin_updates[ $plugin ] ) ) {

					// There's at least one plugin set cleared for auto updates
					$plugin_can_auto_update = true;

					// We don't need to continue checking, it's ok to show JITM for this round.
					break;
				}
			}
		}

		if ( ! $manage_active && $plugin_auto_update_disabled && $plugin_can_auto_update && self::$auto_updates_allowed ) :
			?>
			<div class="jp-jitm">
				<a href="#" data-module="manage-pi" class="dismiss"><span class="genericon genericon-close"></span></a>

			<?php echo self::get_emblem(); ?>

				<?php if ( ! $manage_active ) : ?>
					<p class="msg">
						<?php esc_html_e( 'Save time with automated plugin updates.', 'jetpack' ); ?>
					</p>
					<p>
						<img class="j-spinner hide" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="<?php echo esc_attr__( 'Loading...', 'jetpack' ); ?>" /><a href="#" data-module="manage" data-module-success="<?php esc_attr_e( 'Success!', 'jetpack' ); ?>" class="activate button"><?php esc_html_e( 'Activate remote management', 'jetpack' ); ?></a>
					</p>
				<?php elseif ( $manage_active ) : ?>
					<p>
						<?php esc_html_e( 'Save time with auto updates on WordPress.com', 'jetpack' ); ?>
					</p>
				<?php endif; // manage inactive
				?>
				<p class="show-after-enable <?php echo $manage_active ? '' : 'hide'; ?>">
					<a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url ); ?>" target="_blank" title="<?php esc_attr_e( 'Go to WordPress.com to enable auto-updates for plugins', 'jetpack' ); ?>" data-module="manage-pi" class="button button-jetpack launch show-after-enable"><?php if ( ! $manage_active ) : ?><?php esc_html_e( 'Enable auto-updates on WordPress.com', 'jetpack' ); ?><?php elseif ( $manage_active ) : ?><?php esc_html_e( 'Enable auto-updates', 'jetpack' ); ?><?php endif; // manage inactive ?></a>
				</p>
			</div>
			<?php
			//jitm is being viewed, track it
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'manage-pi-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
		endif; // manage inactive
	}

	/**
	 * Display message in editor prompting user to compose entry in WordPress.com.
	 *
	 * @since 3.8.2
	 */
	function editor_msg() {
		global $typenow;
		if ( current_user_can( 'manage_options' ) ) {
			$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
			$editor_dismissed = isset( self::$jetpack_hide_jitm['editor'] );
			if ( ! $editor_dismissed ) :
			?>
			<div class="jp-jitm">
				<a href="#"  data-module="editor" class="dismiss"><span class="genericon genericon-close"></span></a>
				<?php echo self::get_emblem(); ?>
				<p class="msg">
					<?php esc_html_e( 'Try the brand new editor.', 'jetpack' ); ?>
				</p>
				<p>
					<a href="<?php echo esc_url( 'https://wordpress.com/' . $typenow . '/' . $normalized_site_url ); ?>" target="_blank" title="<?php esc_attr_e( 'Write on WordPress.com', 'jetpack' ); ?>" data-module="editor" class="button button-jetpack launch show-after-enable"><?php esc_html_e( 'Write on WordPress.com', 'jetpack' ); ?></a>
				</p>
			</div>
			<?php
			//jitm is being viewed, track it
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'editor-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
			endif; // manage or editor inactive
		}
	}

	/**
	 * Display message in editor prompting user to enable stats.
	 *
	 * @since 3.9.0
	 */
	function stats_msg() {
		$stats_active        = Jetpack::is_module_active( 'stats' );
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		?>
		<div class="jp-jitm">
			<a href="#" data-module="stats" class="dismiss"><span class="genericon genericon-close"></span></a>
			<?php echo self::get_emblem(); ?>
			<p class="msg">
				<?php esc_html_e( 'Track detailed stats on this post and the rest of your site.', 'jetpack' ); ?>
			</p>
			<?php if ( ! $stats_active ) : ?>
				<p>
					<img class="j-spinner hide" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="<?php echo esc_attr__( 'Loading...', 'jetpack' ); ?>" /><a href="#" data-module="stats" data-module-success="<?php esc_attr_e( 'Success! Jetpack Stats is now activated.', 'jetpack' ); ?>" class="activate button"><?php esc_html_e( 'Enable Jetpack Stats', 'jetpack' ); ?></a>
				</p>
			<?php endif; // stats inactive
			?>
			<p class="show-after-enable <?php echo $stats_active ? '' : 'hide'; ?>">
				<a href="<?php echo esc_url( 'https://wordpress.com/stats/insights/' . $normalized_site_url ); ?>" target="_blank" title="<?php esc_attr_e( 'Go to WordPress.com', 'jetpack' ); ?>" data-module="stats" class="button button-jetpack launch show-after-enable"><?php esc_html_e( 'Go to WordPress.com', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'post-stats-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Display JITM in Updates screen prompting user to enable Backups.
	 *
	 * @since 3.9.5
	 */
	function backups_updates_msg() {
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		$url = 'https://jetpack.com/redirect/?source=jitm-backup-updates&site=' . $normalized_site_url;
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'vaultpress' ) );
		?>
		<div class="jp-jitm" data-track="vaultpress-updates" data-stats_url="<?php echo esc_url( $jitm_stats_url ); ?>">
			<a href="#" data-module="vaultpress" class="dismiss"><span class="genericon genericon-close"></span></a>
			<?php echo self::get_emblem(); ?>
			<p class="msg">
				<?php esc_html_e( 'Backups are recommended to protect your site before you make any changes.', 'jetpack' ); ?>
			</p>
			<p>
				<a href="<?php echo esc_url( $url ); ?>" target="_blank" title="<?php esc_attr_e( 'Enable VaultPress Backups', 'jetpack' ); ?>" data-module="vaultpress" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-vault" class="button button-jetpack launch jptracks"><?php esc_html_e( 'Enable VaultPress Backups', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'vaultpress-updates-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Display JITM in Comments screen prompting user to enable Akismet.
	 *
	 * @since 3.9.5
	 */
	function akismet_msg() {
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		$url = 'https://jetpack.com/redirect/?source=jitm-akismet&site=' . $normalized_site_url;
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'akismet' ) );
		?>
		<div class="jp-jitm" data-stats_url="<?php echo esc_url( $jitm_stats_url ); ?>">
			<a href="#" data-module="akismet" class="dismiss"><span class="genericon genericon-close"></span></a>
			<?php echo self::get_emblem(); ?>
			<p class="msg">
				<?php esc_html_e( "Spam affects your site's legitimacy, protect your site with Akismet.", 'jetpack' ); ?>
			</p>
			<p>
				<a href="<?php echo esc_url( $url ); ?>" target="_blank" title="<?php esc_attr_e( 'Automate Spam Blocking', 'jetpack' ); ?>" data-module="akismet" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-akismet" class="button button-jetpack launch jptracks"><?php esc_html_e( 'Automate Spam Blocking', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'akismet-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Display JITM after a post is published prompting user to enable Backups.
	 *
	 * @since 3.9.5
	 */
	function backups_after_publish_msg() {
		$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
		$url = 'https://jetpack.com/redirect/?source=jitm-backup-publish&site=' . $normalized_site_url;
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'vaultpress' ) );
		?>
		<div class="jp-jitm" data-track="vaultpress-publish" data-stats_url="<?php echo esc_url( $jitm_stats_url ); ?>">
			<a href="#" data-module="vaultpress" class="dismiss"><span class="genericon genericon-close"></span></a>

			<?php echo self::get_emblem(); ?>

			<p class="msg">
				<?php esc_html_e( "Great job! Now let's make sure your hard work is never lost, backup everything with VaultPress.", 'jetpack' ); ?>
			</p>
			<p>
				<a href="<?php echo esc_url( $url ); ?>" target="_blank" title="<?php esc_attr_e( 'Enable Backups', 'jetpack' ); ?>" data-module="vaultpress" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-vault-post" class="button button-jetpack launch jptracks"><?php esc_html_e( 'Enable Backups', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'vaultpress-publish-viewed-' . JETPACK__VERSION );
		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Display a JITM style message for the media-new page.
	 *
	 * @since 4.5
	 */
	function videopress_media_upload_warning_msg() {
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'videopress' ) );

		$upload_url   = add_query_arg( 'mode', 'grid', admin_url( 'upload.php' ) );
		$new_post_url = admin_url( 'post-new.php' );

		$msg = sprintf( __( 'Only videos uploaded from within the <a href="%s">media library</a> or while creating a <a href="%s">new post</a> will be fully hosted by WordPress.com.', 'jetpack' ), esc_url( $upload_url ), esc_url( $new_post_url ) );
		?>
        <div class="jp-jitm" data-track="videopress-upload-warning" data-stats_url="<?php echo esc_url( $jitm_stats_url ); ?>">
            <!-- <a href="#" data-module="videopress" class="dismiss"><span class="genericon genericon-close"></span></a>-->

			<?php echo self::get_emblem(); ?>

            <p class="msg">
				<?php echo $msg; ?>
            </p>
            <p>
                <a href="<?php echo esc_url( $upload_url ); ?>" title="<?php esc_attr_e( 'Upload a Video', 'jetpack' ); ?>" data-module="videopress" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-videopress-upload" class="button button-jetpack launch jptracks"><?php esc_html_e( 'Upload a Video Now', 'jetpack' ); ?></a>
            </p>
        </div>
		<?php
	}

	/**
	 * Display message prompting user to install WooCommerce Services.
	 *
	 * @since 4.6
	 */
	function woocommerce_services_msg() {
		if ( ! current_user_can( 'manage_woocommerce' ) || ! current_user_can( 'install_plugins' ) ) {
			return;
		}

		if ( isset( self::$jetpack_hide_jitm['woocommerce_services'] ) ) {
			return;
		}

		if ( ! function_exists( 'wc_get_base_location' ) ) {
			return;
		}

		$base_location = wc_get_base_location();

		switch ( $base_location['country'] ) {
			case 'US':
				$message = __( 'New free service: Show USPS shipping rates on your store! Added bonus: print shipping labels without leaving WooCommerce.', 'jetpack' );
				break;
			case 'CA':
				$message = __( 'New free service: Show Canada Post shipping rates on your store!', 'jetpack' );
				break;
			default:
				return;
		}

		// If plugin dir exists, means it's installed but not activated
		$already_installed = ( 0 === validate_plugin( 'woocommerce-services/woocommerce-services.php' ) );

		$install_url = wp_nonce_url( add_query_arg( array( 'wc-services-action' => $already_installed ? 'activate' : 'install' ) ), 'wc-services-install' );

		?>
		<div class="jp-jitm woo-jitm">
			<a href="#"  data-module="wooservices" class="dismiss"><span class="genericon genericon-close"></span></a>
			<div class="jp-emblem">
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">
					<path d="M18,8h-2V7c0-1.105-0.895-2-2-2H4C2.895,5,2,5.895,2,7v10h2c0,1.657,1.343,3,3,3s3-1.343,3-3h4c0,1.657,1.343,3,3,3s3-1.343,3-3h2v-5L18,8z M7,18.5c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S7.828,18.5,7,18.5z M4,14V7h10v7H4z M17,18.5c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S17.828,18.5,17,18.5z" />
				</svg>
			</div>
			<p class="msg">
				<?php echo esc_html( $message ); ?>
			</p>
			<p>
				<a href="<?php echo esc_url( $install_url ); ?>" title="<?php $already_installed ? esc_attr_e( 'Activate WooCommerce Services', 'jetpack' ) : esc_attr_e( 'Install WooCommerce Services', 'jetpack' ); ?>" data-module="wooservices" class="button button-jetpack show-after-enable">
					<?php $already_installed ? esc_html_e( 'Activate WooCommerce Services', 'jetpack' ) : esc_html_e( 'Install WooCommerce Services', 'jetpack' ); ?>
				</a>
			</p>
		</div>
		<?php
		//jitm is being viewed, track it
		$jetpack = Jetpack::init();
		$jetpack->stat( 'jitm', 'wooservices-viewed-' . JETPACK__VERSION );
	}

	/*
	* Function to enqueue jitm css and js
	*/
	function jitm_enqueue_files( $hook ) {

		$wp_styles = new WP_Styles();
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-201243242' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );

		//Build stats url for tracking manage button
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'wordpresstools' ) );

		// Enqueue javascript to handle jitm notice events
		wp_enqueue_script( 'jetpack-jitm-js', plugins_url( '_inc/jetpack-jitm.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ), JETPACK__VERSION, true );
		wp_localize_script(
			'jetpack-jitm-js',
			'jitmL10n',
			array(
				'ajaxurl'     => admin_url( 'admin-ajax.php' ),
				'jitm_nonce'  => wp_create_nonce( 'jetpack-jitm-nonce' ),
				'photon_msgs' => array(
					'success' => esc_html__( 'Success! Photon is now actively optimizing and serving your images for free.', 'jetpack' ),
					'fail'    => esc_html__( 'We are sorry but unfortunately Photon did not activate.', 'jetpack' )
				),
				'manage_msgs' => array(
					'success' => esc_html__( 'Success! WordPress.com tools are now active.', 'jetpack' ),
					'fail'    => esc_html__( 'We are sorry but unfortunately Manage did not activate.', 'jetpack' )
				),
				'stats_msgs' => array(
					'success' => esc_html__( 'Success! Stats are now active.', 'jetpack' ),
					'fail'    => esc_html__( 'We are sorry but unfortunately Stats did not activate.', 'jetpack' )
				),
				'jitm_stats_url' => $jitm_stats_url
			)
		);
	}

	/**
	 * Check if a JITM was dismissed or not. Currently, dismissing one JITM will dismiss all of them.
	 *
	 * @since 3.8.2
	 *
	 * @return bool
	 */
	function is_jitm_dismissed() {
		if ( empty( self::$jetpack_hide_jitm ) ) {

			// The option returns false when nothing was dismissed
			self::$jetpack_hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );
		}

		// so if it's not an array, it means no JITM was dismissed
		return is_array( self::$jetpack_hide_jitm );
	}
}
if (
	/**
	 * Filter to turn off all just in time messages
	 *
	 * @since 3.7.0
	 *
	 * @param bool true Whether to show just in time messages.
	 */
	apply_filters( 'jetpack_just_in_time_msgs', false )
) {
	Jetpack_JITM::init();
}
