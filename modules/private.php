<?php
/**
 * Module Name: Private site
 * Module Description: Make your site only visible to you and users you approve.
 * Sort Order: 9
 * First Introduced: ?
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Private
 * Feature: Traffic
 * Additional Search Queries: private, sandbox, unlaunched
 */

class WPCOM_NoReferrer {
	var $hide_url = 'https://href.li/?';
	var $skip_this_blog_links = true;
	var $skip_domains = array(
		'wordpress.com',
		'en.wordpress.com',
		'en.blog.wordpress.com',
		'en.support.wordpress.com',
		'support.wordpress.com',
		'dashboard.wordpress.com',
		'cloudup.com',

	);

	private $last_link_was_privatized = false;
	private $skip_this_blog_domains = array();

	function __construct( $args = null ) {
		$defaults = get_object_vars( $this );
		$args = wp_parse_args( $args, $defaults );
		$args = array_intersect_key( $args, $defaults );

		foreach ( $args as $k => $v ) {
			$this->$k = $v;
		}

		$this->maybe_skip_this_blog();
		$this->last_link_was_privatized = false;
	}

	function is_a8c_to_a8c( $url ) {
		global $blog_id;

		// These are static so that we only preform these operations once per execution
		static $a8c_p2_blog_ids = null;
		static $a8c_p2_blog_domains = null;

		// populate our list of a8c p2 blog_ids
		if ( null === $a8c_p2_blog_ids ) {
			global $automattic_p2s;
			require_once ABSPATH . '/.config/p2-list.php';
			$a8c_p2_blog_ids = array_map( 'absint', array_merge( $automattic_p2s['teams'], $automattic_p2s['projects'] ) );
		}

		// if this isn't an a8c p2 then stop here...
		if ( false === in_array( $blog_id, $a8c_p2_blog_ids ) ) {
			return false;
		}

		// wp.me links give us the blog id encoded into the uri so there's no need
		// to hit the database to find out if this link is to another a8c p2
		if ( preg_match( '@^https?://wp.me/[pam]([^-]+)-[^-]+$@i', $url, $m ) > 0 ) {
			return in_array( sixtwo2dec( $m[1] ), $a8c_p2_blog_ids );
		}

		// get an array containing all the a8c p2 domain names
		if ( null === $a8c_p2_blog_domains ) {
			global $wpdb;
			// "Use placeholders and $wpdb->prepare(); found $a8c_p2_blog_ids" -- Sometimes
			// I feel like automated linting just doesn't "get" me... :)
			$a8c_p2_blog_domains = $wpdb->get_col( sprintf(
				'SELECT `domain` FROM `wp_blogs` WHERE `blog_id` IN(%s) LIMIT %d', implode( ',', $a8c_p2_blog_ids ), count( $a8c_p2_blog_ids )
			) );
		}

		// return true if this link is to a domain in our list...
		return in_array( preg_replace( '/\.files\.wordpress\.com$/i','.wordpress.com', parse_url( $url, PHP_URL_HOST ) ), $a8c_p2_blog_domains );
	}

	function maybe_skip_this_blog() {
		if ( !$this->skip_this_blog_links ) {
			$this->skip_this_blog_domains = array();
		}

		list( $blog_name ) = explode( '.', parse_url( site_url(), PHP_URL_HOST ), 2 );

		$this->skip_this_blog_domains = array(
			"$blog_name.wordpress.com",
			"$blog_name.files.wordpress.com",
			parse_url( home_url(), PHP_URL_HOST ),
		);
	}

	function privatize_url( $url ) {
		$this->last_link_was_privatized = false;
		$host = parse_url( $url, PHP_URL_HOST );
		if ( in_array( $host, $this->skip_domains ) || in_array( $host, $this->skip_this_blog_domains ) ) {
			return $url;
		}

		if ( $this->is_a8c_to_a8c( $url ) ) {
			return $url;
		}

		if ( wp_startswith( $url, '//' ) ) {
			$url = http() . ":$url";
		}

		// Don't double-prefix
		// This is usually a result of people copy/pasting an already privatized link
		if ( $this->hide_url && wp_startswith( $url, $this->hide_url ) ) {
			$url = substr( $url, strlen( $this->hide_url ) );
		}

		$this->last_link_was_privatized = true;
		return $this->hide_url . $url;
	}

