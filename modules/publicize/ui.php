<?php

/**
* Only user facing pieces of Publicize are found here.
*/
class Publicize_UI {

	/**
	* Contains an instance of class 'publicize' which loads Keyring, sets up services, etc.
	*/
	public $publicize;

	protected $publicize_settings_url = '';

	/**
	* Hooks into WordPress to display the various pieces of UI and load our assets
	*/
	function __construct() {
		global $publicize;

		$this->publicize = $publicize = new Publicize;

		add_action( 'init', array( $this, 'init' ) );
	}

	function init() {
		$this->publicize_settings_url = apply_filters_deprecated(
			'jetpack_override_publicize_settings_url',
			array( admin_url( 'options-general.php?page=sharing' ) ),
			'6.7',
			false,
			__( 'This filter will be removed in a future version of Jetpack', 'jetpack' )
		);

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
		if ( $this->in_jetpack ) {
			add_action( 'load-settings_page_sharing', array( $this, 'load_assets' ) );
		}
		add_action( 'admin_head-post.php', array( $this, 'post_page_metabox_assets' ) );
		add_action( 'admin_head-post-new.php', array( $this, 'post_page_metabox_assets' ) );

		// management of publicize (sharing screen, ajax/lightbox popup, and metabox on post screen)
		add_action( 'pre_admin_screen_sharing', array( $this, 'admin_page' ) );
		add_action( 'post_submitbox_misc_actions', array( $this, 'post_page_metabox' ) );
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
			array( $this, 'wrapper_admin_page' )
		);
	}

	function wrapper_admin_page() {
		Jetpack_Admin_Page::wrap_ui( array( $this, 'management_page' ), array( 'is-wide' => true ) );
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
				/* translators: %1$s: Service Name (Facebook, Twitter, ...), %2$s: Site type (WordPress.com or Jetpack) */
				__( 'You have successfully connected your %1$s account with %2$s.', 'jetpack' ),
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
		$override_publicize_settings_page = apply_filters_deprecated(
			'jetpack_override_publicize_settings_page',
			array( false ),
			'6.7',
			false,
			__( 'This filter will be removed in a future version of Jetpack', 'jetpack' )
		);

		if ( $override_publicize_settings_page ) {
			echo $override_publicize_settings_page;
			return;
		}

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

			<div id="publicize-services-block">
				<?php
				$services = $this->publicize->get_services( 'all' );
				$total_num_of_services = count ( $services );
				$service_num = 0;?>

				<div class='left'>

				<?php
				foreach ( $services as $service_name => $service ) :
					$connect_url = $this->publicize->connect_url( $service_name );
					if ( $service_num == ( round ( ( $total_num_of_services / 2 ), 0 ) ) )
						echo "</div><div class='right'>";
					$service_num++;
					?>
					<div class="publicize-service-entry" <?php if ( $service_num > 0 ): ?>class="connected"<?php endif; ?> >
						<div id="<?php echo esc_attr( $service_name ); ?>" class="publicize-service-left">
							<a href="<?php echo esc_url( $connect_url ); ?>" id="service-link-<?php echo esc_attr( $service_name ); ?>" target="_top"><?php echo $this->publicize->get_service_label( $service_name ); ?></a>
						</div>


						<div class="publicize-service-right">
							<?php if ( $this->publicize->is_enabled( $service_name ) && $connections = $this->publicize->get_connections( $service_name ) ) : ?>
								<ul>
									<?php
									foreach( $connections as $c ) :
										$id = $this->publicize->get_connection_id( $c );
										$disconnect_url = $this->publicize->disconnect_url( $service_name, $id );

										$cmeta = $this->publicize->get_connection_meta( $c );
										$profile_link = $this->publicize->get_profile_link( $service_name, $c );
										$connection_display = $this->publicize->get_display_name( $service_name, $c );

										$options_nonce = wp_create_nonce( 'options_page_' . $service_name . '_' . $id ); ?>

										<?php if ( $this->publicize->show_options_popup( $service_name, $c ) ): ?>
										<script type="text/javascript">
										jQuery(document).ready( function($) {
											showOptionsPage.call(
											this,
											'<?php echo esc_js( $service_name ); ?>',
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
								$connections = $this->publicize->get_connections( $service_name );
								if ( empty ( $connections ) ) { ?>
									<a id="<?php echo esc_attr( $service_name ); ?>" class="publicize-add-connection button" href="<?php echo esc_url( $connect_url ); ?>" target="_top"><?php echo esc_html( __( 'Connect', 'jetpack' ) ); ?></a>
								<?php } else { ?>
									<a id="<?php echo esc_attr( $service_name ); ?>" class="publicize-add-connection button add-new" href="<?php echo esc_url( $connect_url ); ?>" target="_top"><?php echo esc_html( __( 'Add New', 'jetpack' ) ); ?></a>
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
				<p><?php printf(
					/* translators: %s: Service Name (Facebook, Twitter, ...) */
					__( 'There was a problem connecting to %s. Please disconnect and try again.', 'jetpack' ),
					Publicize::get_service_label( $service_name )
				); ?></p>
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
		$default_suffix = preg_replace( '/%([0-9])\$s/', "' + %\\1\$s + '", esc_js( $default_suffix ) );

		$max_length = defined( 'JETPACK_PUBLICIZE_TWITTER_LENGTH' ) ? JETPACK_PUBLICIZE_TWITTER_LENGTH : 280;
		$max_length = $max_length - 24; // t.co link, space

		?>

<script type="text/javascript">
jQuery( function($) {
	var wpasTitleCounter    = $( '#wpas-title-counter' ),
		wpasTwitterCheckbox = $( '.wpas-submit-twitter' ).length,
		postTitle = $( '#title' ),
		wpasTitle = $( '#wpas-title' ).keyup( function() {
			var postTitleVal,
				length = wpasTitle.val().length;

			if ( ! length ) {
				length = wpasTitle.attr( 'placeholder' ).length;
			}

			wpasTitleCounter.text( length ).trigger( 'change' );
		} ),
		authClick = false;

	wpasTitleCounter.on( 'change', function( e ) {
		if ( wpasTwitterCheckbox && parseInt( $( e.currentTarget ).text(), 10 ) > <?php echo (int) $max_length; ?> ) {
			wpasTitleCounter.addClass( 'wpas-twitter-length-limit' );
		} else {
			wpasTitleCounter.removeClass( 'wpas-twitter-length-limit' );
		}
	} );

	// Keep the postTitle and the placeholder in sync
	postTitle.on( 'keyup', function( e ) {
		var url = $( '#sample-permalink' ).text();
		var defaultMessage = $.trim( '<?php printf( $default_prefix, 'url' ); printf( $default_message, 'e.currentTarget.value', 'url' ); printf( $default_suffix, 'url' ); ?>' )
			.replace( /<[^>]+>/g,'');

		wpasTitle.attr( 'placeholder', defaultMessage );
		wpasTitle.trigger( 'keyup' );
	} );

	// set the initial placeholder
	postTitle.trigger( 'keyup' );

	// If a custom message has been provided, open the UI so the author remembers
	if ( wpasTitle.val() && ! wpasTitle.prop( 'disabled' ) && wpasTitle.attr( 'placeholder' ) !== wpasTitle.val() ) {
		$( '#publicize-form' ).show();
		$( '#publicize-defaults' ).hide();
		$( '#publicize-form-edit' ).hide();
	}

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
			var selBeg = 0, selEnd = 0;
			wpasTitle.focus();

			if ( ! wpasTitle.text() ) {
				wpasTitle.text( wpasTitle.attr( 'placeholder' ) );

				selBeg = wpasTitle.text().indexOf( postTitle.val() );
				if ( selBeg < 0 ) {
					selBeg = 0;
				} else {
					selEnd = selBeg + postTitle.val().length;
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
						+ ' <a class="button" href="<?php echo esc_url( $this->publicize_settings_url ); ?>" rel="noopener noreferrer" target="_blank">'
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
	 * @param string $service_label Service's human-readable Label ("Facebook", "Twitter", ...)
	 * @param string $display_name Connection's human-readable Username ("@jetpack", ...)
	 * @return string
	 */
	private function connection_label( $service_label, $display_name ) {
		return sprintf(
			/* translators: %1$s: Service Name (Facebook, Twitter, ...), %2$s: Username on Service (@jetpack, ...) */
			__( '%1$s: %2$s', 'jetpack' ),
			$service_label,
			$display_name
		);
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
		$connections_data = $this->publicize->get_filtered_connection_data();

		$available_services = $this->publicize->get_services( 'all' );

		if ( ! is_array( $available_services ) )
			$available_services = array();

		if ( ! is_array( $connections_data ) )
			$connections_data = array();
		?>
		<div id="publicize" class="misc-pub-section misc-pub-section-last">
			<span id="publicize-title">
			<?php
				esc_html_e( 'Publicize:', 'jetpack' );

				if ( 0 < count( $connections_data ) ) :
					$publicize_form = $this->get_metabox_form_connected( $connections_data );

					$labels = array();
					foreach ( $connections_data as $connection_data ) {
						if ( ! $connection_data['enabled'] ) {
							continue;
						}

						$labels[] = sprintf(
							'<strong>%s</strong>',
							esc_html( $this->connection_label( $connection_data['service_label'], $connection_data['display_name'] ) )
						);
					}

				?>
					<span id="publicize-defaults"><?php echo join( ', ', $labels ); ?></span>
					<a href="#" id="publicize-form-edit"><?php esc_html_e( 'Edit', 'jetpack' ); ?></a>&nbsp;<a href="<?php echo esc_url( $this->publicize_settings_url ); ?>" rel="noopener noreferrer" target="_blank"><?php _e( 'Settings', 'jetpack' ); ?></a><br />
				<?php

				else :
					$publicize_form = $this->get_metabox_form_disconnected( $available_services );

				?>
					<strong><?php echo __( 'Not Connected', 'jetpack' ); ?></strong>
					<a href="#" id="publicize-disconnected-form-show"><?php esc_html_e( 'Edit', 'jetpack' ); ?></a><br />
				<?php

				endif;
			?>
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
	 * @since 6.7
	 *
	 * @global WP_Post $post The current post instance being published.
	 *
	 * @param array $connections_data
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
	private function get_metabox_form_connected( $connections_data ) {
		global $post;

		$all_done = $this->publicize->post_is_done_sharing();
		$all_connections_done = true;

		ob_start();

		?>
		<div id="publicize-form" class="hide-if-js">
			<ul>
		<?php

		foreach ( $connections_data as $connection_data ) {
			$all_connections_done = $all_connections_done && $connection_data['done'];
		?>

				<li>
					<label for="wpas-submit-<?php echo esc_attr( $connection_data['unique_id'] ); ?>">
						<input
							type="checkbox"
							name="wpas[submit][<?php echo esc_attr( $connection_data['unique_id'] ); ?>]"
							id="wpas-submit-<?php echo esc_attr( $connection_data['unique_id'] ); ?>"
							class="wpas-submit-<?php echo esc_attr( $connection_data['service_name'] ); ?>"
							value="1"
						<?php
							checked( true, $connection_data['enabled'] );
							disabled( false, $connection_data['toggleable'] );
						?>
						/>
					<?php if ( $connection_data['enabled'] && ! $connection_data['toggleable'] ) : // Need to submit a value to force a global connection to POST ?>
						<input
							type="hidden"
							name="wpas[submit][<?php echo esc_attr( $connection_data['unique_id'] ); ?>]"
							value="1"
						/>
					<?php endif; ?>

						<?php echo esc_html( $this->connection_label( $connection_data['service_label'], $connection_data['display_name'] ) ); ?>

					</label>
				</li>
		<?php
		}

		$title = get_post_meta( $post->ID, $this->publicize->POST_MESS, true );
		if ( ! $title ) {
			$title = '';
		}

		$all_done = $all_done || $all_connections_done;

		?>

			</ul>

			<label for="wpas-title"><?php _e( 'Custom Message:', 'jetpack' ); ?></label>
			<span id="wpas-title-counter" class="alignright hide-if-no-js">0</span>
			<textarea name="wpas_title" id="wpas-title"<?php disabled( $all_done ); ?>><?php echo esc_textarea( $title ); ?></textarea>
			<a href="#" class="hide-if-no-js button" id="publicize-form-hide"><?php esc_html_e( 'OK', 'jetpack' ); ?></a>
			<input type="hidden" name="wpas[0]" value="1" />
		</div>

		<?php if ( ! $all_done ) : ?>
			<div id="pub-connection-tests"></div>
		<?php endif; ?>
		<?php // #publicize-form

		return ob_get_clean();
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
