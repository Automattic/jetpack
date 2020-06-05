<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for @Twenty Ten and enqueue relevant styles.
 */

/**
 * Add theme support for infinity scroll
 */
function jetpack_twentyten_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'render'         => 'jetpack_twentyten_infinite_scroll_render',
		'footer'         => 'wrapper',
		'footer_widgets' => jetpack_twentyten_has_footer_widgets(),
	) );
}
add_action( 'init', 'jetpack_twentyten_infinite_scroll_init' );

/**
 * Set the code to be rendered on for calling posts,
 * hooked to template parts when possible.
 *
 * Note: must define a loop.
 */
function jetpack_twentyten_infinite_scroll_render() {
	get_template_part( 'loop' );
}

/**
 * Enqueue CSS stylesheet with theme styles for infinity.
 */
function jetpack_twentyten_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) ) {
		// Add theme specific styles.
		wp_enqueue_style( 'infinity-twentyten', plugins_url( 'twentyten.css', __FILE__ ), array( 'the-neverending-homepage' ), '20121002' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentyten_infinite_scroll_enqueue_styles', 25 );

/**
 * Do we have footer widgets?
 */
function jetpack_twentyten_has_footer_widgets() {
	if ( is_active_sidebar( 'first-footer-widget-area' ) ||
		is_active_sidebar( 'second-footer-widget-area' ) ||
		is_active_sidebar( 'third-footer-widget-area'  ) ||
		is_active_sidebar( 'fourth-footer-widget-area' ) ) {

		return true;
	}

	return false;
}

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_jetpack_twentyten_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentyten_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentyten_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentyten_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentyten_amp_infinite_footers( $footers, $buffer ) {
	// Collect the footer wrapper.
	preg_match(
		'/<div id="footer" role="contentinfo".*<!-- #footer -->/s',
		$buffer,
		$footer
	);
	$footers[] = '<div style="background: #fff; margin: 0 auto; padding: 0 20px; width: 940px;">' . reset( $footer ) . '</div>';

	return $footers;
}

/**
 * Hide and remove various elements from next page load.
 *
 * @param string $buffer Contents of the output buffer.
 *
 * @return string
 */
function twentyten_amp_infinite_output( $buffer ) {
	// Hide site header on next page load.
	$buffer = preg_replace(
		'/<div id="header"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide sidebar on next page load.
	$buffer = preg_replace(
		'/<div id="primary"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide pagination on next page load.
	$buffer = preg_replace(
		'/<div id="nav-above" class="navigation"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	$buffer = preg_replace(
		'/<div id="nav-below" class="navigation"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Remove the footer as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<div id="footer" role="contentinfo".*<!-- #footer -->/s',
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
function twentyten_amp_infinite_older_posts() {
	ob_start();
	?>
<div id="infinite-handle" style="background: #fff; margin: 0 auto; padding: 0 20px 20px; width: 940px;">
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
