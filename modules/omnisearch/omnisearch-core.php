<?php

// Declare the new instances here, so that the classes can
// be pulled in elsewhere if desired without activating them.
require_once( dirname(__FILE__) . '/omnisearch-posts.php' );
new Jetpack_Omnisearch_Posts;

require_once( dirname(__FILE__) . '/omnisearch-pages.php' );
new Jetpack_Omnisearch_Pages;

require_once( dirname(__FILE__) . '/omnisearch-comments.php' );
new Jetpack_Omnisearch_Comments;

if ( current_user_can( 'install_plugins' ) ) {
	require_once( dirname(__FILE__) . '/omnisearch-plugins.php' );
	new Jetpack_Omnisearch_Plugins;
}

class Jetpack_Omnisearch {
	static $instance;
	static $num_results = 5;

	function __construct() {
		self::$instance = $this;
		add_action( 'wp_loaded', array( $this, 'wp_loaded' ) );
		add_action(	'jetpack_admin_menu', array( $this, 'jetpack_admin_menu' ) );
		if( is_admin() ) {
			add_action( 'admin_bar_menu', array( $this, 'admin_bar_search' ), 4 );
		}
	}

	function wp_loaded() {
		$deps = null;
		if ( wp_style_is( 'genericons', 'registered' ) ) {
			$deps = array( 'genericons' );
		}

		wp_register_style( 'omnisearch-admin', plugins_url( 'omnisearch.css', __FILE__ ), $deps );
	}

	function jetpack_admin_menu() {
		$slug = add_submenu_page( 'jetpack', __('Omnisearch'), __('Omnisearch'), 'edit_posts', 'omnisearch', array( $this, 'omnisearch_page' ) );

		add_action( "admin_print_styles-{$slug}", array( $this, 'admin_print_styles' ) );
	}

	function admin_print_styles() {
		wp_enqueue_style( 'omnisearch-admin' );
	}

	function omnisearch_page() {
		$results = array();
		$s = isset( $_GET['s'] ) ? $_GET['s'] : '';
		if( $s ) {
			$results = apply_filters( 'omnisearch_results', $results, $s );
		}
		?>
		<div class="wrap">
			<h2 class="page-title"><?php _e('Jetpack Omnisearch'); ?></h2>
			<br class="clear" />
			<form action="<?php echo admin_url( 'admin.php' ); ?>" method="get" class="omnisearch-form">
				<input type="hidden" name="page" value="omnisearch" />
				<input type="search" name="s" class="omnisearch" placeholder="<?php _e('Search Everything'); ?>" value="<?php echo esc_attr( $s ); ?>" />
				<button type="submit" class="omnisearch-submit"><span><?php _e('Search'); ?></span></button>
			</form>
			<?php if( ! empty( $results ) ): ?>
				<h3 id="results-title"><?php _e('Results:'); ?></h3>
				<div class="jump-to"><strong><?php _e('Jump to:'); ?></strong></div>
				<br class="clear" />
				<script>var search_term = <?php echo json_encode( $s ); ?>, num_results = <?php echo json_encode( self::$num_results ); ?>;</script>
				<ul class="omnisearch-results">
					<?php foreach( $results as $id => $result ) : ?>
						<li id="result-<?php echo $id; ?>">
							<?php echo $result; ?>
							<a class="back-to-top" href="#results-title"><?php _e('Back to Top &uarr;'); ?></a>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div><!-- /wrap -->
		<script>
		jQuery(document).ready(function($){
			$('.omnisearch-results > li').each(function(){
				label = $(this).find('h2').first().clone().children().remove().end().text();
				$('.jump-to').append(' <a href="#' + $(this).attr('id') + '">' + label + '</a>');
			});
		});
		</script>
		<?php
	}

	function admin_bar_search( $wp_admin_bar ) {
		if( ! is_admin() ) return;

		$search_terms = isset( $_GET[ 's' ] ) ? esc_attr( $_GET['s'] ) : '';

		$form  = '<form action="' . esc_url( admin_url( 'admin.php' ) ) . '" method="get" id="adminbarsearch">';
		$form .= '<input type="hidden" name="page" value="omnisearch" />';
		$form .= '<input class="adminbar-input" name="s" id="adminbar-search" type="search" value="' . $search_terms . '" maxlength="150" placeholder="' . __('Search Everything') . '" />';
		$form .= '<input type="submit" class="adminbar-button" value="' . __('Search') . '"/>';
		$form .= '</form>';

		$wp_admin_bar->add_menu( array(
			'parent' => 'top-secondary',
			'id'     => 'search',
			'title'  => $form,
			'meta'   => array(
				'class'    => 'admin-bar-search',
				'tabindex' => -1,
			)
		) );
	}

}
new Jetpack_Omnisearch;
