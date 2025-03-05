<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

use WP_Styles;

// Disable complaints about enqueuing stylesheets, as this class alters the way enqueuing them works.
// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet

/**
 * Replacement for, and subclass of WP_Styles - used to control the way that styles are enqueued and output.
 */
class Concatenate_CSS extends WP_Styles {
	private $dependency_path_mapping;
	private $old_styles;

	public $allow_gzip_compression;

	public function __construct( $styles ) {
		if ( empty( $styles ) || ! ( $styles instanceof WP_Styles ) ) {
			$this->old_styles = new WP_Styles();
		} else {
			$this->old_styles = $styles;
		}

		// Unset all the object properties except our private copy of the styles object.
		// We have to unset everything so that the overload methods talk to $this->old_styles->whatever
		// instead of $this->whatever.
		foreach ( array_keys( get_object_vars( $this ) ) as $key ) {
			if ( 'old_styles' === $key ) {
				continue;
			}
			unset( $this->$key );
		}

		$this->dependency_path_mapping = new Dependency_Path_Mapping(
			/**
			 * Filter the URL of the site the plugin will be concatenating CSS or JS on
			 *
			 * @param string $url URL of the page with CSS or JS to concatonate.
			 *
			 * @since   1.0.0
			 */
			apply_filters( 'page_optimize_site_url', $this->base_url )
		);
	}

