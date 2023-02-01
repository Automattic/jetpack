<?php

require_once __DIR__ . '/dependency-path-mapping.php';
require_once __DIR__ . '/utils.php';

if ( ! defined( 'ALLOW_GZIP_COMPRESSION' ) ) {
	define( 'ALLOW_GZIP_COMPRESSION', true );
}

class Page_Optimize_JS_Concat extends WP_Scripts {
	private $dependency_path_mapping;
	private $old_scripts;

	public $allow_gzip_compression;

	function __construct( $scripts ) {
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

		$this->dependency_path_mapping = new Page_Optimize_Dependency_Path_Mapping(
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

	function do_items( $handles = false, $group = false ) {
		$handles = false === $handles ? $this->queue : (array) $handles;
		$javascripts = array();
		$siteurl = apply_filters( 'page_optimize_site_url', $this->base_url );
		$this->all_deps( $handles );
		$level = 0;

		$using_strict = false;
		foreach ( $this->to_do as $key => $handle ) {
			$script_is_strict = false;
			if ( in_array( $handle, $this->done ) || ! isset( $this->registered[ $handle ] ) ) {
				continue;
			}

			if ( 0 === $group && $this->groups[ $handle ] > 0 ) {
				$this->in_footer[] = $handle;
				unset( $this->to_do[ $key ] );
				continue;
			}

			if ( ! $this->registered[ $handle ]->src ) { // Defines a group.
				// if there are localized items, echo them
				$this->print_extra_script( $handle );
				$this->done[] = $handle;
				continue;
			}

			if ( false === $group && in_array( $handle, $this->in_footer, true ) ) {
				$this->in_footer = array_diff( $this->in_footer, (array) $handle );
			}

			$obj = $this->registered[ $handle ];
			$js_url = $obj->src;
			$js_url_parsed = parse_url( $js_url );

			// Don't concat by default
			$do_concat = false;

			// Only try to concat static js files
			if ( false !== strpos( $js_url_parsed['path'], '.js' ) ) {
				$do_concat = page_optimize_should_concat_js();
			} else {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => Maybe Not Static File %s -->\n", esc_html( $handle ), esc_html( $obj->src ) );
				}
			}

			// Don't try to concat externally hosted scripts
			$is_internal_uri = $this->dependency_path_mapping->is_internal_uri( $js_url );
			if ( $do_concat && ! $is_internal_uri ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => External URL: %s -->\n", esc_html( $handle ), esc_url( $js_url ) );
				}
				$do_concat = false;
			}

			if ( $do_concat ) {
				// Resolve paths and concat scripts that exist in the filesystem
				$js_realpath = $this->dependency_path_mapping->dependency_src_to_fs_path( $js_url );
				if ( false === $js_realpath ) {
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						echo sprintf( "\n<!-- No Concat JS %s => Invalid Path %s -->\n", esc_html( $handle ), esc_html( $js_realpath ) );
					}
					$do_concat = false;
				}
			}

			if ( $do_concat && $this->has_inline_content( $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => Has Inline Content -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
			}

			// Skip core scripts that use Strict Mode
			if ( $do_concat && ( 'react' === $handle || 'react-dom' === $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => Has Strict Mode (Core) -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
				$script_is_strict = true;
			} else if ( $do_concat && preg_match_all( '/^[\',"]use strict[\',"];/Uims', file_get_contents( $js_realpath ), $matches ) ) {
				// Skip third-party scripts that use Strict Mode
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => Has Strict Mode (Third-Party) -->\n", esc_html( $handle ) );
				}
				$do_concat = false;
				$script_is_strict = true;
			} else {
				$script_is_strict = false;
			}

			// Skip concating scripts from exclusion list
			$exclude_list = page_optimize_js_exclude_list();
			foreach ( $exclude_list as $exclude ) {
				if ( $do_concat && $handle === $exclude ) {
					$do_concat = false;
					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						echo sprintf( "\n<!-- No Concat JS %s => Excluded option -->\n", esc_html( $handle ) );
					}
				}
			}

			// Allow plugins to disable concatenation of certain scripts.
			if ( $do_concat && ! apply_filters( 'js_do_concat', $do_concat, $handle ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					echo sprintf( "\n<!-- No Concat JS %s => Filtered `false` -->\n", esc_html( $handle ) );
				}
			}
			$do_concat = apply_filters( 'js_do_concat', $do_concat, $handle );

			if ( true === $do_concat ) {
				if ( ! isset( $javascripts[ $level ] ) ) {
					$javascripts[ $level ]['type'] = 'concat';
				}

				$javascripts[ $level ]['paths'][] = $js_url_parsed['path'];
				$javascripts[ $level ]['handles'][] = $handle;

			} else {
				$level ++;
				$javascripts[ $level ]['type'] = 'do_item';
				$javascripts[ $level ]['handle'] = $handle;
				$level ++;
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
				$strict_count ++;
			}
		}

