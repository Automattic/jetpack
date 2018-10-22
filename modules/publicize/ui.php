<?php

/**
* Only user facing pieces of Publicize are found here.
*/
class Publicize_UI {

	/**
	* Contains an instance of class 'publicize' which loads Keyring, sets up services, etc.
	*/
	public $publicize;

	/**
	* Hooks into WordPress to display the various pieces of UI and load our assets
	*/
	function __construct() {
		global $publicize;

		$this->publicize = $publicize = new Publicize;

		add_action( 'init', array( $this, 'init' ) );
	}

	function init() {
		// Show only to users with the capability required to manage their Publicize connections.
		/**
		 * Filter what user capability is required to use the publicize form on the edit post page. Useful if publish post capability has been removed from role.
		 *
		 * @module publicize
		 *
		 * @since 4.1.0
		 *
		 * @param string $capability User capability needed to use publicize
		 */
		$capability = apply_filters( 'jetpack_publicize_capability', 'publish_posts' );
		if ( ! current_user_can( $capability ) ) {
			return;
		}

		// assets (css, js)
		add_action( 'load-settings_page_sharing', array( &$this, 'load_assets' ) );
		add_action( 'admin_head-post.php', array( &$this, 'post_page_metabox_assets' ) );
		add_action( 'admin_head-post-new.php', array( &$this, 'post_page_metabox_assets' ) );

		// management of publicize (sharing screen, ajax/lightbox popup, and metabox on post screen)
		add_action( 'pre_admin_screen_sharing', array( &$this, 'admin_page' ) );
		add_action( 'post_submitbox_misc_actions', array( &$this, 'post_page_metabox' ) );
	}

	/**
	* If the ShareDaddy plugin is not active we need to add the sharing settings page to the menu still
	*/
	function sharing_menu() {
		add_submenu_page(
			'options-general.php',
			__( 'Sharing Settings', 'jetpack' ),
			__( 'Sharing', 'jetpack' ),
			'publish_posts',
			'sharing',
			array( &$this, 'wrapper_admin_page' )
		);
	}

	function wrapper_admin_page() {
		Jetpack_Admin_Page::wrap_ui( array( &$this, 'management_page' ), array( 'is-wide' => true ) );
	}
	/**
	* Management page to load if Sharedaddy is not active so the 'pre_admin_screen_sharing' action exists.
	*/
	function management_page() { ?>
		<div class="wrap">
			<div class="icon32" id="icon-options-general"><br /></div>
			<h1><?php _e( 'Sharing Settings', 'jetpack' ); ?></h1>

				<?php
				/** This action is documented in modules/sharedaddy/sharing.php */
				do_action( 'pre_admin_screen_sharing' );
				?>

		</div> <?php
	}

	/**
	* styling for the sharing screen and popups
	* JS for the options and switching
	*/
	function load_assets() {
		wp_enqueue_script(
			'publicize',
			Jetpack::get_file_url_for_environment(
				'_inc/build/publicize/assets/publicize.min.js',
				'modules/publicize/assets/publicize.js'
			),
			array( 'jquery', 'thickbox' ),
			'20121019'
		);
		if ( is_rtl() ) {
			wp_enqueue_style( 'publicize', plugins_url( 'assets/rtl/publicize-rtl.css', __FILE__ ), array(), '20180301' );
		} else {
			wp_enqueue_style( 'publicize', plugins_url( 'assets/publicize.css', __FILE__ ), array(), '20180301' );
		}

		Jetpack_Admin_Page::load_wrapper_styles();
		wp_enqueue_style( 'social-logos' );

		add_thickbox();
	}

	public static function connected_notice( $service_name ) { ?>
		<div class='updated'>
			<p><?php

			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$platform =  'WordPress.com';
			} else {
				$platform = 'Jetpack';
			}