	public function do_items( $handles = false, $group = false ) {
		$handles     = false === $handles ? $this->queue : (array) $handles;
		$stylesheets = array();
		/**
		 * Filter the URL of the site the plugin will be concatenating CSS or JS on
		 *
		 * @param string $url URL of the page with CSS or JS to concatonate.
		 *
		 * @since   1.0.0
		 */
		$siteurl = apply_filters( 'page_optimize_site_url', $this->base_url );

		$this->all_deps( $handles );

		$stylesheet_group_index = 0;
		// Merge CSS into a single file
		$concat_group = 'concat';
		// Concat group on top (first array element gets processed earlier)
		$stylesheets[ $concat_group ] = array();

		foreach ( $this->to_do as $key => $handle ) {
			$obj = $this->registered[ $handle ];
			/**
			 * Filter the style source URL
			 *
			 * @param string $url URL of the page with CSS or JS to concatonate.
			 * @param string $handle handle to CSS file.
			 *
			 * @since   1.0.0
			 */
			$obj->src = apply_filters( 'style_loader_src', $obj->src, $obj->handle );

			// Core is kind of broken and returns "true" for src of "colors" handle
			// http://core.trac.wordpress.org/attachment/ticket/16827/colors-hacked-fixed.diff
			// http://core.trac.wordpress.org/ticket/20729
			$css_url = $obj->src;
			if ( 'colors' === $obj->handle && true === $css_url ) {
				$css_url = wp_style_loader_src( $css_url, $obj->handle );
			}

			$css_url        = jetpack_boost_enqueued_to_absolute_url( $css_url );
			$css_url_parsed = wp_parse_url( $css_url );
			$extra          = $obj->extra;

			// Don't concat by default
			$do_concat = false;

			// Only try to concat static css files
			if ( str_contains( $css_url_parsed['path'], '.css' ) ) {
				$do_concat = true;
			} elseif ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat CSS %s => Maybe Not Static File %s -->\n", esc_html( $handle ), esc_html( $obj->src ) );
			}

			// Don't try to concat styles which are loaded conditionally (like IE stuff)
			if ( isset( $extra['conditional'] ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat CSS %s => Has Conditional -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Don't concat rtl stuff for now until concat supports it correctly
			if ( $do_concat && 'rtl' === $this->text_direction && ! empty( $extra['rtl'] ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat CSS %s => Is RTL -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Don't try to concat externally hosted scripts
			$is_internal_uri = $this->dependency_path_mapping->is_internal_uri( $css_url );
			if ( $do_concat && ! $is_internal_uri ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat CSS %s => External URL: %s -->\n", esc_html( $handle ), esc_url( $css_url ) );
				}
				$do_concat = false;
			}

			if ( $do_concat ) {
				// Resolve paths and concat styles that exist in the filesystem
				$css_realpath = $this->dependency_path_mapping->dependency_src_to_fs_path( $css_url );
				if ( false === $css_realpath ) {
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						printf( "\n<!-- No Concat CSS %s => Invalid Path %s -->\n", esc_html( $handle ), esc_html( $css_realpath ) );
					}
					$do_concat = false;
				}
			}

			// Skip concating CSS from exclusion list
			$exclude_list = jetpack_boost_page_optimize_css_exclude_list();
			foreach ( $exclude_list as $exclude ) {
				if ( $do_concat && $handle === $exclude ) {
					$do_concat = false;
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						printf( "\n<!-- No Concat CSS %s => Excluded option -->\n", esc_html( $handle ) );
					}
				}
			}

			/**
			 * Filter that allows plugins to disable concatenation of certain stylesheets.
			 *
			 * @param bool $do_concat if true, then perform concatenation
			 * @param string $handle handle to CSS file
			 *
			 * @since   1.0.0
			 */
			if ( $do_concat && ! apply_filters( 'css_do_concat', $do_concat, $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat CSS %s => Filtered `false` -->\n", esc_html( $handle ) );
				}
			}
			/**
			 * Filter that allows plugins to disable concatenation of certain stylesheets.
			 *
			 * @param bool $do_concat if true, then perform concatenation
			 * @param string $handle handle to CSS file
			 *
			 * @since   1.0.0
			 */
			$do_concat = apply_filters( 'css_do_concat', $do_concat, $handle );

			if ( true === $do_concat ) {
				$media = $obj->args;
				if ( empty( $media ) ) {
					$media = 'all';
				}

				$stylesheets[ $concat_group ][ $media ][ $handle ] = $css_url_parsed['path'];
				$this->done[]                                      = $handle;
			} else {
				++$stylesheet_group_index;
				$stylesheets[ $stylesheet_group_index ]['noconcat'][] = $handle;
				++$stylesheet_group_index;
			}
			unset( $this->to_do[ $key ] );
		}

		foreach ( $stylesheets as $_idx => $stylesheets_group ) {
			foreach ( $stylesheets_group as $media => $css ) {
				if ( 'noconcat' === $media ) {
					foreach ( $css as $handle ) {
						if ( $this->do_item( $handle, $group ) ) {
							$this->done[] = $handle;
						}
					}
					continue;
				} elseif ( count( $css ) > 1 ) {
					$file_name = jetpack_boost_page_optimize_generate_concat_path( $css, $this->dependency_path_mapping );

					if ( get_site_option( 'jetpack_boost_static_minification' ) ) {
						$href = jetpack_boost_get_minify_url( $file_name . '.min.css' );
					} else {
						$href = $siteurl . jetpack_boost_get_static_prefix() . '??' . $file_name;
					}
				} else {
					$href = jetpack_boost_page_optimize_cache_bust_mtime( current( $css ), $siteurl );
				}

				$handles = array_keys( $css );
				$css_id  = sanitize_title_with_dashes( $media ) . '-css-' . md5( $href );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					$style_tag = "<link data-handles='" . esc_attr( implode( ',', $handles ) ) . "' rel='stylesheet' id='$css_id' href='$href' type='text/css' media='$media' />";
				} else {
					$style_tag = "<link rel='stylesheet' id='$css_id' href='$href' type='text/css' media='$media' />";
				}

				/**
				 * Filter the style loader HTML tag for page optimize.
				 *
				 * @param string $style_tag style loader tag
				 * @param array $handles handles of CSS files
				 * @param string $href link to CSS file
				 * @param string $media media attribute of the link.
				 *
				 * @since   1.0.0
				 */
				$style_tag = apply_filters( 'page_optimize_style_loader_tag', $style_tag, $handles, $href, $media );

				/**
				 * Filter the stylesheet tag. For example: making it deferred when using Critical CSS.
				 *
				 * @param string $style_tag stylesheet tag
				 * @param array $handles handles of CSS files
				 * @param string $href link to CSS file
				 * @param string $media media attribute of the link.
				 *
				 * @since   1.0.0
				 */
				$style_tag = apply_filters( 'style_loader_tag', $style_tag, implode( ',', $handles ), $href, $media );

				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $style_tag . "\n";

				array_map( array( $this, 'print_inline_style' ), array_keys( $css ) );
			}
		}

		return $this->done;
	}

	public function __isset( $key ) {
		return isset( $this->old_styles->$key );
	}

	public function __unset( $key ) {
		unset( $this->old_styles->$key );
	}

	public function &__get( $key ) {
		return $this->old_styles->$key;
	}

	public function __set( $key, $value ) {
		$this->old_styles->$key = $value;
	}
}