		if ( empty( $javascripts ) ) {
			return $this->done;
		}

		foreach ( $javascripts as $js_array ) {
			if ( 'do_item' == $js_array['type'] ) {
				if ( $this->do_item( $js_array['handle'], $group ) ) {
					$this->done[] = $js_array['handle'];
				}
			} else if ( 'concat' == $js_array['type'] ) {
				array_map( array( $this, 'print_extra_script' ), $js_array['handles'] );

				if ( isset( $js_array['paths'] ) && count( $js_array['paths'] ) > 1 ) {
					$fs_paths = array();
					foreach ( $js_array['paths'] as $js_url ) {
						$fs_paths[] = $this->dependency_path_mapping->uri_path_to_fs_path( $js_url );
					}

					$mtime = max( array_map( 'filemtime', $fs_paths ) );
					if ( page_optimize_use_concat_base_dir() ) {
						$path_str = implode( ',', array_map( 'page_optimize_remove_concat_base_prefix', $fs_paths ) );
					} else {
						$path_str = implode( ',', $js_array['paths'] );
					}
					$path_str = "$path_str?m=$mtime";

					if ( $this->allow_gzip_compression ) {
						$path_64 = base64_encode( gzcompress( $path_str ) );
						if ( strlen( $path_str ) > ( strlen( $path_64 ) + 1 ) ) {
							$path_str = '-' . $path_64;
						}
					}

					$href = $siteurl . "/_static/??" . $path_str;
				} elseif ( isset( $js_array['paths'] ) && is_array( $js_array['paths'] ) ) {
					$href = Page_Optimize_Utils::cache_bust_mtime( $js_array['paths'][0], $siteurl );
				}

				$this->done = array_merge( $this->done, $js_array['handles'] );

				// Print before/after scripts from wp_inline_scripts() and concatenated script tag
				if ( isset( $js_array['extras']['before'] ) ) {
					foreach ( $js_array['extras']['before'] as $inline_before ) {
						echo $inline_before;
					}
				}

				if ( isset( $href ) ) {
					$handles = implode( ',', $js_array['handles'] );

					$load_mode = page_optimize_load_mode_js();

					if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
						$tag = "<script data-handles='" . esc_attr( $handles ) . "' $load_mode type='text/javascript' src='$href'></script>\n";
					} else {
						$tag = "<script type='text/javascript' $load_mode src='$href'></script>\n";
					}

					if ( is_array( $js_array['handles'] ) && count( $js_array['handles'] ) === 1 ) {
						// Because we have a single script, let's apply the `script_loader_tag` filter as core does in `do_item()`.
						// That way, we interfere less with plugin and theme script filtering. For example, without this filter,
						// there is a case where we block the TwentyTwenty theme from adding async/defer attributes.
						// https://github.com/Automattic/page-optimize/pull/44
						$tag = apply_filters( 'script_loader_tag', $tag, $js_array['handles'][0], $href );
					}

					echo $tag;
				}

				if ( isset( $js_array['extras']['after'] ) ) {
					foreach ( $js_array['extras']['after'] as $inline_after ) {
						echo $inline_after;
					}
				}
			}
		}

		do_action( 'js_concat_did_items', $javascripts );

		return $this->done;
	}

	function __isset( $key ) {
		return isset( $this->old_scripts->$key );
	}

	function __unset( $key ) {
		unset( $this->old_scripts->$key );
	}

	function &__get( $key ) {
		return $this->old_scripts->$key;
	}

	function __set( $key, $value ) {
		$this->old_scripts->$key = $value;
	}
}

function page_optimize_js_concat_init() {
	global $wp_scripts;

	$wp_scripts = new Page_Optimize_JS_Concat( $wp_scripts );
	$wp_scripts->allow_gzip_compression = ALLOW_GZIP_COMPRESSION;
}

if ( ! is_admin() && ( page_optimize_should_concat_js() || page_optimize_load_mode_js() ) ) {
	add_action( 'init', 'page_optimize_js_concat_init' );
}
