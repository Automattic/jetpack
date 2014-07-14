<?php
class WPCOM_JSON_API_Render_Shortcode_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/shortcodes/render -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to post on this blog.', 403 );
		}

		$args = $this->query_args();
		$shortcode = trim( $args['shortcode'] );

		// Quick validation - shortcodes should always be enclosed in brackets []
		if ( ! wp_startswith( $shortcode, '[' ) || ! wp_endswith( $shortcode, ']' ) ) {
			return new WP_Error( 'invalid_shortcode',  'The shortcode parameter must begin and end with square brackets.', 400 );
		}

		// Make sure only one shortcode is being rendered at a time
		$pattern = get_shortcode_regex();
		preg_match_all( "/$pattern/s", $shortcode, $matches );
		if ( count( $matches[0] ) > 1 ) {
			return new WP_Error( 'invalid_shortcode',  'Only one shortcode can be rendered at a time.', 400 );
		}

		/*
		 * Now we need to figure out what scripts and styles to load.
		 * props to o2's o2_Read_API::poll() function for inspiration.
		 *
		 * In short we figure out what scripts load for a "normal" page load by executing wp_head and wp_footer
		 * then we render our shortcode (to both get our result, and to have the shortcode files enqueue their resources)
		 * then we load wp_head and wp_footer again to see what new resources were added
		 * finally we find out the url to the source file and any extra info (like media or init js)
		 */

		global $wp_scripts, $wp_styles;

		// initial scripts & styles (to subtract)
		ob_start();
		wp_head();
		wp_footer();
		ob_end_clean();
		$initial_scripts = $wp_scripts->done;
		$initial_styles = $wp_styles->done;
		
		// actually render the shortcode, get the result, and do the resource loading again so we can subtract..
		ob_start();
		wp_head();
		ob_end_clean();
			$result = do_shortcode( $shortcode );
		ob_start();
		wp_footer();
		ob_end_clean();

		// find the difference (the new resource files)
		$loaded_scripts = array_diff( $wp_scripts->done, $initial_scripts );
		$loaded_styles = array_diff( $wp_styles->done, $initial_styles );

		// if nothing happened, then the shortcode does not exist.
		if ( $shortcode == $result ) {
			return new WP_Error( 'invalid_shortcode',  'The requested shortcode does not exist.', 400 );
		}

		// our output for this endpoint..
		$return['shortcode'] = $shortcode;
		$return['result'] = $result;

		$return = $this->add_assets( $return, $loaded_scripts, $loaded_styles );

		return $return;
	}

	/**
	 * Takes the list of styles and scripts and adds them to the JSON response
	 */
	function add_assets( $return, $loaded_scripts, $loaded_styles ) {
		global $wp_scripts, $wp_styles;
		// scripts first, just cuz
		if ( count( $loaded_scripts ) > 0 ) {
			$scripts = array();
			foreach ( $loaded_scripts as $handle ) {
				if ( !isset( $wp_scripts->registered[ $handle ] ) )
					continue;

				$src = $wp_scripts->registered[ $handle ]->src;

				// attach version and an extra query parameters
				$ver = $this->get_version( $wp_scripts->registered[ $handle ]->ver, $wp_scripts->default_version );
				if ( isset( $wp_scripts->args[ $handle ] ) ) {
					$ver = $ver ? $ver . '&amp;' . $wp_scripts->args[$handle] : $wp_scripts->args[$handle];				
				}
				$src = add_query_arg( 'ver', $ver, $src );

				// add to an aray so we can return all this info
				$scripts[ $handle ] = array(
					'src' => $src,
				);
				$extra = $wp_scripts->print_extra_script( $handle, false );
				if ( !empty( $extra ) ) {
					$scripts[$handle]['extra'] = $extra;
				}
			}
			$return['scripts'] = $scripts;
		}
		// now styles
		if ( count( $loaded_styles ) > 0 ) {
			$styles = array();
			foreach ( $loaded_styles as $handle ) {
				if ( !isset( $wp_styles->registered[ $handle ] ) )
					continue;

				$src = $wp_styles->registered[ $handle ]->src;

				// attach version and an extra query parameters
				$ver = $this->get_version( $wp_styles->registered[ $handle ]->ver, $wp_styles->default_version );
				if ( isset( $wp_styles->args[ $handle ] ) ) {
					$ver = $ver ? $ver . '&amp;' . $wp_styles->args[$handle] : $wp_styles->args[$handle];
				}
				$src = add_query_arg( 'ver', $ver, $src );

				// is there a special media (print, screen, etc) for this? if not, default to 'all'
				$media = 'all';
				if ( isset( $wp_styles->registered[ $handle ]->args ) ) {
					$media = esc_attr( $wp_styles->registered[ $handle ]->args );
				}

				// add to an aray so we can return all this info
				$styles[ $handle ] = array (
					'src' => $src,
					'media' => $media,
				);
			}

			$return['styles'] = $styles;
		}

		return $return;
	}

	/**
	 * Returns the 'version' string set by the shortcode so different versions of scripts/styles can be loaded
	 */
	function get_version( $this_scripts_version, $default_version ) {
		if ( null === $this_scripts_version ) {
			$ver = '';
		} else {
			$ver = $this_scripts_version ? $this_scripts_version : $default_version;
		}
		return $ver;
	}
}
