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

		// assets (css, js)
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
		add_submenu_page( 'options-general.php', __( 'Sharing Settings', 'jetpack' ), __( 'Sharing', 'jetpack' ), 'publish_posts', 'sharing', array( $this, 'management_page' ) );
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

	function admin_page() {
		?>
		<h3 id="publicize"><?php esc_html_e( 'Publicize', 'jetpack' ) ?></h3>
		<p><?php esc_html_e( 'Connect social media services to automatically share new posts.', 'jetpack' ) ?></p>
		<h4><?php
			printf(
				wp_kses(
					__( "We've updated Publicize. Please visit the <a href='%s'>WordPress.com sharing page</a> to manage your publicize connections or use the button below.", 'jetpack' ),
					array( 'a' => array( 'href' => array() ) )
				),
				esc_url( publicize_calypso_url() )
			);
			?>
		</h4>

		<a href="<?php echo esc_url( publicize_calypso_url() ); ?>" class="button button-primary"><?php esc_html_e( 'Publicize Settings', 'jetpack' ); ?></a>

		<?php
	}

	/**
	* CSS for styling the publicize message box and counter that displays on the post page.
	* There is also some Javascript for length counting and some basic display effects.
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
		wpasTwitterCheckbox = $( '.wpas-submit-twitter' ).size(),
		wpasTitle = $('#wpas-title').keyup( function() {
		var length = wpasTitle.val().length;
		wpasTitleCounter.text( length );
		if ( wpasTwitterCheckbox && length > 140 ) {
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
				var url = $('#shortlink').size() ? $('#shortlink').val() : '';

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
		$.each( response.data, function( index, testResult ) {
			// find the li for this connection
			if ( ! testResult.connectionTestPassed ) {
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

		$active = array(); ?>

		<div id="publicize" class="misc-pub-section misc-pub-section-last">
			<?php
			_e( 'Publicize:', 'jetpack' );

			if ( 0 < count( $services ) ) :
					ob_start();
				?>

				<div id="publicize-form" class="hide-if-js">
					<ul>

					<?php
					// We can set an _all flag to indicate that this post is completely done as
					// far as Publicize is concerned. Jetpack uses this approach. All published posts in Jetpack
					// have Publicize disabled.
					$all_done = get_post_meta( $post->ID, $this->publicize->POST_DONE . 'all', true ) || ( $this->in_jetpack && 'publish' == $post->post_status );

					// We don't allow Publicizing to the same external id twice, to prevent spam
					$service_id_done = (array) get_post_meta( $post->ID, $this->publicize->POST_SERVICE_DONE, true );

					foreach ( $services as $name => $connections ) {
						foreach ( $connections as $connection ) {
							$connection_data = '';
							if ( method_exists( $connection, 'get_meta' ) )
								$connection_data = $connection->get_meta( 'connection_data' );
							elseif ( ! empty( $connection['connection_data'] ) )
								$connection_data = $connection['connection_data'];

							/**
							 * Filter whether a post should be publicized to a given service.
							 *
							 * @module publicize
							 *
							 * @since 2.0.0
							 *
							 * @param bool true Should the post be publicized to a given service? Default to true.
							 * @param int $post->ID Post ID.
							 * @param string $name Service name.
							 * @param array $connection_data Array of information about all Publicize details for the site.
							 */
							if ( ! $continue = apply_filters( 'wpas_submit_post?', true, $post->ID, $name, $connection_data ) ) {
								continue;
							}

							if ( ! empty( $connection->unique_id ) ) {
								$unique_id = $connection->unique_id;
							} else if ( ! empty( $connection['connection_data']['token_id'] ) ) {
								$unique_id = $connection['connection_data']['token_id'];
							}

							// Should we be skipping this one?
							$skip = (
								(
									in_array( $post->post_status, array( 'publish', 'draft', 'future' ) )
									&&
									get_post_meta( $post->ID, $this->publicize->POST_SKIP . $unique_id, true )
								)
								||
								(
									is_array( $connection )
									&&
									(
										( isset( $connection['meta']['external_id'] ) && ! empty( $service_id_done[ $name ][ $connection['meta']['external_id'] ] ) )
										||
										// Jetpack's connection data looks a little different.
										( isset( $connection['external_id'] ) && ! empty( $service_id_done[ $name ][ $connection['external_id'] ] ) )
									)
								)
							);

							// Was this connections (OR, old-format service) already Publicized to?
							$done = ( 1 == get_post_meta( $post->ID, $this->publicize->POST_DONE . $unique_id, true ) ||  1 == get_post_meta( $post->ID, $this->publicize->POST_DONE . $name, true ) ); // New and old style flags

							// If this one has already been publicized to, don't let it happen again
							$disabled = '';
							if ( $done )
								$disabled = ' disabled="disabled"';

							// If this is a global connection and this user doesn't have enough permissions to modify
							// those connections, don't let them change it
							$cmeta = $this->publicize->get_connection_meta( $connection );
							$hidden_checkbox = false;
							if ( !$done && ( 0 == $cmeta['connection_data']['user_id'] && !current_user_can( $this->publicize->GLOBAL_CAP ) ) ) {
								$disabled = ' disabled="disabled"';
								/**
								 * Filters the checkboxes for global connections with non-prilvedged users.
								 *
								 * @module publicize
								 *
								 * @since 3.7.0
								 *
								 * @param bool   $checked Indicates if this connection should be enabled. Default true.
								 * @param int    $post->ID ID of the current post
								 * @param string $name Name of the connection (Facebook, Twitter, etc)
								 * @param array  $connection Array of data about the connection.
								 */
								$hidden_checkbox = apply_filters( 'publicize_checkbox_global_default', true, $post->ID, $name, $connection );
							}

							// Determine the state of the checkbox (on/off) and allow filtering
							$checked = $skip != 1 || $done;
							/**
							 * Filter the checkbox state of each Publicize connection appearing in the post editor.
							 *
							 * @module publicize
							 *
							 * @since 2.0.1
							 *
							 * @param bool $checked Should the Publicize checkbox be enabled for a given service.
							 * @param int $post->ID Post ID.
							 * @param string $name Service name.
							 * @param array $connection Array of connection details.
							 */
							$checked = apply_filters( 'publicize_checkbox_default', $checked, $post->ID, $name, $connection );

							// Force the checkbox to be checked if the post was DONE, regardless of what the filter does
							if ( $done ) {
								$checked = true;
							}

							// This post has been handled, so disable everything
							if ( $all_done ) {
								$disabled = ' disabled="disabled"';
							}

							$label = sprintf(
								_x( '%1$s: %2$s', 'Service: Account connected as', 'jetpack' ),
								esc_html( $this->publicize->get_service_label( $name ) ),
								esc_html( $this->publicize->get_display_name( $name, $connection ) )
							);
							if ( !$skip || $done ) {
								$active[] = $label;
							}
							?>
							<li>
								<label for="wpas-submit-<?php echo esc_attr( $unique_id ); ?>">
									<input type="checkbox" name="wpas[submit][<?php echo $unique_id; ?>]" id="wpas-submit-<?php echo $unique_id; ?>" class="wpas-submit-<?php echo $name; ?>" value="1" <?php
										checked( true, $checked );
										echo $disabled;
									?> />
									<?php
									if ( $hidden_checkbox ) {
										// Need to submit a value to force a global connection to post
										echo '<input type="hidden" name="wpas[submit][' . $unique_id . ']" value="1" />';
									}
									echo esc_html( $label );
									?>
								</label>
							</li>
							<?php
						}
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

					<a href="#" class="hide-if-no-js" id="publicize-form-hide"><?php _e( 'Hide', 'jetpack' ); ?></a>
					<input type="hidden" name="wpas[0]" value="1" />

				</div>
				<div id="pub-connection-tests"></div>
				<?php // #publicize-form

				$publicize_form = ob_get_clean();
			else :
				echo "&nbsp;" . __( 'Not Connected', 'jetpack' );
					ob_start();
				?>

				<div id="publicize-form" class="hide-if-js">
					<div id="add-publicize-check" style="display: none;"></div>

					<strong><?php _e( 'Connect to', 'jetpack' ); ?>:</strong>

					<ul class="not-connected">
						<?php foreach ( $available_services as $service_name => $service ) : ?>
						<li>
							<a class="pub-service" data-service="<?php echo esc_attr( $service_name ); ?>" title="<?php echo esc_attr( sprintf( __( 'Connect and share your posts on %s', 'jetpack' ), $this->publicize->get_service_label( $service_name ) ) ); ?>" target="_blank" href="<?php echo $this->publicize->connect_url( $service_name ); ?>">
								<?php echo esc_html( $this->publicize->get_service_label( $service_name ) ); ?>
							</a>
						</li>
						<?php endforeach; ?>
					</ul>

					<?php if ( 0 < count( $services ) ) : ?>
						<a href="#" class="hide-if-no-js" id="publicize-form-hide"><?php _e( 'Hide', 'jetpack' ); ?></a>
					<?php else : ?>
						<a href="#" class="hide-if-no-js" id="publicize-disconnected-form-hide"><?php _e( 'Hide', 'jetpack' ); ?></a>
					<?php endif; ?>
				</div> <?php // #publicize-form

				$publicize_form = ob_get_clean();
			endif;
			?>

			<span id="publicize-defaults"><strong><?php echo join( '</strong>, <strong>', array_map( 'esc_html', $active ) ); ?></strong></span><br />

			<?php if ( 0 < count( $services ) ) : ?>
				<a href="#" id="publicize-form-edit"><?php _e( 'Edit Details', 'jetpack' ); ?></a>&nbsp;<a href="<?php echo admin_url( 'options-general.php?page=sharing' ); ?>" target="_blank"><?php _e( 'Settings', 'jetpack' ); ?></a><br />
			<?php else : ?>
				<a href="#" id="publicize-disconnected-form-show"><?php _e( 'Show', 'jetpack' ); ?></a><br />
			<?php endif; ?>

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

}