	function privatize_link( $link ) {
		if ( is_array( $link ) ) { // preg callback
			$link = $link[0];
		}

		$this->last_link_was_privatized = false;
		$did_rel = false;

		$dom = new DOMDocument;
		$link = mb_convert_encoding( $link, 'HTML-ENTITIES', 'UTF-8' );
		// The @ is not enough to suppress errors when dealing with libxml,
		// we have to tell it directly how we want to handle errors.
		libxml_use_internal_errors( TRUE );
		@$dom->loadHTML( "<html><body>$link</a></body></html>" ); // suppress parser warnings
		libxml_use_internal_errors( FALSE );
		$link_node = false;
		foreach ( $dom->childNodes as $child ) {
			if ( XML_ELEMENT_NODE === $child->nodeType && 'html' === strtolower( $child->tagName ) ) {
				$link_node = $child->firstChild->firstChild;
				break;
			}
		}

		if ( !$link_node ) {
			return $link;
		}

		if ( !$link_node->hasAttribute( 'href' ) ) {
			return $link;
		}

		$href = $link_node->getAttribute( 'href' );

		if ( preg_match( '#^(?:\w+:)?//#', $href ) ) {
			$link_node->setAttribute( 'href', $this->privatize_url( $href ) );
		}

		if ( $this->last_link_was_privatized ) {
			if ( $link_node->hasAttribute( 'rel' ) ) {
				$rels = preg_split( '#\s+#', $link_node->getAttribute( 'rel' ), PREG_SPLIT_NO_EMPTY );
				$rels[] = 'noreferrer';
				$rel = join( ' ', $rels );
			} else {
				$rel = 'noreferrer';
			}
			$link_node->setAttribute( 'rel', $rel );
		}

		$link = $dom->saveXML( $link_node );
		$link = rtrim( $link, '/>' ) . '>';

		return $link;
	}

	function privatize_links( $html ) {
		return preg_replace_callback( '#<a\s+[^>]+>#i', array( $this, 'privatize_link' ), $html );
	}
}

