<?php
/**
 * Module Name: Gravatar Hovercards
 * Module Description: Enable pop-up business cards over commenters’ Gravatars.
 * Sort Order: 11
 * Recommendation Order: 13
 * First Introduced: 1.1
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social, Appearance
 * Feature: Appearance
 * Additional Search Queries: gravatar, hovercards
 */

define( 'GROFILES__CACHE_BUSTER', gmdate( 'YM' ) . 'aa' ); // Break CDN cache, increment when gravatar.com/js/gprofiles.js changes

function grofiles_hovercards_init() {
	add_filter( 'get_avatar',          'grofiles_get_avatar', 10, 2 );
	add_action( 'wp_enqueue_scripts',  'grofiles_attach_cards' );
	add_action( 'wp_footer',           'grofiles_extra_data' );
	add_action( 'admin_init',          'grofiles_add_settings' );

	add_action( 'load-index.php',              'grofiles_admin_cards' );
	add_action( 'load-users.php',              'grofiles_admin_cards' );
	add_action( 'load-edit-comments.php',      'grofiles_admin_cards' );
	add_action( 'load-options-discussion.php', 'grofiles_admin_cards_forced' );

	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'gravatar_hovercards_configuration_load' );
}

function gravatar_hovercards_configuration_load() {
	wp_safe_redirect( admin_url( 'options-discussion.php#show_avatars' ) );
	exit;
}

add_action( 'jetpack_modules_loaded', 'grofiles_hovercards_init' );

/* Hovercard Settings */

/**
 * Adds Gravatar Hovercard setting
 *
 * @todo - always print HTML, hide via CSS/JS if !show_avatars
 */
function grofiles_add_settings() {
	if ( !get_option( 'show_avatars' ) )
		return;

 	add_settings_field( 'gravatar_disable_hovercards', __( 'Gravatar Hovercards', 'jetpack' ), 'grofiles_setting_callback', 'discussion', 'avatars' );
 	register_setting( 'discussion', 'gravatar_disable_hovercards', 'grofiles_hovercard_option_sanitize' );
}

/**
 * HTML for Gravatar Hovercard setting
 */
function grofiles_setting_callback() {
	global $current_user;

	$checked = 'disabled' == get_option( 'gravatar_disable_hovercards' ) ? '' : 'checked="checked" ';

 	echo "<label id='gravatar-hovercard-options'><input {$checked}name='gravatar_disable_hovercards' id='gravatar_disable_hovercards' type='checkbox' value='enabled' class='code' /> " . __( "View people's profiles when you mouse over their Gravatars", 'jetpack' ) . "</label>";
?>
<style type="text/css">
#grav-profile-example img {
	float: left;
}
#grav-profile-example span {
	padding: 0 1em;
}
</style>
<script type="text/javascript">
// <![CDATA[
jQuery( function($) {
	var tr = $( '#gravatar_disable_hovercards' ).change( function() {
		if ( $( this ).is( ':checked' ) ) {
			$( '#grav-profile-example' ).slideDown( 'fast' );
		} else {
			$( '#grav-profile-example' ).slideUp( 'fast' );
		}
	} ).parents( 'tr' );
	var ftr = tr.parents( 'table' ).find( 'tr:first' );
	if ( ftr.length && !ftr.find( '#gravatar_disable_hovercards' ).length ) {
		ftr.after( tr );
	}
} );
// ]]>
</script>
	<p id="grav-profile-example" class="hide-if-no-js"<?php if ( !$checked ) echo ' style="display:none"'; ?>><?php echo get_avatar( $current_user->ID, 64 ); ?> <span><?php _e( 'Put your mouse over your Gravatar to check out your profile.', 'jetpack' ); ?> <br class="clear" /></span></p>
<?php
}

/**
 * Sanitation filter for Gravatar Hovercard setting
 */
function grofiles_hovercard_option_sanitize( $val ) {
	if ( 'disabled' == $val ) {
		return $val;
	}

	return $val ? 'enabled' : 'disabled';
}


/* Hovercard Display */

/**
 * Stores the gravatars' users that need extra profile data attached.
 *
 * Getter/Setter
 *
 * @param int|string|null $author Setter: User ID or email address.  Getter: null.
 *
 * @return mixed Setter: void.  Getter: array of user IDs and email addresses.
 */
function grofiles_gravatars_to_append( $author = null ) {
	static $authors = array();

	// Get
	if ( is_null( $author ) ) {
		return array_keys( $authors );
	}

	// Set

	if ( is_numeric( $author ) ) {
		$author = (int) $author;
	}

	$authors[$author] = true;
}

/**
 * Stores the user ID or email address for each gravatar generated.
 *
 * Attached to the 'get_avatar' filter.
 *
 * @param string $avatar The <img/> element of the avatar.
 * @param mixed $author User ID, email address, user login, comment object, user object, post object
 *
 * @return The <img/> element of the avatar.
 */
