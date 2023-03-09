<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use WP_Styles;

// Disable complaints about enqueuing stylesheets, as this class alters the way enqueuing them works.
// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet

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
			apply_filters( 'page_optimize_site_url', $this->base_url )
		);
	}

	public function do_items( $handles = false, $group = false ) {
		$handles     = false === $handles ? $this->queue : (array) $handles;
		$stylesheets = array();
		$siteurl     = apply_filters( 'page_optimize_site_url', $this->base_url );

		$this->all_deps( $handles );

		$stylesheet_group_index = 0;
		// Merge CSS into a single file
		$concat_group = 'concat';
		// Concat group on top (first array element gets processed earlier)
		$stylesheets[ $concat_group ] = array();

		foreach ( $this->to_do as $key => $handle ) {
			$obj      = $this->registered[ $handle ];
			$obj->src = apply_filters( 'style_loader_src', $obj->src, $obj->handle );

			// Core is kind of broken and returns "true" for src of "colors" handle
			// http://core.trac.wordpress.org/attachment/ticket/16827/colors-hacked-fixed.diff
			// http://core.trac.wordpress.org/ticket/20729
			$css_url = $obj->src;
			if ( 'colors' === $obj->handle && true === $css_url ) {
				$css_url = wp_style_loader_src( $css_url, $obj->handle );
			}

			$css_url_parsed = wp_parse_url( $obj->src );
			$extra          = $obj->extra;

			// Don't concat by default
			$do_concat = false;

			// Only try to concat static css files
			if ( false !== strpos( $css_url_parsed['path'], '.css' ) ) {
				$do_concat = true;
			} elseif ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat CSS %s => Maybe Not Static File %s -->\n", esc_html( $handle ), esc_html( $obj->src ) );
			}

			// Don't try to concat styles which are loaded conditionally (like IE stuff)
			if ( isset( $extra['conditional'] ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat CSS %s => Has Conditional -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Don't concat rtl stuff for now until concat supports it correctly
			if ( $do_concat && 'rtl' === $this->text_direction && ! empty( $extra['rtl'] ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat CSS %s => Is RTL -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Don't try to concat externally hosted scripts
			$is_internal_uri = $this->dependency_path_mapping->is_internal_uri( $css_url );
			if ( $do_concat && ! $is_internal_uri ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat CSS %s => External URL: %s -->\n", esc_html( $handle ), esc_url( $css_url ) );
				}
				$do_concat = false;
			}

			if ( $do_concat ) {
				// Resolve paths and concat styles that exist in the filesystem
				$css_realpath = $this->dependency_path_mapping->dependency_src_to_fs_path( $css_url );
				if ( false === $css_realpath ) {
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						echo sprintf( "\n<!-- No Concat CSS %s => Invalid Path %s -->\n", esc_html( $handle ), esc_html( $css_realpath ) );
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
						echo sprintf( "\n<!-- No Concat CSS %s => Excluded option -->\n", esc_html( $handle ) );
					}
				}
			}

			// Allow plugins to disable concatenation of certain stylesheets.
			if ( $do_concat && ! apply_filters( 'css_do_concat', $do_concat, $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat CSS %s => Filtered `false` -->\n", esc_html( $handle ) );
				}
			}
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
					$fs_paths = array();
					foreach ( $css as $css_uri_path ) {
						$fs_paths[] = $this->dependency_path_mapping->uri_path_to_fs_path( $css_uri_path );
					}

					$mtime = max( array_map( 'filemtime', $fs_paths ) );
					if ( jetpack_boost_page_optimize_use_concat_base_dir() ) {
						$path_str = implode( ',', array_map( 'jetpack_boost_page_optimize_remove_concat_base_prefix', $fs_paths ) );
					} else {
						$path_str = implode( ',', $css );
					}
					$path_str = "$path_str?m=$mtime";

					if ( $this->allow_gzip_compression ) {
						// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
						$path_64 = base64_encode( gzcompress( $path_str ) );
						if ( strlen( $path_str ) > ( strlen( $path_64 ) + 1 ) ) {
							$path_str = '-' . $path_64;
						}
					}

					$href = $siteurl . '/_static/??' . $path_str;
				} else {
					$href = jetpack_boost_page_optimize_cache_bust_mtime( current( $css ), $siteurl );
				}

				$handles = array_keys( $css );
				$css_id  = "$media-css-" . md5( $href );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					$style_tag = "<link data-handles='" . esc_attr( implode( ',', $handles ) ) . "' rel='stylesheet' id='$css_id' href='$href' type='text/css' media='$media' />";
				} else {
					$style_tag = "<link rel='stylesheet' id='$css_id' href='$href' type='text/css' media='$media' />";
				}

				$style_tag = apply_filters( 'page_optimize_style_loader_tag', $style_tag, $handles, $href, $media );
				$style_tag = apply_filters( 'style_loader_tag', $style_tag, $handles, $href, $media );

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