function privatize_blog( $wp ) {
	global $pagenow, $current_user, $wpdb;

	/*if ( '-1' != get_option('blog_public') )
		return;*/

	if ( !get_option('links_public') ) {
		add_filter( 'the_content',  'privatize_links', 121 );
		add_filter( 'comment_text', 'privatize_links', 121 );
		add_filter( 'widget_text', 'privatize_links', 121 );
		add_filter( 'privatize_links', 'privatize_links', 121 );
	}

	if ( 'wp-login.php' == $pagenow )
		return;

	if ( defined( 'WP_CLI' ) && WP_CLI )
		return;

	if ( defined( 'WPCOM_JOBS' ) && WPCOM_JOBS )
		return;

	// Serve robots.txt for private blogs.
	if ( is_object( $wp ) && !empty( $wp->query_vars['robots'] ) )
		return;

	// Go ahead and allow trackbacks.
//	if ( is_object($wp) && !empty($wp->query_vars['tb']) )
//		return;

	if ( $current_user ) {
		if ( is_super_admin() || is_private_blog_user($wpdb->blogid, $current_user) )
			return;
	}

//	if ( !empty($wp->query_vars['feed']) && check_feedauth() )
//		return;

	remove_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );

	if ( file_exists(TEMPLATEPATH . '/private.php' ) )
		include(TEMPLATEPATH . '/private.php' );
	else if ( file_exists(ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php' ) )
		include(ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php' );
	else
		_e( 'This site is private.' );

	exit;
}

/**
 * Does not check whether the blog is private. Accepts blog and user in various types.
 * Returns true for super admins; if you don't want that, use is_really_private_blog_user.
 */
function is_private_blog_user( $blog, $user ) {
	global $wpdb;

	if ( !is_object($user) )
		$user = new WP_User($user);

	if ( !$user->ID )
		return false;

	$user_id = $user->data->ID;

	if ( is_numeric($blog) )
		$blog_id = intval($blog);
	elseif ( is_object($blog) )
		$blog_id = $blog->blog_id;
	elseif ( is_string($blog) )
	{
		$blog = get_blog_info($blog, '/', 1);
		$blog_id = $blog->blog_id;
	}
	else
		$blog_id = $wpdb->blogid;

	if ( is_really_private_blog_user( $blog_id, $user_id ) )
		return true;

	// check if the user has read permissions
	$the_user = wp_clone( $user );
	$the_user->for_blog( $blog_id );
	return $the_user->has_cap( 'read'  );
}

function is_really_private_blog_user( $blog = null, $user = null ) {
	global $wpdb;

	if ( !isset( $blog ) )
		$blog_id = $wpdb->blogid;
	elseif ( is_numeric($blog) )
		$blog_id = intval($blog);
	elseif ( is_object($blog) )
		$blog_id = $blog->blog_id;
	else {
		$blog = get_blog_info($blog, '/', 1);
		$blog_id = $blog->blog_id;
	}

	if ( !$blog_id )
		return false;

	if ( !isset( $user ) )
		$user = wp_get_current_user();

	if ( !is_object($user) )
		$user = new WP_User($user);

	if ( !$user->ID )
		return false;

	$user_id = $user->data->ID;

	$key = "private_blog_user_{$blog_id}_{$user_id}";
	$cache = wp_cache_get( $key, 'users' );
	if ( $cache )
		return $cache === 'y' ? true : false;

	$result = (bool) $wpdb->get_row( $wpdb->prepare(
		"SELECT blog_id FROM drama_blog_access WHERE blog_id = %d AND user_id = %d",
		$blog_id, $user_id ) );

	wp_cache_set( $key, $result ? 'y' : 'n', 'users' );

	return $result;
}

/**
 * Tests whether the current blog is private and not spam/suspended/deleted.
 */
function is_private_blog( $_blog_id = null ) {
	return true;
	global $blog_id;

	if ( empty( $_blog_id ) )
		$_blog_id = $blog_id;

	$blog_details = get_blog_details( $_blog_id );

	return (	( '-1' == $blog_details->public ) &&
				( !isset( $blog_details->deleted )	|| !$blog_details->deleted ) &&
				( !isset( $blog_details->archived )	|| !$blog_details->archived ) &&
				( !isset( $blog_details->spam )		|| !$blog_details->spam )
			);
}

function privatize_links( $content ) { // Only for href links right now, not images or such
	static $hide_referrer = false;
	if ( !$hide_referrer ) {
		$hide_referrer = new WPCOM_NoReferrer();
	}

	$hide_referrer->maybe_skip_this_blog();

	return $hide_referrer->privatize_links( $content );
}

function check_feedauth() {
	global $blog_id;

	if ( isset( $_GET['feedauth'] ) ) {
		$users = get_users_of_blog($blog_id);
		if ( is_array($users) )
			foreach ( $users as $user )
				if ( create_feedauth( $user->user_id ) === $_GET['feedauth'] )
					return true;
		$users = get_private_blog_users($blog_id);
		if ( is_array($users) )
			foreach ( $users as $user_id )
				if ( create_feedauth( $user_id ) === $_GET['feedauth'] )
					return true;
	}

	return false;
}

function create_feedauth( $user_id = null, $blog_id = null ) {
	if ( !isset($user_id) )
		$user_id = $GLOBALS['current_user']->ID;
	if ( !isset($blog_id) )
		$blog_id = $GLOBALS['blog_id'];
	return wp_hash( "feedauth_{$user_id}_{$blog_id}" );
}

function privatize_blog_comments( $comment ) {
	privatize_blog(null);
	return $comment;
}

function private_blog_user_limit() {
	return false;
}

function privatize_blog_priv_selector() {
?>
<br /><input id="blog-private" type="radio" name="blog_public" value="-1" <?php checked('-1', get_option('blog_public')); ?> />
<label for="blog-private"><?php _e('I would like my site to be private, visible only to myself and users I choose') ?></label>

<?php
if ( '-1' == get_option('blog_public') ) {
$user_limit = private_blog_user_limit();
?>

<h3><?php
if ( $user_limit )
	printf( __( 'Up to %d users allowed to access site. <a href="paid-upgrades.php">Want more?</a>' ), $user_limit );
else
	_e( 'Users allowed to access site:' );
?></h3>

<?php
global $wpdb;
$current_users = get_private_blog_users( $wpdb->blogid );

if ( false == $user_limit || ( true == $user_limit && count( $current_users ) < $user_limit ) ) {
	echo '<p><a href="users.php?page=wpcom-invite-users&user-role=follower" class="button">' . __( 'Invite viewers to your blog' ) . '</a></p>';
}

if ( count( $current_users ) > 0 ) {
	echo '<p>' . __( 'Current site members:' ) . '</p>';
	echo "<ol>";
	foreach ( $current_users as $u ) {
		$user = get_userdata( $u );
		echo "<li>$user->user_login";
		echo "&nbsp;&nbsp;&nbsp;<input type='submit' name='remove_private_blog_user[$user->ID]' value='";
		_e( 'Remove User' );
		echo "' class='button-secondary' />";
		wp_nonce_field( 'remove_user_' . $user->ID, '_wpnonce_remove_' . $user->ID ,false, true);
		echo "</li>";
	}
 	echo "</ol>";
} else {
	?>
	<p><?php _e( "If you don't add anyone to your site, only you will have access." ) ?></p>
	<?php
}

do_action( 'privatize_blog_before_link_visibility' );
?>
<tr valign="top">
<th scope="row"><?php _e('Link Visibility') ?> </th>
<td><fieldset><legend class="hidden"><?php _e('Link Visibility') ?> </legend>
<p><input id="links-private" type="checkbox" name="links_public" value="1" <?php checked('1', get_option('links_public')); ?> />
<label for="links-private"><?php _e('I would like my links to be public, without being passed through a referrer hider.') ?></label></p>
</fieldset></td>
</tr>
<?php
}

}

function privatize_blog_option_whitelist( $options_whitelist ) {
	$options_whitelist['reading'][] = 'links_public';
	return $options_whitelist;
}

function privatize_blog_updated_message() {
	global $pagenow;

	if ( $pagenow == 'options-reading.php' && isset( $_GET['updated'] ) ) {
		$messages = array();
		switch ( $_GET['updated'] ) {
			case 'user-not-found':
				$messages[] = __( 'User not found' );
				break;
			case 'ignore-request':
				$messages[] = __( 'Ignored request for access to private site' );
				break;
			case 'user-added':
				$messages[] = __( 'User added to your private site' );
				break;
			case 'user-removed':
				$messages[] = __( 'User removed from your site' );
				break;
			case 'user-not-found':
				$messages[] = __( 'User not found' );
				break;
			case 'too-many-users':
				$user_limit = private_blog_user_limit();
				$messages[] = sprintf( __( 'You can only add %d users to access this site.' ), $user_limit );
				break;
			case 'already-member':
				$messages[] = __( 'User is already a member of your private site' );
				break;
		}

		foreach ( $messages as $message ) {
			echo '<div class="updated"><p><strong>' . $message . '.</strong></p></div>';
		}
	}

}


/**
 * Hides the blog's name on the login form for private blogs.
 */
function privatize_blog_maybe_mask_blog_name() {
	if ( ! is_private_blog() )
		return;

	add_filter( 'bloginfo', 'privatize_blog_mask_blog_name', 3, 2 );
}

/**
 * Replaces the the blog's "name" value with "Protected Blog"
 *
 * @see privatize_blog_maybe_mask_blog_name()
 */
function privatize_blog_mask_blog_name( $value, $what ) {
	if ( in_array( $what, array( 'name', 'title' ) ) ) {
		$value = __( 'Protected Blog' );
	}

	return $value;
}


add_action( 'admin_notices', 'privatize_blog_updated_message' );
add_action( 'parse_request', 'privatize_blog', 100 );
add_action( 'login_init',    'privatize_blog_maybe_mask_blog_name' );
add_filter( 'preprocess_comment', 'privatize_blog_comments' );
add_action( 'blog_privacy_selector', 'privatize_blog_priv_selector' );
add_filter( 'whitelist_options', 'privatize_blog_option_whitelist' );

// So that users can't request access to private Automattic sites.
function private_blog_accepts_invites( $blog_id = 0 ) {
	if ( ! $blog_id ) {
		$blog_id = get_current_blog_id();
	}

	if ( isset( $allow_private_blog_request[$blog_id] ) && $allow_private_blog_request[$blog_id] ) {
		return true;
	}

	/*if ( is_automattic_private( $blog_id ) ) {
		return false;
	}*/

	return true;
}

/**
 * Allow logged-in, non blog users to request access to a blog from
 * blog administrator. Sends notification email.
 */
function handle_private_blog_access_request() {
	global $blog_id, $current_user;

	if ( ! private_blog_accepts_invites() ) {
		return false;
	}

	if ( !is_private_blog() || !is_user_logged_in() || !isset( $_GET['action'] ) || $_GET['action'] != 'request_access' || !isset( $_GET[ 'nonce' ] ) || !wp_verify_nonce( $_GET[ 'nonce' ], "request_access_$blog_id" ) )
		return false;

	// Generate and send the requesting email
	$admin_email = apply_filters( 'wpcom_privacy_access_admin_email', get_bloginfo( 'admin_email' ) );
	$site_name = get_bloginfo( 'name' );
	$home_url = trailingslashit( get_home_url() );
	$subject = sprintf( __( "[%s] WordPress.com user '%s' requested access to your private site" ), $site_name, $current_user->user_login );
	$message = __( "Howdy," );
	$message .= "\n\n";
	// Only use the display name if they have a different one than the username
	if ( $current_user->user_login != $current_user->display_name )
		$name .= "$current_user->display_name (username '$current_user->user_login')";
	else
		$name .= "'$current_user->user_login'";

	$message .= sprintf( __( "The WordPress.com user %s requested access to view your private site at %s" ), $name, $home_url );
	$message .= "\n\n";
	$message .= __( "Want to give them access to view this site? Click on this link: " );
	$message .= add_query_arg( 'user_login', $current_user->user_login, add_query_arg( 'action', 'add_user', get_home_url( $blog_id, 'wp-admin/options-reading.php' ) ) );
	$message .= "\n\n";
	$message .= sprintf( __( "If you don't want this person to be able to view %s, simply ignore this email, and they will not receive access to your private site." ), $home_url );
	$message .= "\n\n";
	$message .= sprintf( __( "To see a list of users who have access to %s, visit %s" ), $home_url, get_home_url( $blog_id, 'wp-admin/options-reading.php' ) );
	$message .= "\n\n";
	$message .= __( "Cheers," );
	$message .= "\n\n";
	$message .= __( "The WordPress.com Team" );
	wp_mail( $admin_email, $subject, $message );

	bump_stats_extras( 'wpcom_privacy_access', 'request_access' );

	// Redirect requester back where they came
	wp_safe_redirect( get_site_url( $blog_id, '?request_access=success' ) );
	die();
}
add_action( 'parse_request', 'handle_private_blog_access_request', 20 );

/**
 * handle_add_private_blog_user_from_email()
 * Blog admin uses one-click add user to private blog link in notification email
 *
 * @uses add_private_blog_user()
 * @return void
 */
function handle_add_private_blog_user_from_email() {
	global $pagenow;

	if ( !is_private_blog() || !isset( $_GET['action'] ) || $_GET['action'] != 'add_user' || $pagenow != 'options-reading.php' || !current_user_can( 'manage_options' ) )
		return false;

	$user_login = sanitize_user( $_GET['user_login'] );
	$user_to_add = get_user_by( 'login', $user_login );
	if ( !$user_to_add ) {
		$message = 'user-not-found';
		wp_safe_redirect( add_query_arg( 'updated', $message, get_option( 'siteurl' ) . '/wp-admin/options-reading.php' ) );
		die();
	}

	$title = __( 'Privacy Settings' );
	$caution_message = __( 'You are about to give this user permission to view your private site:' );
	$ignore_message = 'ignore-request';
	$ignore_url = add_query_arg( 'updated', $ignore_message, admin_url( 'options-reading.php' ) );

	$submit_button = __( 'Grant Access to User' );

	// Only use the display name if they have a different one than the username
	if ( $user_to_add->user_login != $user_to_add->display_name )
		$requesting_user .= esc_html( $user_to_add->display_name ) . '<br /><span class="description">' . esc_html( $user_to_add->user_login ) . '</span>';
	else
		$requesting_user .= esc_html( $user_to_add->user_login );

	require_once( ABSPATH . 'wp-admin/admin-header.php' );
	?>

	<div class='wrap'>

	<div class="narrow">

	<?php screen_icon( 'options-general' ); ?>
	<h2><?php echo esc_html( $title ); ?></h2>

	<p><strong><?php _e( 'Caution:' ); ?></strong> <?php echo $caution_message; ?></p>

	<table class="form-table comment-ays">
		<tr>
			<th scope="row" valign="top" style="width:48px;"><?php echo get_avatar( $user_to_add->user_email, 48 ); ?></th>
			<td style="font-size:18px;line-height:24px"><?php echo $requesting_user; ?></td>
		</tr>
	</table>

	<p><?php _e( 'Are you sure you want to do this?' ); ?></p>

	<form action='options.php' method='post'>

	<table width="100%">
		<tr>
			<td><a class="button" href="<?php echo esc_attr( $ignore_url ); ?>"><?php esc_attr_e( 'No' ); ?></a></td>
			<td class="textright"><?php submit_button( $submit_button, 'button' ); ?></td>
		</tr>
	</table>

	<input type='hidden' name='add_private_user' value='<?php echo esc_attr( $user_to_add->user_login ); ?>' />
	<input type='hidden' name='approved_from_moderation' value='true' />
	<?php wp_nonce_field( 'add_private_user', '_wpnonce_add_private_user' ); ?>
	</form>

	</div>
	</div>

	<?php

	require_once( ABSPATH . 'wp-admin/admin-footer.php' );
	die();
}
add_action( 'load-options-reading.php', 'handle_add_private_blog_user_from_email', 20 );

function user_exists_on_private_blog( $user_id, $blog_id ) {
	global $wpdb;

	$query = $wpdb->prepare(
		"SELECT user_id FROM drama_blog_access WHERE blog_id = %d AND user_id = %d", $blog_id, $user_id
	);

	$result = $wpdb->query( $query );

	return false !== $result && 0 < $result;
}

function get_private_blog_users( $blog_id, $args = array() ) {
	global $wpdb;

	$query = $wpdb->prepare( "SELECT user_id FROM drama_blog_access WHERE blog_id = %d", $blog_id );

	if ( ! empty( $args ) ) {
		$defaults = array(
			'orderby' => 'added',
			'order' => 'DESC',
			'page' => 1,
			'per_page' => 20
		);

		$args = wp_parse_args( $args, $defaults );

		$query .= $wpdb->prepare(
			" ORDER BY %s %s LIMIT %d, %d;",
			$args['orderby'],
			$args['order'],
			intval( ( $args['page'] - 1 ) * $args['per_page'] ),
			intval( $args['per_page'] )
		);
	}

	$users = $wpdb->get_col( $query );

	return $users;
}

function get_count_private_blog_users( $blog_id ) {
	global $wpdb;

	$query = $wpdb->prepare( "SELECT COUNT(user_id) FROM drama_blog_access WHERE blog_id = %d", $blog_id );

	return (int) $wpdb->get_var( $query );
}

function _add_private_blog_user( $username, $blog_id = null ) {
	global $wpdb;

	$username = wp_specialchars( strtolower( $username ) );
	if ( is_email( $username ) ) {
		$user = get_user_by( 'email', $username );
		$user_id = $user->ID;
	} else {
		$username = preg_replace( '|[^a-z0-9-]|i', '', $username );
		$user = get_user_by( 'login', $username );
		$user_id = $user->ID;
	}

	if ( !$user_id )
		return new WP_Error( 'user-not-found', __( 'User not found' ) );

	if ( isset( $blog_id ) )
		$blog_id = intval( $blog_id );
	else
		$blog_id = $wpdb->blogid;

	$current_users = get_private_blog_users( $blog_id );
	$user_limit = private_blog_user_limit();

	if ( $user_limit !== false && count( $current_users ) >= $user_limit )
		return new WP_Error( 'too-many-users', sprintf( __( 'You can only add %d users to access this site.' ), $user_limit ) );

	if ( $wpdb->get_var( $wpdb->prepare( "SELECT blog_id FROM drama_blog_access WHERE blog_id = %d AND user_id = %d", $blog_id, $user_id ) ) )
		return new WP_Error( 'already-member', __( 'User is already a member of your private site' ) );

	do_action( 'add_private_blog_user', $user_id, $blog_id );

	$wpdb->insert(
		'drama_blog_access',
		array(
			'blog_id' => $blog_id,
			'user_id' => $user_id,
			'added' => current_time( 'mysql', true )
		),
		array( '%d', '%d', '%s' )
	);
	$key = "private_blog_user_{$blog_id}_{$user_id}";
	wp_cache_set( $key, 'y', 'users', HOUR_IN_SECONDS );

	do_action( 'added_private_blog_user', $user_id, $blog_id );

	bump_stats_extras( 'wpcom_privacy_access', 'access_added' );

	return true;
}

function add_private_blog_user( $username, $blog_id = null ) {
	$added = _add_private_blog_user( $username, $blog_id );
	if ( is_wp_error( $added ) ) {
		$message = urlencode( $added->get_error_code() );
		wp_safe_redirect( add_query_arg( 'updated', $message, get_admin_url( '/options-reading.php' ) ) );
		die();
	}

	// Generate and send the acceptance email
	$usermeta = get_user_by( 'login', $username );
	$site_name = get_bloginfo( 'name' );
	$subject = sprintf( __( "[%s] You've been granted access to view this private site" ), $site_name );
	$message = __( 'Howdy,' );
	$message .= "\n\n";
	$message .= sprintf( __( "You've been granted access to view %s by the site owner." ), trailingslashit( get_home_url( $blog_id ) ) );
	$message .= "\n\n";
	$message .= __( 'Cheers,' );
	$message .= "\n\n";
	$message .= __( 'The WordPress.com Team' );

	$to = $usermeta->user_email;

	if ( ! empty( $to ) && false === strpos( $to, 'deleted-account' ) )
		wp_mail( $usermeta->user_email, $subject, $message );

	$message = 'user-added';
	wp_safe_redirect( add_query_arg( 'updated', $message, get_option( 'siteurl' ) . '/wp-admin/options-reading.php' ) );
	die();
}

function remove_private_blog_user( $user_id, $blog_id = null ) {
	global $wpdb;

	$user_id = (int) $user_id;

	if ( !$user_id )
		return;

	if ( isset( $blog_id ) )
		$blog_id = intval( $blog_id );
	else
		$blog_id = $wpdb->blogid;

	do_action( 'remove_private_blog_user', $user_id, $blog_id );
	$result = $wpdb->query( $wpdb->prepare( "DELETE FROM drama_blog_access WHERE blog_id = %d AND user_id = %d", $blog_id, $user_id ) );

	$key = "private_blog_user_{$blog_id}_{$user_id}";
	wp_cache_set( $key, 'n', 'users', HOUR_IN_SECONDS );

	bump_stats_extras( 'wpcom_privacy_access', 'access_removed' );

	// Was the remove successful?
	return false !== $result && 0 < $result;
}

function catch_private_users() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( !$_POST['add_private_user'] && !$_POST['remove_private_blog_user'] )
		return;

	if ( $_POST['remove_private_blog_user'] ) {
		foreach ( $_POST['remove_private_blog_user'] as $k => $v ) {
			if ( check_admin_referer( 'remove_user_' . $k, '_wpnonce_remove_' . $k) )
				remove_private_blog_user( $k );
				$message = 'user-removed';
				wp_safe_redirect( add_query_arg( 'updated', $message, get_option( 'siteurl' ) . '/wp-admin/options-reading.php' ) );
				die();
		}
	}

	if ( $_POST['add_private_user'] && check_admin_referer( 'add_private_user', '_wpnonce_add_private_user' ) ) {
		if ( $_POST['approved_from_moderation'] )
			bump_stats_extras( 'wpcom_privacy_access', 'request_approved' );

		$user_login = sanitize_user( $_POST['add_private_user'] );
		add_private_blog_user( $user_login );
	}
}
add_action( 'load-options.php', 'catch_private_users' );

function unpublic_blog( $blog_id ) {
	$data = array( );
	$data['_blog_id'] = $blog_id;
	$data['_bt'] = wp_debug_backtrace_summary();
	queue_async_job( $data, 'async_unpublic_blog' );
}

function publicize_blog( $blog_id ) {
	$data = array( );
	$data['_blog_id'] = $blog_id;
	$data['_bt'] = wp_debug_backtrace_summary();
	queue_async_job( $data, 'async_publicize_blog' );
}

function privitize_tag_db() {
	global $wpdb, $current_blog;

	$is_public = 0;
	$blog_public = (int) $_POST['blog_public'];

	if ( 1 == $blog_public )
		$is_public = 1;

	if ( 1 == $current_blog->mature )
		$is_public = 0;

	if ( $is_public )
		publicize_blog( $wpdb->blogid );
	else
		unpublic_blog( $wpdb->blogid );
}
add_action( 'update_blog_public', 'privitize_tag_db' );

/**
 * If a user of a private blog isn't allowed access it's dashboard then redirect them to the blog itself
 */
function redirect_private_users_to_blog() {
	global $current_user, $current_site, $wpdb;
	if ( get_option( 'blog_public' ) && $wpdb->get_var( $wpdb->prepare( "SELECT blog_id FROM drama_blog_access WHERE blog_id = %d AND user_id = %d", $wpdb->blogid, $current_user->ID ) ) ) {
		wp_safe_redirect( home_url() );
		exit;
	}
}
add_action( 'admin_page_access_denied', 'redirect_private_users_to_blog', 1 );

/**
 * Don't let search engines index private sites
 * or sites not deemed publicly available, like deleted, archived, spam.
 */
function private_robots_txt( $output, $public ) {
	if ( ! is_publicly_available() ) {
		$output = "User-agent: *\n"; // Purposefully overriding current output; we only want these rules.
		$output .= "Disallow: /\n";
	}

	return $output;
}
add_filter( 'robots_txt', 'private_robots_txt', 10, 2 );

function privatize_privacy_on_link_title( $text ) {
	if ( '-1' == get_option('blog_public') )
		return __('Your site is visible only to registered members');

	return $text;
}
add_filter('privacy_on_link_title', 'privatize_privacy_on_link_title');

function privatize_privacy_on_link_text( $text ) {
	if ( '-1' == get_option('blog_public') )
		return __('Private');

	return $text;
}
add_filter('privacy_on_link_text', 'privatize_privacy_on_link_text');

/**
 * Output the meta tag that tells Pinterest not to allow users to pin
 * content from this page.
 * https://support.pinterest.com/entries/21063792-what-if-i-don-t-want-images-from-my-site-to-be-pinned
 */
function private_no_pinning() {
	echo '<meta name="pinterest" content="nopin" />';
}
add_action( 'wp_head', 'private_no_pinning' );

function privatize_opml() {
	if ( '-1' != get_option('blog_public') ) {
		return;
	}

	if ( is_super_admin() || is_private_blog_user( get_current_blog_id(), get_current_user_id() ) ) {
		return;
	}


	echo wpcom_get_the_generator( '', 'comment' );
?>
	</head>
	<body>
	</body>
</opml>
<?php
	exit;
}

add_action( 'opml_head', 'privatize_opml', 0 );

function allow_rest_api_users_to_view_private_blogs( $can_view ) {
	return $can_view || is_really_private_blog_user();
}
add_filter( 'wpcom_json_api_user_can_view_post', 'allow_rest_api_users_to_view_private_blogs', 10, 1 );
add_filter( 'wpcom_json_api_user_is_member_of_blog', 'allow_rest_api_users_to_view_private_blogs', 10, 1 );

function private_blog_ajax_nonce_check( $action, $result ) {
	global $current_user, $wpdb;

	if ( is_super_admin() || !is_private_blog() ) {
		return;
	}

	if ( $result !== 1 && $result !== 2 ) {
		return;
	}

	if ( $action !== 'find-posts' && $action !== 'internal-linking' ) {
		return;
	}

	// Make sure we are in the right code path, if not bail now
	if ( !is_admin() || ( !defined( 'DOING_AJAX' ) || !DOING_AJAX ) ) {
		return;
	}

	if ( !is_private_blog_user($wpdb->blogid, $current_user) ) {
		wp_die( -1 );
	}
}
add_action( 'check_ajax_referer', 'private_blog_ajax_nonce_check', 9999, 2 );

add_filter( 'syntaxhighlighter_defaultsettings', function( $settings ) {
	if ( is_private_blog() && ! get_option('links_public') ) {
		$settings['autolinks'] = 0;
	}

	return $settings;
} );