<?php
/**
 * Add Content section to the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function jetpack_content_options_customize_register( $wp_customize ) {
	$options            = get_theme_support( 'jetpack-content-options' );
	$blog_display       = ( ! empty( $options[0]['blog-display'] ) ) ? $options[0]['blog-display'] : null;
	$blog_display       = preg_grep( '/^(content|excerpt)$/', (array) $blog_display );
	sort( $blog_display );
	$blog_display       = implode( ', ', $blog_display );
	$blog_display       = ( 'content, excerpt' === $blog_display ) ? 'mixed' : $blog_display;
	$author_bio         = ( ! empty( $options[0]['author-bio'] ) ) ? $options[0]['author-bio'] : null;
	$author_bio_default = ( isset( $options[0]['author-bio-default'] ) && false === $options[0]['author-bio-default'] ) ? '' : 1;
	$post_details       = ( ! empty( $options[0]['post-details'] ) ) ? $options[0]['post-details'] : null;
	$date               = ( ! empty( $post_details['date'] ) ) ? $post_details['date'] : null;
	$categories         = ( ! empty( $post_details['categories'] ) ) ? $post_details['categories'] : null;
	$tags               = ( ! empty( $post_details['tags'] ) ) ? $post_details['tags'] : null;
	$author             = ( ! empty( $post_details['author'] ) ) ? $post_details['author'] : null;
	$featured_images    = ( ! empty( $options[0]['featured-images'] ) ) ? $options[0]['featured-images'] : null;
	$fi_archive         = ( ! empty( $featured_images['archive'] ) ) ? $featured_images['archive'] : null;
	$fi_post            = ( ! empty( $featured_images['post'] ) ) ? $featured_images['post'] : null;
	$fi_page            = ( ! empty( $featured_images['page'] ) ) ? $featured_images['page'] : null;
	$fi_archive_default = ( isset( $featured_images['archive-default'] ) && false === $featured_images['archive-default'] ) ? '' : 1;
	$fi_post_default    = ( isset( $featured_images['post-default'] ) && false === $featured_images['post-default'] ) ? '' : 1;
	$fi_page_default    = ( isset( $featured_images['page-default'] ) && false === $featured_images['page-default'] ) ? '' : 1;

	// If the theme doesn't support 'jetpack-content-options[ 'blog-display' ]', 'jetpack-content-options[ 'author-bio' ]', 'jetpack-content-options[ 'post-details' ]' and 'jetpack-content-options[ 'featured-images' ]', don't continue.
	if ( ( ! in_array( $blog_display, array( 'content', 'excerpt', 'mixed' ) ) )
	    && ( true !== $author_bio )
	    && ( ( empty( $post_details['stylesheet'] ) )
			&& ( empty( $date )
				|| empty( $categories )
				|| empty( $tags )
				|| empty( $author ) ) )
		&& ( true !== $fi_archive && true !== $fi_post && true !== $fi_page ) ) {
	    return;
	}

	// New control type: Title.
	class Jetpack_Customize_Control_Title extends WP_Customize_Control {
		public $type = 'title';

		public function render_content() {
		?>
			<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
		<?php
		}
	}

	// Add Content section.
	$wp_customize->add_section( 'jetpack_content_options', array(
		'title'                        => esc_html__( 'Content Options', 'jetpack' ),
		'theme_supports'               => 'jetpack-content-options',
		'priority'                     => 100,
	) );

	// Add Blog Display option.
	if ( in_array( $blog_display, array( 'content', 'excerpt', 'mixed' ) ) ) {
		if ( 'mixed' === $blog_display ) {
			$blog_display_choices = array(
				'content' => esc_html__( 'Full post', 'jetpack' ),
				'excerpt' => esc_html__( 'Post excerpt', 'jetpack' ),
				'mixed'   => esc_html__( 'Default', 'jetpack' ),
			);

			$blog_display_description = esc_html__( 'Choose between a full post or an excerpt for the blog and archive pages, or opt for the theme\'s default combination of excerpt and full post.', 'jetpack' );
		} else {
			$blog_display_choices = array(
				'content' => esc_html__( 'Full post', 'jetpack' ),
				'excerpt' => esc_html__( 'Post excerpt', 'jetpack' ),
			);

			$blog_display_description = esc_html__( 'Choose between a full post or an excerpt for the blog and archive pages.', 'jetpack' );

			if ( 'mixed' === get_option( 'jetpack_content_blog_display' ) ) {
				update_option( 'jetpack_content_blog_display', $blog_display );
			}
		}

		$wp_customize->add_setting( 'jetpack_content_blog_display', array(
			'default'                  => $blog_display,
			'type'                     => 'option',
			'transport'                => 'postMessage',
			'sanitize_callback'        => 'jetpack_content_options_sanitize_blog_display',
		) );

		$wp_customize->add_control( 'jetpack_content_blog_display', array(
			'section'                  => 'jetpack_content_options',
			'label'                    => esc_html__( 'Blog Display', 'jetpack' ),
			'description'              => $blog_display_description,
			'type'                     => 'radio',
			'choices'                  => $blog_display_choices,
		) );
	}

	// Add Author Bio option.
	if ( true === $author_bio ) {
		$wp_customize->add_setting( 'jetpack_content_author_bio_title' );

		$wp_customize->add_control( new Jetpack_Customize_Control_Title( $wp_customize, 'jetpack_content_author_bio_title', array(
			'section'                  => 'jetpack_content_options',
			'label'                    => esc_html__( 'Author Bio', 'jetpack' ),
			'type'                     => 'title',
		) ) );

		$wp_customize->add_setting( 'jetpack_content_author_bio', array(
			'default'                  => $author_bio_default,
			'type'                     => 'option',
			'sanitize_callback'        => 'jetpack_content_options_sanitize_checkbox',
		) );

		$wp_customize->add_control( 'jetpack_content_author_bio', array(
			'section'                  => 'jetpack_content_options',
			'label'                    => esc_html__( 'Display on single posts', 'jetpack' ),
			'type'                     => 'checkbox',
		) );
	}

	// Add Post Details options.
	if ( ( ! empty( $post_details ) )
		&& ( ! empty( $post_details['stylesheet'] ) )
		&& ( ! empty( $date )
			|| ! empty( $categories )
			|| ! empty( $tags )
			|| ! empty( $author ) ) ) {
		$wp_customize->add_setting( 'jetpack_content_post_details_title' );

		$wp_customize->add_control( new Jetpack_Customize_Control_Title( $wp_customize, 'jetpack_content_post_details_title', array(
			'section'                  => 'jetpack_content_options',
			'label'                    => esc_html__( 'Post Details', 'jetpack' ),
			'type'                     => 'title',
		) ) );

		// Post Details: Date
		if ( ! empty( $date ) ) {
			$wp_customize->add_setting( 'jetpack_content_post_details_date', array(
				'default'              => 1,
				'type'                 => 'option',
				'transport'            => 'postMessage',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_post_details_date', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display date', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}

		// Post Details: Categories
		if ( ! empty( $categories ) ) {
			$wp_customize->add_setting( 'jetpack_content_post_details_categories', array(
				'default'              => 1,
				'type'                 => 'option',
				'transport'            => 'postMessage',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_post_details_categories', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display categories', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}

		// Post Details: Tags
		if ( ! empty( $tags ) ) {
			$wp_customize->add_setting( 'jetpack_content_post_details_tags', array(
				'default'              => 1,
				'type'                 => 'option',
				'transport'            => 'postMessage',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_post_details_tags', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display tags', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}

		// Post Details: Author
		if ( ! empty( $author ) ) {
			$wp_customize->add_setting( 'jetpack_content_post_details_author', array(
				'default'              => 1,
				'type'                 => 'option',
				'transport'            => 'postMessage',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_post_details_author', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display author', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}
	}

	// Add Featured Images options.
	if ( true === $fi_archive || true === $fi_post || true === $fi_page ) {
		$wp_customize->add_setting( 'jetpack_content_featured_images_title' );

		$wp_customize->add_control( new Jetpack_Customize_Control_Title( $wp_customize, 'jetpack_content_featured_images_title', array(
			'section'                  => 'jetpack_content_options',
			'label'                    => esc_html__( 'Featured Images', 'jetpack' ),
			'type'                     => 'title',
		) ) );

		// Featured Images: Archive
		if ( true === $fi_archive ) {
			$wp_customize->add_setting( 'jetpack_content_featured_images_archive', array(
				'default'              => $fi_archive_default,
				'type'                 => 'option',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_featured_images_archive', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display on blog and archives', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}

		// Featured Images: Post
		if ( true === $fi_post ) {
			$wp_customize->add_setting( 'jetpack_content_featured_images_post', array(
				'default'              => $fi_post_default,
				'type'                 => 'option',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_featured_images_post', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display on single posts', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}

		// Featured Images: Page
		if ( true === $fi_page ) {
			$wp_customize->add_setting( 'jetpack_content_featured_images_page', array(
				'default'              => $fi_page_default,
				'type'                 => 'option',
				'sanitize_callback'    => 'jetpack_content_options_sanitize_checkbox',
			) );

			$wp_customize->add_control( 'jetpack_content_featured_images_page', array(
				'section'              => 'jetpack_content_options',
				'label'                => esc_html__( 'Display on pages', 'jetpack' ),
				'type'                 => 'checkbox',
			) );
		}
	}
}
add_action( 'customize_register', 'jetpack_content_options_customize_register' );

/**
 * Sanitize the checkbox.
 *
 * @param int $input.
 * @return boolean|string
 */
