<?php
/**
 * Block theme footer credits file.
 *
 * @package block-theme-footer-credits
 */

/**
 * Inserts a footer credits bar on every free WPCOM Block-based theme site.
 * Explanatory post: pcjTuq-ff-p2
 */
class WPCOM_Block_Theme_Footer_Credits {
	// Update when we make changes to frontend assets to force a cache bust.
	const FRONTEND_ASSETS_VERSION = '20210319';

	/**
	 * Initializes the plugin.
	 */
	public function init() {
		$blog_id = get_current_blog_id();

		if ( ! $this->should_update_footer_credits( $blog_id ) ) {
			return;
		}

		// Filter render blocks and find the footer.
		add_filter( 'render_block', array( $this, 'maybe_add_markup_to_footer_template' ), 10, 2 );
	}

	/**
	 * Filters the blocks being rendered in render_block(), before it's processed,
	 * locate the footer template and update its content.
	 *
	 * @param string $block_content Block HTML content.
	 * @param array  $block         The block being rendered, as a single parsed block object.
	 * @return string               The updated block HTML content.
	 */
	public function maybe_add_markup_to_footer_template( $block_content, $block ) {

		if ( $block['blockName'] !== 'core/template-part' || $block['attrs']['slug'] !== 'footer' ) {
			return $block_content;
		}

		// Try to find link to either WordPress.com or .org.
		// Here we're expecting something along the lines of `<p>Powered by <a href="https://wordpress.org">WordPress</a></p>`
		$credit_regex   = '/[^>]*<a[^(<|>)]*href="(http|https):\/\/(www\.)?wordpress.(org|com)(\/)?(\?\w+\=\w+)?"(\s?\w+\="[\w\-]+")*>.*<\/a>[^<]*/'; // phpcs:ignore WordPress.WP.CapitalPDangit.Misspelled
		$credit_matches = preg_match( $credit_regex, $block_content );

		// If there's a successful match, replace with our content.
		if ( $credit_matches ) {
			$new_value = $this->get_credit_link();
			return preg_replace( $credit_regex, $new_value, $block_content );
		}

		// If there is not a sucessful match append additional markup.
		return $block_content . $this->get_credit_html();
	}

	/**
	 * Returns an HTML snipper with the WordPress.com link embedded.
	 *
	 * The innerHTML of the P tag may vary depending on which content the user has
	 * selected in the Customizer, if any.
	 *
	 * @return string The footer credit HTML with WordPress.com link.
	 */
	public function get_credit_html() {
		$credit_link = $this->get_credit_link();
		if ( empty( $credit_link ) ) {
			return '';
		}
		return '<!-- wp:group --><div class="wp-block-group">' .
			'<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">' .
			$credit_link . '</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
	}

	/**
	 * Returns the WordPress.com footer credit link HTML.
	 *
	 * @return string The footer link HTML
	 */
	public function get_credit_link() {
		// Set any globals so the JS can access them.
		$lang       = get_bloginfo( 'language' );
		$credit_url = apply_filters( 'wpcom_better_footer_credit_url', 'https://wordpress.com/?ref=footer_blog', $lang );
		if ( ! empty( $credit_url ) ) {
			$credit_link = sprintf( '<a href="%s">%s.</a>', esc_url( $credit_url ), __( 'Blog at WordPress.com' ) );
		} else {
			$credit_link = '';
		}
		return apply_filters( 'wpcom_better_footer_credit_link', $credit_link, $lang );
	}

	/**
	 * Determines whether the footer credits bar should be updated for the current site.
	 * Should return as early as possible.
	 * Can be overridden with the WordPress filter: `wpcom_should_show_block_theme_footer_credits`
	 *
	 * @param  int $blog_id current blog ID
	 * @return boolean          true if the credits should show, false otherwise.
	 */
	public function should_update_footer_credits( $blog_id ) {
		// Reject empty argument.
		if ( empty( $blog_id ) ) {
			return false;
		}

		// If we're not using the site editor-capable theme, don't show.
		if ( ! $this->is_block_theme() ) {
			return false;
		}

		// If the current request is an API request, don't show.
		if ( $this->is_api_request() ) {
			return false;
		}

		// Are we in Coming Soon mode? Don't show.
		// Site members don't see the Coming Soon page when they're logged in.
		// So we should also show the footer banner for those who can see the site.
		// For all logged out coming soon page hits, we'll hide the banner.
		if ( $this->is_coming_soon( $blog_id ) && ! $this->is_site_member_logged_in() ) {
			return false;
		}

		return apply_filters( 'wpcom_should_show_block_theme_footer_credits', true );
	}

	/**
	 * Determine if the current theme is a block theme.
	 *
	 * @return bool True if the theme is a block theme. False otherwise.
	 */
	public function is_block_theme() {
		return function_exists( 'wp_is_block_theme' ) && wp_is_block_theme();
	}

	/**
	 * Determine if the current request is an API request
	 *
	 * @return bool True if the request is an API request, false otherwise.
	 */
	private function is_api_request() {
		$is_api_request = defined( 'REST_API_REQUEST' ) && REST_API_REQUEST;
		if ( $is_api_request ) {
			return true;
		}

		return false;
	}

	/**
	 * Determine if the current site is in coming soon mode.
	 *
	 * @param  int $blog_id The blog_id
	 * @return bool         True if the request is in coming soon mode, false otherwise.
	 */
	private function is_coming_soon( $blog_id ) {
		if ( function_exists( 'is_wpcom_public_coming_soon_enabled' ) ) {
			if ( is_wpcom_public_coming_soon_enabled( $blog_id ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks if a site member is logged in while visiting the site.
	 *
	 * @return bool         True if logged in, false otherwise.
	 */
	private function is_site_member_logged_in() {
		if ( is_user_logged_in() && current_user_can( 'read' ) ) {
			return true;
		}

		return false;
	}
}
