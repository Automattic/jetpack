<?php
/**
 * WPCOM Enqueue Dynamic Script
 *
 * @see ./README.md
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Class WPCOM_Enqueue_Dynamic_Script
 */
class WPCOM_Enqueue_Dynamic_Script {
	/**
	 * Enqueued scripts that are candidates for dynamic loading.
	 *
	 * @var string[]
	 */
	private static $dynamic_scripts = array();

	/**
	 * Whether the init method has been called.
	 *
	 * @var bool
	 */
	private static $init_done = false;

	/**
	 * Add the JS orchestration script to the footer.
	 */
	public static function init() {
		add_action( 'wp_footer', array( 'WPCOM_Enqueue_Dynamic_Script', 'inject_loader_scripts' ), 99999 );
	}

	/**
	 * Add the JS orchestration script to the footer for wp-admin pages.
	 */
	public static function init_admin() {
		add_action( 'admin_footer', array( 'WPCOM_Enqueue_Dynamic_Script', 'inject_loader_scripts' ), 99999 );
	}

	/**
	 * Enqueue a script for dynamic loading.
	 * Adds registered scripts to dynamic handler and inject JS orchestration script to the footer.
	 *
	 * @param string $handle The registered handle for the script.
	 */
	public static function enqueue_script( $handle ) {
		$wp_scripts = wp_scripts();

		if ( ! self::$init_done ) {
			self::$init_done = true;
			if ( is_admin() ) {
				self::init_admin();
			} else {
				self::init();
			}
		}

		if ( empty( $wp_scripts->registered[ $handle ] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			wp_trigger_error( 'WPCOM_Enqueue_Dynamic_Script::enqueue_script', "unknown script '{$handle}'.", E_USER_WARNING );
			return false;
		}

		self::$dynamic_scripts[] = $handle;
	}

	/**
	 * Dequeue a script that was previously enqueued for dynamic loading.
	 *
	 * @param string $handle The registered handle for the script.
	 */
	public static function dequeue_script( $handle ) {
		$index = array_search( $handle, self::$dynamic_scripts, true );

		if ( false !== $index ) {
			unset( self::$dynamic_scripts[ $index ] );

			// Re-index the array
			self::$dynamic_scripts = array_values( self::$dynamic_scripts );
		}
	}

	/**
	 * Reset the state of the class and remove the JS control scripts.
	 */
	public static function reset() {
		self::$dynamic_scripts = array();
		self::$init_done       = false;
		remove_action( 'wp_footer', array( 'WPCOM_Enqueue_Dynamic_Script', 'inject_loader_scripts' ), 99999 );
		remove_action( 'admin_footer', array( 'WPCOM_Enqueue_Dynamic_Script', 'inject_loader_scripts' ), 99999 );
	}

	/**
	 * Check if a script is already enqueued statically.
	 *
	 * @param string $handle The handle for the script.
	 */
	public static function is_statically_enqueued( $handle ) {
		$wp_scripts = wp_scripts();

		return $wp_scripts->query( $handle, 'enqueued' ) ||
			$wp_scripts->query( $handle, 'to_do' ) ||
			$wp_scripts->query( $handle, 'done' );
	}

	/**
	 * Get a list of scripts ordered based on their dependencies.
	 *
	 * @param string[] $handles The registered handles for the scripts.
	 *
	 * @return array
	 */
	public static function get_ordered_scripts( $handles ) {
		$wp_scripts = wp_scripts();

		$list = array();

		// Handle a script and all its dependencies.
		// This closure calls itself recursively.
		$get_sub_deps = function ( $handle ) use ( &$list, &$wp_scripts, &$get_sub_deps ) {
			$script = $wp_scripts->query( $handle, 'registered' );

			if ( empty( $script ) ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				wp_trigger_error( 'WPCOM_Enqueue_Dynamic_Script::get_ordered_scripts', "unknown script '{$handle}'.", E_USER_WARNING );
				return;
			}

			if ( ! empty( $list[ $handle ] ) ) {
				// This script is already added to the list; skip processing it again.
				return;
			}

			if ( self::is_statically_enqueued( $handle ) ) {
				// Top-level script that's already statically enqueued.
				// Treat it as having no dependencies and move on.
				$list[ $handle ] = array();
				return;
			}

			$deps          = array();
			$filtered_deps = array();

			// Process script dependencies first.
			if ( ! empty( $script->deps ) ) {
				$deps = $script->deps;
			}

			foreach ( $deps as $dep ) {
				// Skip dependencies that are already statically enqueued, and remove them from the
				// dependency list for the script.
				if ( ! self::is_statically_enqueued( $dep ) ) {
					$get_sub_deps( $dep );
					$filtered_deps[] = $dep;
				}
			}

			// If by this point the script is still not in the list, add it.
			if ( empty( $list[ $handle ] ) ) {
				$list[ $handle ] = $filtered_deps;
			}
		};

		// Handle all registered top-level scripts.
		foreach ( $handles as $handle ) {
			$get_sub_deps( $handle );
		}

		return $list;
	}

	/**
	 * Output the HTML for an inline script.
	 *
	 * @param string $parent The handle for the parent script.
	 * @param string $position The position for the inline script; 'before' or 'after' the parent.
	 * @param int    $index The (1-based) index for the script, within a given position.
	 * @param string $code The JS code to be placed inside the script tag.
	 */
	public static function output_inline_script( $parent, $position, $index, $code ) {
		$out = "\n<script type='disabled' id='wp-enqueue-dynamic-script:{$parent}:{$position}:{$index}'>\n$code\n</script>\n";
		echo $out; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Get the URL for a script, including version arg and extra args.
	 *
	 * @param _WP_Dependency $script The script to get the URL for.
	 */
	public static function get_script_url( $script ) {
		$src    = $script->src;
		$handle = $script->handle;

		if ( empty( $src ) ) {
			return '';
		}

		$wp_scripts = wp_scripts();

		// Handle version URL argument.
		$ver = $script->ver;
		if ( null === $ver ) {
			$ver = '';
		} else {
			$ver = $ver ? $ver : $wp_scripts->default_version;
		}

		// Handle top-level script that's statically enqueued.
		// Return an empty src, so that it's treated as a dummy script, thus resolving immediately on
		// the client.
		if ( self::is_statically_enqueued( $handle ) ) {
			return '';
		}

		// Handle extra URL arguments.
		if ( isset( $wp_scripts->args[ $handle ] ) ) {
			$ver = $ver ? $ver . '&' . $wp_scripts->args[ $handle ] : $wp_scripts->args[ $handle ];
		}

		// Replace relative URLs with absolute ones.
		if ( ! preg_match( '|^(https?:)?//|', $src ) && ! ( $wp_scripts->content_url && 0 === strpos( $src, $wp_scripts->content_url ) ) ) {
			$src = $wp_scripts->base_url . $src;
		}

		if ( ! empty( $ver ) ) {
			$src = add_query_arg( 'ver', $ver, $src );
		}

		// Apply any existing filters to URL before returning.
		$src = apply_filters( 'script_loader_src', $src, $handle );
		return $src;
	}

	/**
	 * Generate and inject the loading orchestration JS into the HTML.
	 * The generated JS embeds all of the necessary information to load the registered scripts, their
	 * transitive dependencies, and extra inline scripts ('before' / 'after' scripts) at runtime.
	 */
	public static function inject_loader_scripts() {
		if ( empty( self::$dynamic_scripts ) ) {
			return;
		}

		$script_data = self::build_script_data();
		self::output_inline_scripts( $script_data );
		$loading_code = self::get_loading_orchestration_scripts( $script_data );
		echo "\n<script>\n$loading_code\n</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Build the data structure that will be used by the loading orchestration script.
	 */
	public static function build_script_data() {
		if ( empty( self::$dynamic_scripts ) ) {
			return;
		}

		$wp_scripts = wp_scripts();

		$all_scripts = self::get_ordered_scripts( self::$dynamic_scripts );
		$script_data = array(
			'urls'   => array(),
			'extras' => array(),
			'loader' => array(),
		);

		// Start by determining the location of each script, and which of them include extra inline
		// scripts ('before' / 'after' scripts).
		foreach ( $all_scripts as $handle => $deps ) {
			$script = $wp_scripts->registered[ $handle ];

			$src                            = self::get_script_url( $script );
			$script_data['urls'][ $handle ] = $src;

			$extras = array(
				'translations' => array(),
				'before'       => array(),
				'after'        => array(),
			);

			// Is this a statically-enqueued top level script?
			// If so, it shouldn't have any extras, because they've already been handled statically.
			if ( in_array( $handle, self::$dynamic_scripts, true ) && self::is_statically_enqueued( $handle ) ) {
				$script_data['extras'][ $handle ] = $extras;
				continue;
			}

			// Aux function to be used as a filter for empty items.
			$filter_empty = function ( $x ) {
				return ! empty( $x );
			};

			// Handle 'before' scripts.
			if ( ! empty( $script->extra['before'] ) ) {
				$extras['before'] = array_values( array_filter( $script->extra['before'], $filter_empty ) );
			}

			// Handle 'after' scripts.
			if ( ! empty( $script->extra['after'] ) ) {
				$extras['after'] = array_values( array_filter( $script->extra['after'], $filter_empty ) );
			}

			// Handle 'translations' scripts.
			$translations = $wp_scripts->print_translations( $handle, false );
			if ( isset( $script->textdomain ) && $translations ) {
				$extras['translations'] = array( $translations );
			}

			$script_data['extras'][ $handle ] = $extras;
		}

		// Determine the loading sequence for each top-level (enqueued) script.
		foreach ( self::$dynamic_scripts as $top_script ) {
			$script_data['loader'][ $top_script ] = self::get_ordered_scripts( array( $top_script ) );
		}

		return $script_data;
	}

	/**
	 * Output all 'translations', 'before' and 'after' inline scripts as disabled <script> tags.
	 *
	 * The browser won't run these directly; instead, the loading script will look for them and
	 * treat them as templates, copying their contents into newly-instanced script tags at the right
	 * moment. This ensures that they don't execute too early, nor too late.
	 *
	 * @param array $script_data The data structure with the script information.
	 */
	public static function output_inline_scripts( $script_data ) {
		foreach ( $script_data['extras'] as $handle => $positions ) {
			foreach ( $positions as $position => $scripts ) {
				foreach ( $scripts as $index => $script ) {
					self::output_inline_script( $handle, $position, $index + 1, $script );
				}
			}
		}
	}

	/**
	 * Generate the loading orchestration script.
	 *
	 * @param array $script_data The data structure with the script information.
	 */
	public static function get_loading_orchestration_scripts( $script_data ) {
		// Urls.
		$script_url_list = implode(
			",\n\t\t",
			array_map(
				function ( $handle, $url ) {
					return "'{$handle}': '{$url}'";
				},
				array_keys( $script_data['urls'] ),
				$script_data['urls']
			)
		);

		// Extras.
		$extras_meta = '';
		foreach ( $script_data['extras'] as $handle => $positions ) {
			$translations_count = is_countable( $positions['translations'] ) ? count( $positions['translations'] ) : 0;
			$before_count       = is_countable( $positions['before'] ) ? count( $positions['before'] ) : 0;
			$after_count        = is_countable( $positions['after'] ) ? count( $positions['after'] ) : 0;
			if ( $before_count > 0 || $after_count > 0 || $translations_count > 0 ) {
				$extras_meta .= "'{$handle}': { translations: {$translations_count}, before: {$before_count}, after: {$after_count} },\n\t\t";
			}
		}

		// Loaders.
		$loaders = '';
		foreach ( $script_data['loader'] as $handle => $deps_and_top_script ) {
			$loading_code = '';

			/**
			 * First, start a fetch for each script (the top-level script and all of its transitive deps).
			 * The goal here is to place all of the scripts in the cache, so that once we add the <script>
			 * tag they get pulled from cache, rather than rely on the tag itself to download the script.
			 * This helps optimise bandwidth usage and avoid wide waterfalls.
			 *
			 * Note that this means that if the cache is disabled (e.g. when disabling cache in DevTools),
			 * scripts will be fetched twice. Hopefully this is rare in the real world.
			 */

			foreach ( $deps_and_top_script as $script => $deps ) {
				$loading_code .= "fetchExternalScript('{$script}');\n\t\t\t";
			}

			// Next, output the promise chain for each script.
			foreach ( $deps_and_top_script as $script => $deps ) {
				$loading_code .= "promises['{$script}'] = promises['{$script}'] || ";

				if ( empty( $deps ) ) {
					// No dependencies; load directly.
					$loading_code .= "loadWPScript('{$script}');";
				} elseif ( is_countable( $deps ) && 1 === count( $deps ) ) {
					// One dependency; wait for it to load before loading script.
					$dep           = $deps[0];
					$loading_code .= "promises['{$dep}'].then( () => loadWPScript('{$script}') );";
				} else {
					// Multiple dependencies; wait for all of them to load before loading script.
					$dep_list = '';
					foreach ( $deps as $dep ) {
						$dep_list .= "promises['{$dep}'], ";
					}
					$loading_code .= "Promise.all( [ {$dep_list} ] ).then( () => loadWPScript('{$script}') );";
				}

				$loading_code .= "\n\t\t\t";
			}

			// The final step is to return the promise for the top-level script, which will only resolve
			// after everything else has.
			$loading_code .= "return promises['{$handle}'];";
			$loaders      .= "'{$handle}': () => {\n\t\t\t{$loading_code}\n\t\t},\n\t\t";
		}

		/**
		 * Finally, generate the full loading orchestration script.
		 * Here we piece together the various bits we've already generated together with the generic JS
		 * functions that handle the rest.
		 *
		 * Note: we use string concatenation instead of JS templated strings in the below JS, since PHP
		 * gets them confused with its own placeholders (which we do use).
		 */

		$loading_script = <<<JAVASCRIPT
		(function() {
			'use strict';

			const fetches = {};
			const promises = {};
			const urls = {
				$script_url_list
			};
			const loaders = {
				$loaders
			};
			const scriptExtras = {
				$extras_meta
			};

			window.WPCOM_Enqueue_Dynamic_Script = {
				loadScript: (handle) => {
					if (!loaders[handle]) {
						console.error('WPCOM_Enqueue_Dynamic_Script: unregistered script `' + handle + '`.');
					}
					return loaders[handle]();
				}
			};

			function fetchExternalScript(handle) {
				if (!urls[handle]) {
					return Promise.resolve();
				}

				fetches[handle] = fetches[handle] || fetch(urls[handle], { mode: 'no-cors' });
				return fetches[handle];
			}

			function runExtraScript(handle, type, index) {
				const id = 'wp-enqueue-dynamic-script:' + handle + ':' + type + ':' + (index + 1);
				const template = document.getElementById(id);
				if (!template) {
					return Promise.reject();
				}

				const script = document.createElement( 'script' );
				script.innerHTML = template.innerHTML;
				document.body.appendChild( script );
				return Promise.resolve();
			}

			function loadExternalScript(handle) {
				if (!urls[handle]) {
					return Promise.resolve();
				}

				return fetches[handle].then(() => {
					return new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.onload = () => resolve();
						script.onerror = (e) => reject(e);
						script.src = urls[handle];
						document.body.appendChild(script);
					});
				});
			}

			function loadExtra(handle, pos) {
				const count = (scriptExtras[handle] && scriptExtras[handle][pos]) || 0;
				let promise = Promise.resolve();

				for (let i = 0; i < count; i++) {
					promise = promise.then(() => runExtraScript(handle, pos, i));
				}

				return promise;
			}

			function loadWPScript(handle) {
				// Core loads scripts in this order. See: https://github.com/WordPress/WordPress/blob/a59eb9d39c4fcba834b70c9e8dfd64feeec10ba6/wp-includes/class-wp-scripts.php#L428.
				return loadExtra(handle, 'translations')
					.then(() => loadExtra(handle, 'before'))
					.then(() => loadExternalScript(handle))
					.then(() => loadExtra(handle, 'after'));
			}
		} )();
JAVASCRIPT;

		return $loading_script;
	}
}
