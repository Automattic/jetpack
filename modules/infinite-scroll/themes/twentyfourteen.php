<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for Twenty Fourteen.
 */

/**
 * Add theme support for infinite scroll
 */
function jetpack_twentyfourteen_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'render'         => 'twentyfourteen_infinite_scroll_render',
		'footer'         => 'page',
		'footer_widgets' => jetpack_twentyfourteen_has_footer_widgets(),
	) );
}
add_action( 'after_setup_theme', 'jetpack_twentyfourteen_infinite_scroll_init' );

/**
 * Needs to be defined so AMP logic kicks in.
 */
function twentyfourteen_infinite_scroll_render() {}

/**
 * Switch to the "click to load" type IS with the following cases
 * 1. Viewed from iPad and the primary sidebar is active.
 * 2. Viewed from mobile and either the primary or the content sidebar is active.
 * 3. The footer widget is active.
 *
 * @return bool
 */
function jetpack_twentyfourteen_has_footer_widgets() {
	if ( function_exists( 'jetpack_is_mobile' ) ) {
		if ( ( Jetpack_User_Agent_Info::is_ipad() && is_active_sidebar( 'sidebar-1' ) )
			|| ( jetpack_is_mobile( '', true ) && ( is_active_sidebar( 'sidebar-1' ) || is_active_sidebar( 'sidebar-2' ) ) )
			|| is_active_sidebar( 'sidebar-3' ) )

			return true;
	}

	return false;
}

/**
 * Enqueue CSS stylesheet with theme styles for Infinite Scroll.
 */
function jetpack_twentyfourteen_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) || class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$dep = wp_script_is( 'the-neverending-homepage' ) ? array( 'the-neverending-homepage' ) : array();
		wp_enqueue_style( 'infinity-twentyfourteen', plugins_url( 'twentyfourteen.css', __FILE__ ), $dep, '20131118' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentyfourteen_infinite_scroll_enqueue_styles', 25 );

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_twentyfourteen_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentyfourteen_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentyfourteen_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentyfourteen_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentyfourteen_amp_infinite_footers( $footers, $buffer ) {
	// Collect the sidebar wrapper.
	preg_match(
		'/<div id="secondary".*<!-- #secondary -->/s',
		$buffer,
		$footer
	);
	$footers[] = reset( $footer );

	// Collect the footer wrapper.
	preg_match(
		'/<footer id="colophon".*<!-- #colophon -->/s',
		$buffer,
		$footer
	);
	$footers[] = reset( $footer );

	return $footers;
}

/**
 * Hide and remove various elements from next page load.
 *
 * @param string $buffer Contents of the output buffer.
 *
 * @return string
 */
function twentyfourteen_amp_infinite_output( $buffer ) {
	// Hide site header on next page load.
	$buffer = preg_replace(
		'/<header id="masthead"/',
		'$0 next-page-hide',
		$buffer
	);

	// Remove the sidebar as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<div id="secondary".*<!-- #secondary -->/s',
		'',
		$buffer
	);

	// Hide below nav bar.
	$buffer = preg_replace(
		'/<nav class="navigation paging-navigation"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Remove the footer as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<footer id="colophon".*<!-- #colophon -->/s',
		'',
		$buffer
	);

	return $buffer;
}

/**
 * Filter the AMP infinite scroll older posts button
 *
 * @return string
 */
function twentyfourteen_amp_infinite_older_posts() {
	ob_start();
	?>
<div id="infinite-handle">
	<span>
		<a href="{{url}}">
			<button>
				{{title}}
			</button>
		</a>
	</span>
</div>
	<?php
	return ob_get_clean();
}
