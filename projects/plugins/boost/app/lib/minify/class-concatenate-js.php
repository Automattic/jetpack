<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

use WP_Scripts;

// Disable complaints about enqueuing scripts, as this class alters the way enqueuing them works.
// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript

/**
 * Replacement for, and subclass of WP_Scripts - used to control the way that scripts are enqueued and output.
 */
class Concatenate_JS extends WP_Scripts {
	private $dependency_path_mapping;
	private $old_scripts;

	public $allow_gzip_compression;

	public function __construct( $scripts ) {
		if ( empty( $scripts ) || ! ( $scripts instanceof WP_Scripts ) ) {
			$this->old_scripts = new WP_Scripts();
		} else {
			$this->old_scripts = $scripts;
		}

		// Unset all the object properties except our private copy of the scripts object.
		// We have to unset everything so that the overload methods talk to $this->old_scripts->whatever
		// instead of $this->whatever.
		foreach ( array_keys( get_object_vars( $this ) ) as $key ) {
			if ( 'old_scripts' === $key ) {
				continue;
			}
			unset( $this->$key );
		}

		$this->dependency_path_mapping = new Dependency_Path_Mapping(
			/**
			 * Filter the URL of the site the plugin will be concatenating CSS or JS on
			 *
			 * @param bool $url URL of the page with CSS or JS to concatonate.
			 *
			 * @since   1.0.0
			 */
			apply_filters( 'page_optimize_site_url', $this->base_url )
		);
	}

	protected function has_inline_content( $handle ) {
		$before_output = $this->get_data( $handle, 'before' );
		if ( ! empty( $before_output ) ) {
			return true;
		}

		$after_output = $this->get_data( $handle, 'after' );
		if ( ! empty( $after_output ) ) {
			return true;
		}

		// JavaScript translations
		$has_translations = ! empty( $this->registered[ $handle ]->textdomain );
		if ( $has_translations ) {
			return true;
		}

		return false;
	}

	/**
	 * Override for WP_Scripts::do_item() - this is the method that actually outputs the scripts.
	 */
	public function do_items( $handles = false, $group = false ) {
		$handles     = false === $handles ? $this->queue : (array) $handles;
		$javascripts = array();
		/**
		 * Filter the URL of the site the plugin will be concatenating CSS or JS on
		 *
		 * @param bool $url URL of the page with CSS or JS to concatonate.
		 *
		 * @since   1.0.0
		 */
		$siteurl = apply_filters( 'page_optimize_site_url', $this->base_url );
		$this->all_deps( $handles );
		$level = 0;

		$using_strict = false;
		foreach ( $this->to_do as $key => $handle ) {
			$script_is_strict = false;
			if ( in_array( $handle, $this->done, true ) || ! isset( $this->registered[ $handle ] ) ) {
				continue;
			}

			if ( 0 === $group && $this->groups[ $handle ] > 0 ) {
				$this->in_footer[] = $handle;
				unset( $this->to_do[ $key ] );
				continue;
			}

			if ( ! $this->registered[ $handle ]->src ) { // Defines a group.
				if ( $this->has_inline_content( $handle ) ) {
					++$level;
					$javascripts[ $level ]['type']   = 'do_item';
					$javascripts[ $level ]['handle'] = $handle;
					++$level;
					unset( $this->to_do[ $key ] );
				} else {
					// if there are localized items, echo them
					$this->print_extra_script( $handle );
					$this->done[] = $handle;
				}
				continue;
			}

			if ( false === $group && in_array( $handle, $this->in_footer, true ) ) {
				$this->in_footer = array_diff( $this->in_footer, (array) $handle );
			}

			$obj           = $this->registered[ $handle ];
			$js_url        = jetpack_boost_enqueued_to_absolute_url( $obj->src );
			$js_url_parsed = wp_parse_url( $js_url );

			// Don't concat by default
			$do_concat = false;

			// Only try to concat static js files
			if ( str_contains( $js_url_parsed['path'], '.js' ) ) {
				// Previously, the value of this variable was determined by a function.
				// Now, since concatenation is always enabled when the module is active,
				// the value will always be true for static files.
				$do_concat = true;
			} elseif ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Maybe Not Static File %s -->\n", esc_html( $handle ), esc_html( $obj->src ) );
			}

			// Don't try to concat externally hosted scripts
			$is_internal_uri = $this->dependency_path_mapping->is_internal_uri( $js_url );
			if ( $do_concat && ! $is_internal_uri ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => External URL: %s -->\n", esc_html( $handle ), esc_url( $js_url ) );
				}
				$do_concat = false;
			}