function jetpack_content_options_sanitize_checkbox( $input ) {
	return ( 1 == $input ) ? 1 : '';
}

/**
 * Sanitize the Display value.
 *
 * @param string $display.
 * @return string.
 */
function jetpack_content_options_sanitize_blog_display( $display ) {
	if ( ! in_array( $display, array( 'content', 'excerpt', 'mixed' ) ) ) {
		$display = 'content';
	}
	return $display;
}

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function jetpack_content_options_customize_preview_js() {
	$options      = get_theme_support( 'jetpack-content-options' );
	$blog_display = ( ! empty( $options[0]['blog-display'] ) ) ? $options[0]['blog-display'] : null;
	$blog_display = preg_grep( '/^(content|excerpt)$/', (array) $blog_display );
	sort( $blog_display );
	$blog_display = implode( ', ', $blog_display );
	$blog_display = ( 'content, excerpt' === $blog_display ) ? 'mixed' : $blog_display;
	$masonry      = ( ! empty( $options[0]['masonry'] ) ) ? $options[0]['masonry'] : null;
	$post_details = ( ! empty( $options[0]['post-details'] ) ) ? $options[0]['post-details'] : null;
	$date         = ( ! empty( $post_details['date'] ) ) ? $post_details['date'] : null;
	$categories   = ( ! empty( $post_details['categories'] ) ) ? $post_details['categories'] : null;
	$tags         = ( ! empty( $post_details['tags'] ) ) ? $post_details['tags'] : null;
	$author       = ( ! empty( $post_details['author'] ) ) ? $post_details['author'] : null;

	wp_enqueue_script( 'jetpack-content-options-customizer', plugins_url( 'customizer.js', __FILE__ ), array( 'customize-preview' ), '1.0', true );

	wp_localize_script( 'jetpack-content-options-customizer', 'blogDisplay', array(
		'display'    => get_option( 'jetpack_content_blog_display', $blog_display ),
		'masonry'    => $masonry,
	) );

	wp_localize_script( 'jetpack-content-options-customizer', 'postDetails', array(
		'date'       => $date,
		'categories' => $categories,
		'tags'       => $tags,
		'author'     => $author,
	) );
}
add_action( 'customize_preview_init', 'jetpack_content_options_customize_preview_js' );