			printf(
				__( 'You have successfully connected your %1$s account with %2$s.', '1: Service Name (Facebook, Twitter, ...), 2. WordPress.com or Jetpack', 'jetpack' ),
				Publicize::get_service_label( $service_name ),
				$platform
			); ?></p>
		</div><?php
	}

	public static function denied_notice() { ?>
		<div class='updated'>
			<p><?php _e ( "You have chosen not to connect your blog. Please click 'accept' when prompted if you wish to connect your accounts.", 'jetpack' ); ?></p>
		</div><?php
	}

	/**
	* Lists the current user's publicized accounts for the blog
	* looks exactly like Publicize v1 for now, UI and functionality updates will come after the move to keyring
	*/
	function admin_page() {
		$_blog_id = get_current_blog_id();
		?>

		<form action="" id="publicize-form">
			<h2 id="publicize"><?php _e( 'Publicize', 'jetpack' ) ?></h2>

			<?php
				if ( ! empty( $_GET['action'] ) && 'deny' == $_GET['action'] ) {
					$this->denied_notice();
				}
			?>

			<p>
				<?php esc_html_e( 'Connect your blog to popular social networking sites and automatically share new posts with your friends.', 'jetpack' ) ?>
				<?php esc_html_e( 'You can make a connection for just yourself or for all users on your blog. Shared connections are marked with the (Shared) text.', 'jetpack' ); ?>
			</p>

			<?php
			if ( $this->in_jetpack ) {
				$doc_link = "http://jetpack.com/support/publicize/";
			} else {
				$doc_link = "http://en.support.wordpress.com/publicize/";
			}
			?>

			<p>&rarr; <a href="<?php echo esc_url( $doc_link ); ?>" rel="noopener noreferrer" target="_blank"><?php esc_html_e( 'More information on using Publicize.', 'jetpack' ); ?></a></p>

			<?php if ( isset( $_GET['publicize_popup'] ) ): ?>
				<div id="publicize-popup-notify">
					<a href="javascript:close();">
						<?php esc_html_e( 'Click here to close window and go back to editor.', 'jetpack' )?>
					</a>
				</div>
			<?php endif; ?>

			<div id="publicize-services-block">
				<?php
				$services = $this->publicize->get_services( 'all' );
				$total_num_of_services = count ( $services );
				$service_num = 0;?>

				<div class='left'>

				<?php
				foreach ( $services as $name => $service ) :
					$connect_url = $this->publicize->connect_url( $name );
					if ( $service_num == ( round ( ( $total_num_of_services / 2 ), 0 ) ) )
						echo "</div><div class='right'>";
					$service_num++;
					?>
					<div class="publicize-service-entry" <?php if ( $service_num > 0 ): ?>class="connected"<?php endif; ?> >
						<div id="<?php echo esc_attr( $name ); ?>" class="publicize-service-left">
							<a href="<?php echo esc_url( $connect_url ); ?>" id="service-link-<?php echo esc_attr( $name ); ?>" target="_top"><?php echo $this->publicize->get_service_label( $name ); ?></a>
						</div>


						<div class="publicize-service-right">
							<?php if ( $this->publicize->is_enabled( $name ) && $connections = $this->publicize->get_connections( $name ) ) : ?>
								<ul>
									<?php
									foreach( $connections as $c ) :
										$id = $this->publicize->get_connection_id( $c );
										$disconnect_url = $this->publicize->disconnect_url( $name, $id );

										$cmeta = $this->publicize->get_connection_meta( $c );
										$profile_link = $this->publicize->get_profile_link( $name, $c );
										$connection_display = $this->publicize->get_display_name( $name, $c );

										$options_nonce = wp_create_nonce( 'options_page_' . $name . '_' . $id ); ?>

										<?php if ( $this->publicize->show_options_popup( $name, $c ) ): ?>
										<script type="text/javascript">
										jQuery(document).ready( function($) {
											showOptionsPage.call(
											this,
											'<?php echo esc_js( $name ); ?>',
											'<?php echo esc_js( $options_nonce ); ?>',
											'<?php echo esc_js( $id ); ?>'
											);
										} );
										</script>
										<?php endif; ?>

										<li class="publicize-connection" data-connection-id="<?php echo esc_attr( $id ); ?>">
											<?php esc_html_e( 'Connected as:', 'jetpack' ); ?>
											<?php
											if ( !empty( $profile_link ) ) : ?>
												<a class="publicize-profile-link" href="<?php echo esc_url( $profile_link ); ?>" target="_top">
													<?php echo esc_html( $connection_display ); ?>
												</a><?php
											else :
												echo esc_html( $connection_display );
											endif;
											?>

											<?php if ( 0 == $cmeta['connection_data']['user_id'] ) : ?>
												<small>(<?php esc_html_e( 'Shared', 'jetpack' ); ?>)</small>

												<?php if ( current_user_can( $this->publicize->GLOBAL_CAP ) ) : ?>
													<a class="pub-disconnect-button" title="<?php esc_html_e( 'Disconnect', 'jetpack' ); ?>" href="<?php echo esc_url( $disconnect_url ); ?>" target="_top">×</a>
												<?php endif; ?>

											<?php else : ?>
												<a class="pub-disconnect-button" title="<?php esc_html_e( 'Disconnect', 'jetpack' ); ?>" href="<?php echo esc_url( $disconnect_url ); ?>" target="_top">×</a>
											<?php endif; ?>

											<br/>
											<div class="pub-connection-test test-in-progress" id="pub-connection-test-<?php echo esc_attr( $id ); ?>" >
											</div>
										</li>

										<?php
									endforeach;
									?>
								</ul>
							<?php endif; ?>



							<?php
								$connections = $this->publicize->get_connections( $name );
								if ( empty ( $connections ) ) { ?>
									<a id="<?php echo esc_attr( $name ); ?>" class="publicize-add-connection button" href="<?php echo esc_url( $connect_url ); ?>" target="_top"><?php echo esc_html( __( 'Connect', 'jetpack' ) ); ?></a>
								<?php } else { ?>
									<a id="<?php echo esc_attr( $name ); ?>" class="publicize-add-connection button add-new" href="<?php echo esc_url( $connect_url ); ?>" target="_top"><?php echo esc_html( __( 'Add New', 'jetpack' ) ); ?></a>
			  					<?php } ?>
			  			</div>
			  		</div>
				<?php endforeach; ?>
				</div>
				<script>
				(function($){
					$('.pub-disconnect-button').on('click', function(e){ if ( confirm( '<?php echo esc_js( __( 'Are you sure you want to stop Publicizing posts to this connection?', 'jetpack' ) ); ?>' ) ) {
								return true;
							} else {
							e.preventDefault();
							return false;
						}
					})
				})(jQuery);
				</script>
			</div>

			<?php wp_nonce_field( "wpas_posts_{$_blog_id}", "_wpas_posts_{$_blog_id}_nonce" ); ?>
			<input type="hidden" id="wpas_ajax_blog_id" name="wpas_ajax_blog_id" value="<?php echo $_blog_id; ?>" />
		</form><?php

	}

	public static function global_checkbox( $service_name, $id ) {
		global $publicize;
		if ( current_user_can( $publicize->GLOBAL_CAP ) ) : ?>
			<p>
				<input id="globalize_<?php echo $service_name; ?>" type="checkbox" name="global" value="<?php echo wp_create_nonce( 'publicize-globalize-' . $id ) ?>" />
				<label for="globalize_<?php echo $service_name; ?>"><?php _e( 'Make this connection available to all users of this blog?', 'jetpack' ); ?></label>
			</p>
		<?php endif;
	}

	function broken_connection( $service_name, $id ) { ?>
		<div id="thickbox-content">
			<div class='error'>
				<p><?php printf( __( 'There was a problem connecting to %s. Please disconnect and try again.', 'jetpack' ), Publicize::get_service_label( $service_name ) ); ?></p>
			</div>
		</div><?php
	}

	public static function options_page_other( $service_name ) {
		// Nonce check
		check_admin_referer( "options_page_{$service_name}_" . $_REQUEST['connection'] );
		?>
		<div id="thickbox-content">
			<?php
			ob_start();
			Publicize_UI::connected_notice( $service_name );
			$update_notice = ob_get_clean();
			if ( ! empty( $update_notice ) )
				echo $update_notice;
			?>

			<?php Publicize_UI::global_checkbox( $service_name, $_REQUEST['connection'] ); ?>

			<p style="text-align: center;">
				<input type="submit" value="<?php esc_attr_e( 'OK', 'jetpack' ) ?>" class="button <?php echo $service_name; ?>-options save-options" name="save" data-connection="<?php echo esc_attr( $_REQUEST['connection'] ); ?>" rel="<?php echo wp_create_nonce( 'save_'.$service_name.'_token_' . $_REQUEST['connection'] ) ?>" />
			</p> <br />
		</div>
		<?php
	}

	/**
	* CSS for styling the publicize message box and counter that displays on the post page.
	* There is also some JavaScript for length counting and some basic display effects.
	*/
	function post_page_metabox_assets() {
		global $post;
		$user_id = empty( $post->post_author ) ? $GLOBALS['user_ID'] : $post->post_author;

		$default_prefix = $this->publicize->default_prefix;
		$default_prefix = preg_replace( '/%([0-9])\$s/', "' + %\\1\$s + '", esc_js( $default_prefix ) );

		$default_message = $this->publicize->default_message;
		$default_message = preg_replace( '/%([0-9])\$s/', "' + %\\1\$s + '", esc_js( $default_message ) );

		$default_suffix = $this->publicize->default_suffix;
		$default_suffix = preg_replace( '/%([0-9])\$s/', "' + %\\1\$s + '", esc_js( $default_suffix ) ); ?>

<script type="text/javascript">
jQuery( function($) {
	var wpasTitleCounter    = $( '#wpas-title-counter' ),
		wpasTwitterCheckbox = $( '.wpas-submit-twitter' ).length,
		wpasTitle = $('#wpas-title').keyup( function() {
		var length = wpasTitle.val().length;
		wpasTitleCounter.text( length );
		if ( wpasTwitterCheckbox && length > 256 ) {
			wpasTitleCounter.addClass( 'wpas-twitter-length-limit' );
		} else {
			wpasTitleCounter.removeClass( 'wpas-twitter-length-limit' );
		}
		} ),
		authClick = false;

	$('#publicize-disconnected-form-show').click( function() {
		$('#publicize-form').slideDown( 'fast' );
		$(this).hide();
	} );

	$('#publicize-disconnected-form-hide').click( function() {
		$('#publicize-form').slideUp( 'fast' );
		$('#publicize-disconnected-form-show').show();
	} );

	$('#publicize-form-edit').click( function() {
		$('#publicize-form').slideDown( 'fast', function() {
			wpasTitle.focus();
			if ( !wpasTitle.text() ) {
				var url = $('#shortlink').length ? $('#shortlink').val() : '';

				var defaultMessage = $.trim( '<?php printf( $default_prefix, 'url' ); printf( $default_message, '$("#title").val()', 'url' ); printf( $default_suffix, 'url' ); ?>' );

				wpasTitle.append( defaultMessage.replace( /<[^>]+>/g,'') );

				var selBeg = defaultMessage.indexOf( $("#title").val() );
				if ( selBeg < 0 ) {
					selBeg = 0;
					selEnd = 0;
				} else {
					selEnd = selBeg + $("#title").val().length;
				}

				var domObj = wpasTitle.get(0);
				if ( domObj.setSelectionRange ) {
					domObj.setSelectionRange( selBeg, selEnd );
				} else if ( domObj.createTextRange ) {
					var r = domObj.createTextRange();
					r.moveStart( 'character', selBeg );
					r.moveEnd( 'character', selEnd );
					r.select();
				}
			}
			wpasTitle.keyup();
		} );
		$('#publicize-defaults').hide();
		$(this).hide();
		return false;
	} );

	$('#publicize-form-hide').click( function() {
		var newList = $.map( $('#publicize-form').slideUp( 'fast' ).find( ':checked' ), function( el ) {
			return $.trim( $(el).parent( 'label' ).text() );
		} );
		$('#publicize-defaults').html( '<strong>' + newList.join( '</strong>, <strong>' ) + '</strong>' ).show();
		$('#publicize-form-edit').show();
		return false;
	} );

	$('.authorize-link').click( function() {
		if ( authClick ) {
			return false;
		}
		authClick = true;
		$(this).after( '<img src="images/loading.gif" class="alignleft" style="margin: 0 .5em" />' );
		$.ajaxSetup( { async: false } );

		if ( window.wp && window.wp.autosave ) {
			window.wp.autosave.server.triggerSave();
		} else {
			autosave();
		}

		return true;
	} );

	$( '.pub-service' ).click( function() {
		var service = $(this).data( 'service' ),
			fakebox = '<input id="wpas-submit-' + service + '" type="hidden" value="1" name="wpas[submit][' + service + ']" />';
		$( '#add-publicize-check' ).append( fakebox );
	} );

	publicizeConnTestStart = function() {
		$( '#pub-connection-tests' )
			.removeClass( 'below-h2' )
			.removeClass( 'error' )
			.removeClass( 'publicize-token-refresh-message' )
			.addClass( 'test-in-progress' )
			.html( '' );
		$.post( ajaxurl, { action: 'test_publicize_conns' }, publicizeConnTestComplete );
	}

	publicizeConnRefreshClick = function( event ) {
		event.preventDefault();
		var popupURL = event.currentTarget.href;
		var popupTitle = event.currentTarget.title;
		// open a popup window
		// when it is closed, kick off the tests again
		var popupWin = window.open( popupURL, popupTitle, '' );
		var popupWinTimer= window.setInterval( function() {
			if ( popupWin.closed !== false ) {
				window.clearInterval( popupWinTimer );
				publicizeConnTestStart();
			}
		}, 500 );
	}

	publicizeConnTestComplete = function( response ) {
		var testsSelector = $( '#pub-connection-tests' );
		testsSelector
			.removeClass( 'test-in-progress' )
			.removeClass( 'below-h2' )
			.removeClass( 'error' )
			.removeClass( 'publicize-token-refresh-message' )
			.html( '' );

		// If any of the tests failed, show some stuff
		var somethingShownAlready = false;
		var facebookNotice = false;
		$.each( response.data, function( index, testResult ) {

			// find the li for this connection
			if ( ! testResult.connectionTestPassed && testResult.userCanRefresh ) {
				if ( ! somethingShownAlready ) {
					testsSelector
						.addClass( 'below-h2' )
						.addClass( 'error' )
						.addClass( 'publicize-token-refresh-message' )
						.append( "<p><?php echo esc_html( __( 'Before you hit Publish, please refresh the following connection(s) to make sure we can Publicize your post:', 'jetpack' ) ); ?></p>" );
					somethingShownAlready = true;
				}

				if ( testResult.userCanRefresh ) {
					testsSelector.append( '<p/>' );
					$( '<a/>', {
						'class'  : 'pub-refresh-button button',
						'title'  : testResult.refreshText,
						'href'   : testResult.refreshURL,
						'text'   : testResult.refreshText,
						'target' : '_refresh_' + testResult.serviceName
					} )
						.appendTo( testsSelector.children().last() )
						.click( publicizeConnRefreshClick );
				}
			}

			if( ! testResult.connectionTestPassed && ! testResult.userCanRefresh ) {

				$( '#wpas-submit-' + testResult.unique_id ).prop( "checked", false ).prop( "disabled", true );
				if ( ! facebookNotice ) {
					var message = '<p>'
						+ testResult.connectionTestMessage
						+ '</p><p>'
						+ ' <a class="button" href="<?php echo esc_url( admin_url( 'options-general.php?page=sharing' ) ); ?>" rel="noopener noreferrer" target="_blank">'
						+ '<?php echo esc_html( __( 'Update Your Sharing Settings' ,'jetpack' ) ); ?>'
						+ '</a>'
						+ '<p>';

					testsSelector
						.addClass( 'below-h2' )
						.addClass( 'error' )
						.addClass( 'publicize-token-refresh-message' )
						.append( message );
					facebookNotice = true;
				}

			}


		} );
	}

	$( document ).ready( function() {
		// If we have the #pub-connection-tests div present, kick off the connection test
		if ( $( '#pub-connection-tests' ).length ) {
			publicizeConnTestStart();
		}
	} );

} );
</script>

<style type="text/css">
#publicize {
	line-height: 1.5;
}
#publicize ul {
	margin: 4px 0 4px 6px;
}
#publicize li {
	margin: 0;
}
#publicize textarea {
	margin: 4px 0 0;
	width: 100%
}
#publicize ul.not-connected {
	list-style: square;
	padding-left: 1em;
}
#publicize-title:before {
	content: "\f237";
	font: normal 20px/1 dashicons;
	speak: none;
	margin-left: -1px;
	padding-right: 3px;
	vertical-align: top;
	-webkit-font-smoothing: antialiased;
	color: #82878c;
}
.post-new-php .authorize-link, .post-php .authorize-link {
	line-height: 1.5em;
}
.post-new-php .authorize-message, .post-php .authorize-message {
	margin-bottom: 0;
}
#poststuff #publicize .updated p {
	margin: .5em 0;
}
.wpas-twitter-length-limit {
	color: red;
}
</style><?php
	}

	/**
	* Controls the metabox that is displayed on the post page
	* Allows the user to customize the message that will be sent out to the social network, as well as pick which
	* networks to publish to. Also displays the character counter and some other information.
	*/
	function post_page_metabox() {
		global $post;

		if ( ! $this->publicize->post_type_is_publicizeable( $post->post_type ) )
			return;

		$user_id = empty( $post->post_author ) ? $GLOBALS['user_ID'] : $post->post_author;
		$services = $this->publicize->get_services( 'connected' );
		$available_services = $this->publicize->get_services( 'all' );

		if ( ! is_array( $available_services ) )
			$available_services = array();

		if ( ! is_array( $services ) )
			$services = array();
		?>
		<div id="publicize" class="misc-pub-section misc-pub-section-last">
			<span id="publicize-title">
				<?php esc_html_e( 'Publicize:', 'jetpack' ); ?>
				<?php if ( 0 < count( $services ) ) : ?>
					<?php list( $publicize_form, $active ) = $this->get_metabox_form_connected(); ?>
					<span id="publicize-defaults">
						<?php foreach ( $active as $item ) : ?>
							<strong><?php echo esc_html( $item ); ?></strong>
						<?php endforeach; ?>
					</span>
					<a href="#" id="publicize-form-edit"><?php esc_html_e( 'Edit', 'jetpack' ); ?></a>&nbsp;<a href="<?php echo esc_url( admin_url( 'options-general.php?page=sharing' ) ); ?>" rel="noopener noreferrer" target="_blank"><?php _e( 'Settings', 'jetpack' ); ?></a><br />
				<?php else : ?>
					<?php $publicize_form = $this->get_metabox_form_disconnected( $available_services ); ?>
					<strong><?php echo __( 'Not Connected', 'jetpack' ); ?></strong>
					<a href="#" id="publicize-disconnected-form-show"><?php esc_html_e( 'Edit', 'jetpack' ); ?></a><br />
				<?php endif; ?>
			</span>
			<?php
			/**
			 * Filter the Publicize details form.
			 *
			 * @module publicize
			 *
			 * @since 2.0.0
			 *
			 * @param string $publicize_form Publicize Details form appearing above Publish button in the editor.
			 */
			echo apply_filters( 'publicize_form', $publicize_form );
			?>
		</div> <?php // #publicize
	}

	/**
	 * Generates HTML content for connections form.
	 *
	 * Retrieves current connection list and generates HTML form.
	 *
	 * @since Unknown
	 *
	 * @global WP_Post $post The current post instance being published.
	 *
	 * @return array {
	 *     Array of content for generating connection form.
	 *
	 *     @type string HTML content of form
	 *     @type array {
	 *     		Array of connection labels for active connections only.
	 *
	 *          @type string Connection label string.
	 *     }
	 * }
	 */
	private function get_metabox_form_connected() {
		global $post;
		$active_list = array();

		$all_done = $this->publicize->done_sharing_post();
		$connection_list = $this->publicize->get_filtered_connection_data();

		ob_start();
		?>
			<div id="publicize-form" class="hide-if-js">
				<ul>
		<?php

		foreach ( $connection_list as $c ) {
			if ( $c['active'] ) {
				$active_list[] = $c['label'];
			}
			?>
				<li>
					<label for="wpas-submit-<?php echo esc_attr( $c['unique_id'] ); ?>">
						<input type="checkbox" name="wpas[submit][<?php echo $c['unique_id']; ?>]" id="wpas-submit-<?php echo $c['unique_id']; ?>" class="wpas-submit-<?php echo $c['name']; ?>" value="1" <?php
						checked( true, $c['checked'] );
						if ( $c['disabled'] ) {
							echo 'disabled="disabled"';
						}
						?> />
						<?php
						if ( $c['hidden_checkbox'] ) {
							// Need to submit a value to force a global connection to post
							echo '<input type="hidden" name="wpas[submit][' . $c['unique_id'] . ']" value="1" />';
						}
						echo esc_html( $c['label'] );
						?>
					</label>
				</li>
			<?php
		}

		if ( $title = get_post_meta( $post->ID, $this->publicize->POST_MESS, true ) ) {
			$title = esc_html( $title );
		} else {
			$title = '';
		}

		?>
				</ul>

				<label for="wpas-title"><?php _e( 'Custom Message:', 'jetpack' ); ?></label>
				<span id="wpas-title-counter" class="alignright hide-if-no-js">0</span>

				<textarea name="wpas_title" id="wpas-title"<?php disabled( $all_done ); ?>><?php echo $title; ?></textarea>

				<a href="#" class="hide-if-no-js button" id="publicize-form-hide"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
				<input type="hidden" name="wpas[0]" value="1" />

			</div>
		<?php if ( ! $all_done ) : ?>
			<div id="pub-connection-tests"></div>
		<?php endif; ?>
		<?php // #publicize-form
		return array( ob_get_clean(), $active_list );
	}


	private function get_metabox_form_disconnected( $available_services ) {
		ob_start();
		?><div id="publicize-form" class="hide-if-js">
			<div id="add-publicize-check" style="display: none;"></div>

			<?php _e( 'Connect to', 'jetpack' ); ?>:

			<ul class="not-connected">
				<?php foreach ( $available_services as $service_name => $service ) : ?>
				<li>
					<a class="pub-service" data-service="<?php echo esc_attr( $service_name ); ?>" title="<?php echo esc_attr( sprintf( __( 'Connect and share your posts on %s', 'jetpack' ), $this->publicize->get_service_label( $service_name ) ) ); ?>" rel="noopener noreferrer" target="_blank" href="<?php echo esc_url( $this->publicize->connect_url( $service_name ) ); ?>">
						<?php echo esc_html( $this->publicize->get_service_label( $service_name ) ); ?>
					</a>
				</li>
				<?php endforeach; ?>
			</ul>
			<a href="#" class="hide-if-no-js button" id="publicize-disconnected-form-hide"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
		</div><?php // #publicize-form
		return ob_get_clean();
	}
}