function grofiles_get_avatar( $avatar, $author ) {
	if ( is_numeric( $author ) ) {
		grofiles_gravatars_to_append( $author );
	} else if ( is_string( $author ) ) {
		if ( false !== strpos( $author, '@' ) ) {
			grofiles_gravatars_to_append( $author );
		} else {
			if ( $user = get_user_by( 'slug', $author ) )
				grofiles_gravatars_to_append( $user->ID );
		}
	} else if ( isset( $author->comment_type ) ) {
		if ( '' != $author->comment_type && 'comment' != $author->comment_type )
			return $avatar;
		if ( $author->user_id )
			grofiles_gravatars_to_append( $author->user_id );
		else
			grofiles_gravatars_to_append( $author->comment_author_email );
	} else if ( isset( $author->user_login ) ) {
		grofiles_gravatars_to_append( $author->ID );
	} else if ( isset( $author->post_author ) ) {
		grofiles_gravatars_to_append( $author->post_author );
	}

	return $avatar;
}

/**
 * Loads Gravatar Hovercard script.
 *
 * @todo is_singular() only?
 */
function grofiles_attach_cards() {
	global $blog_id;

	// Is the display of Avatars disabled?
	if ( ! get_option( 'show_avatars' ) ) {
		return;
	}

	// Is the display of Gravatar Hovercards disabled?
	if ( 'disabled' == Jetpack_Options::get_option_and_ensure_autoload( 'gravatar_disable_hovercards', '0' ) ) {
		return;
	}

	wp_enqueue_script( 'grofiles-cards', 'https://secure.gravatar.com/js/gprofiles.js', array( 'jquery' ), GROFILES__CACHE_BUSTER, true );
	wp_enqueue_script( 'wpgroho', plugins_url( 'wpgroho.js', __FILE__ ), array( 'grofiles-cards' ), false, true );
	if ( is_user_logged_in() ) {
		$cu = wp_get_current_user();
		$my_hash = md5( $cu->user_email );
	} else if ( !empty( $_COOKIE['comment_author_email_' . COOKIEHASH] ) ) {
		$my_hash = md5( $_COOKIE['comment_author_email_' . COOKIEHASH] );
	} else {
		$my_hash = '';
	}
	wp_localize_script( 'wpgroho', 'WPGroHo', compact( 'my_hash' ) );
}

function grofiles_attach_cards_forced() {
	add_filter( 'pre_option_gravatar_disable_hovercards', 'grofiles_force_gravatar_enable_hovercards' );
	grofiles_attach_cards();
}

function grofiles_force_gravatar_enable_hovercards() {
	return 'enabled';
}

function grofiles_admin_cards_forced() {
	add_action( 'admin_footer', 'grofiles_attach_cards_forced' );
}

function grofiles_admin_cards() {
	add_action( 'admin_footer', 'grofiles_attach_cards' );
}

function grofiles_extra_data() {
?>
	<div style="display:none">
<?php
	foreach ( grofiles_gravatars_to_append() as $author )
		grofiles_hovercards_data_html( $author );
?>
	</div>
<?php
}

/**
 * Echoes the data from grofiles_hovercards_data() as HTML elements.
 *
 * @since 5.5.0 Add support for a passed WP_User object
 *
 * @param int|string|WP_User $author User ID, email address, or a WP_User object
 */
function grofiles_hovercards_data_html( $author ) {
	$data = grofiles_hovercards_data( $author );
	$hash = '';
	if ( is_numeric( $author ) ) {
		$user = get_userdata( $author );
		if ( $user ) {
			$hash = md5( $user->user_email );
		}
	} elseif ( is_email( $author ) ) {
		$hash = md5( $author );
	} elseif ( is_a( $author, 'WP_User' ) ) {
		$hash = md5( $author->user_email );
	}

	if ( ! $hash ) {
		return;
	}
?>
	<div class="grofile-hash-map-<?php echo $hash; ?>">
<?php	foreach ( $data as $key => $value ) : ?>
		<span class="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $value ); ?></span>
<?php	endforeach; ?>
	</div>
<?php
}


/* API */

/**
 * Returns the PHP callbacks for data sources.
 *
 * 'grofiles_hovercards_data_callbacks' filter
 *
 * @return array( data_key => data_callback, ... )
 */
function grofiles_hovercards_data_callbacks() {
	/**
	 * Filter the Gravatar Hovercard PHP callbacks.
	 *
	 * @module gravatar-hovercards
	 *
	 * @since 1.1.0
	 *
	 * @param array $args Array of data callbacks.
	 */
	return apply_filters( 'grofiles_hovercards_data_callbacks', array() );
}

/**
 * Keyed JSON object containing all profile data provided by registered callbacks
 *
 * @param int|strung $author User ID or email address
 *
 * @return array( data_key => data, ... )
 */
function grofiles_hovercards_data( $author ) {
	$r = array();
	foreach ( grofiles_hovercards_data_callbacks() as $key => $callback ) {
		if ( !is_callable( $callback ) )
			continue;
		$data = call_user_func( $callback, $author, $key );
		if ( !is_null( $data ) )
			$r[$key] = $data;
	}

	return $r;
}