			if ( $do_concat ) {
				// Resolve paths and concat scripts that exist in the filesystem
				$js_realpath = $this->dependency_path_mapping->dependency_src_to_fs_path( $js_url );
				if ( false === $js_realpath ) {
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						printf( "\n<!-- No Concat JS %s => Invalid Path %s -->\n", esc_html( $handle ), esc_html( $js_realpath ) );
					}
					$do_concat = false;
				}
			}

			if ( $do_concat && $this->has_inline_content( $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Has Inline Content -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Skip core scripts that use Strict Mode
			if ( $do_concat && ( 'react' === $handle || 'react-dom' === $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Has Strict Mode (Core) -->\n", esc_html( $handle ) );
				}
				$do_concat        = false;
				$script_is_strict = true;
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			} elseif ( $do_concat && preg_match_all( '/^[\',"]use strict[\',"];/Uims', file_get_contents( $js_realpath ), $matches ) ) {
				// Skip third-party scripts that use Strict Mode
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Has Strict Mode (Third-Party) -->\n", esc_html( $handle ) );
				}
				$do_concat        = false;
				$script_is_strict = true;
			} else {
				$script_is_strict = false;
			}

			// Skip concating scripts from exclusion list
			$exclude_list = jetpack_boost_page_optimize_js_exclude_list();
			foreach ( $exclude_list as $exclude ) {
				if ( $do_concat && $handle === $exclude ) {
					$do_concat = false;
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						printf( "\n<!-- No Concat JS %s => Excluded option -->\n", esc_html( $handle ) );
					}
				}
			}

			/** This filter is documented in wp-includes/class-wp-scripts.php */
			$js_url = esc_url_raw( apply_filters( 'script_loader_src', $js_url, $handle ) );
			if ( ! $js_url ) {
				$do_concat = false;
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => No URL -->\n", esc_html( $handle ) );
				}
			} elseif ( 'module' === $this->get_script_type( $handle, $js_url ) ) {
				$do_concat = false;
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Module Script -->\n", esc_html( $handle ) );
				}
			}

			/**
			 * Filter that allows plugins to disable concatenation of certain scripts.
			 *
			 * @param bool $do_concat if true, then perform concatenation
			 * @param string $handle handle to JS file
			 *
			 * @since   1.0.0
			 */
			if ( $do_concat && ! apply_filters( 'js_do_concat', $do_concat, $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					printf( "\n<!-- No Concat JS %s => Filtered `false` -->\n", esc_html( $handle ) );
				}
			}
			/**
			 * Filter that allows plugins to disable concatenation of certain scripts.
			 *
			 * @param bool $do_concat if true, then perform concatenation
			 * @param string $handle handle to JS file
			 *
			 * @since   1.0.0
			 */
			$do_concat = apply_filters( 'js_do_concat', $do_concat, $handle );

			if ( true === $do_concat ) {

				// If the number of files in the group is greater than the maximum, start a new group.
				if ( isset( $javascripts[ $level ] ) && count( $javascripts[ $level ]['handles'] ) >= jetpack_boost_minify_concat_max_files() ) {
					++$level;
				}

				if ( ! isset( $javascripts[ $level ] ) ) {
					$javascripts[ $level ]['type'] = 'concat';
				}

				$javascripts[ $level ]['paths'][]   = $js_url_parsed['path'];
				$javascripts[ $level ]['handles'][] = $handle;

			} else {
				++$level;
				$javascripts[ $level ]['type']   = 'do_item';
				$javascripts[ $level ]['handle'] = $handle;
				++$level;
			}
			unset( $this->to_do[ $key ] );

			if ( $using_strict !== $script_is_strict ) {
				if ( $script_is_strict ) {
					$using_strict = true;
					$strict_count = 0;
				} else {
					$using_strict = false;
				}
			}

			if ( $script_is_strict ) {
				++$strict_count;
			}
		}

		if ( empty( $javascripts ) ) {
			return $this->done;
		}

		foreach ( $javascripts as $js_array ) {
			if ( 'do_item' === $js_array['type'] ) {
				if ( $this->do_item( $js_array['handle'], $group ) ) {
					$this->done[] = $js_array['handle'];
				}
			} elseif ( 'concat' === $js_array['type'] ) {
				array_map( array( $this, 'print_extra_script' ), $js_array['handles'] );

				if ( isset( $js_array['paths'] ) && count( $js_array['paths'] ) > 1 ) {
					$file_name = jetpack_boost_page_optimize_generate_concat_path( $js_array['paths'], $this->dependency_path_mapping );

					if ( get_site_option( 'jetpack_boost_static_minification' ) ) {
						$href = jetpack_boost_get_minify_url( $file_name . '.min.js' );
					} else {
						$href = $siteurl . jetpack_boost_get_static_prefix() . '??' . $file_name;
					}
				} elseif ( isset( $js_array['paths'] ) && is_array( $js_array['paths'] ) ) {
					$href = jetpack_boost_page_optimize_cache_bust_mtime( $js_array['paths'][0], $siteurl );
				}

				$this->done = array_merge( $this->done, $js_array['handles'] );

				// Print before/after scripts from wp_inline_scripts() and concatenated script tag
				if ( isset( $js_array['extras']['before'] ) ) {
					foreach ( $js_array['extras']['before'] as $inline_before ) {
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo $inline_before;
					}
				}

				if ( isset( $href ) ) {
					$handles = implode( ',', $js_array['handles'] );

					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						$tag = "<script data-handles='" . esc_attr( $handles ) . "' type='text/javascript' src='" . esc_url( $href ) . "'></script>\n";
					} else {
						$tag = "<script type='text/javascript' src='" . esc_url( $href ) . "'></script>\n";
					}

					if ( is_array( $js_array['handles'] ) && count( $js_array['handles'] ) === 1 ) {
						/**
						 * Filters the HTML script tag of an enqueued script
						 * A copy of the core filter of the same name. https://developer.wordpress.org/reference/hooks/script_loader_tag/
						 * Because we have a single script, let's apply the `script_loader_tag` filter as core does in `do_item()`.
						 * That way, we interfere less with plugin and theme script filtering. For example, without this filter,
						 * there is a case where we block the TwentyTwenty theme from adding async/defer attributes.
						 * https://github.com/Automattic/page-optimize/pull/44
						 *
						 * @param string $tag Script tag for the enqueued script.
						 * @param string $handle The script's registered handle.
						 * @param string $href URL of the script.
						 *
						 * @since   1.0.0
						 */
						$tag = apply_filters( 'script_loader_tag', $tag, $js_array['handles'][0], $href );
					}

					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					echo $tag;
				}

				if ( isset( $js_array['extras']['after'] ) ) {
					foreach ( $js_array['extras']['after'] as $inline_after ) {
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo $inline_after;
					}
				}
			}
		}

		do_action( 'js_concat_did_items', $javascripts );

		return $this->done;
	}

	/**
	 * Returns the type of the script.
	 * module, text/javascript, etc. False if the script tag is invalid,
	 * or the type is not set.
	 *
	 * @since 4.1.2
	 *
	 * @param string $handle The script's registered handle.
	 * @param string $src The script's source URL.
	 *
	 * @return string|false The type of the script. False if the script tag is invalid,
	 * or the type is not set.
	 */
	private function get_script_type( $handle, $src ) {
		$script_tag_attr = array(
			'src' => $src,
			'id'  => "$handle-js",
		);

		// Get the script tag and allow plugins to filter it.
		$script_tag = wp_get_script_tag( $script_tag_attr );

		// This is a workaround to get the type of the script without outputting it.
		$script_tag = apply_filters( 'script_loader_tag', $script_tag, $handle, $src );
		$processor  = new \WP_HTML_Tag_Processor( $script_tag );

		// If for some reason the script tag isn't valid, bail.
		if ( ! $processor->next_tag() ) {
			return false;
		}

		return $processor->get_attribute( 'type' );
	}

	public function __isset( $key ) {
		return isset( $this->old_scripts->$key );
	}

	public function __unset( $key ) {
		unset( $this->old_scripts->$key );
	}

	public function &__get( $key ) {
		return $this->old_scripts->$key;
	}

	public function __set( $key, $value ) {
		$this->old_scripts->$key = $value;
	}
}
