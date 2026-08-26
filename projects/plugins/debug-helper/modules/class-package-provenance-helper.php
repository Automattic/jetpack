<?php
/**
 * Package Provenance helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Shows which runtime serves each WordPress package on the current screen.
 *
 * Every admin page gets an admin-bar badge (WP + Gutenberg versions) and a
 * floating panel listing registered classic script handles and script modules
 * with their origin: WordPress core, the Gutenberg plugin, Jetpack's
 * wp-build-polyfills, or another plugin. Packages compiled straight into an
 * app bundle (inline) are invisible at runtime and cannot be listed here.
 *
 * @phan-constructor-used-for-side-effects
 */
class Package_Provenance_Helper {

	/**
	 * Final printed URL per classic script handle, keyed by handle.
	 *
	 * Populated from `script_loader_src`, which runs after core prepends
	 * `WP_Scripts::$base_url` and after every rewrite filter, so these are the
	 * URLs the browser actually requested. Handles that core folds into
	 * `load-scripts.php` never reach that filter and stay absent here.
	 *
	 * @var array<string, string>
	 */
	private $printed_src = array();

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'wp_before_admin_bar_render', array( $this, 'register_admin_bar_menu' ), 1000000 );
		add_filter( 'script_loader_src', array( $this, 'record_script_src' ), PHP_INT_MAX, 2 );
		// Late on admin_print_footer_scripts, not admin_footer: this must run
		// after _wp_footer_scripts so wp_scripts()->done is complete. Handles
		// that core concatenates into load-scripts.php are marked done but
		// print no per-handle tag, so the DOM cannot answer this.
		add_action( 'admin_print_footer_scripts', array( $this, 'render' ), PHP_INT_MAX );
	}

	/**
	 * Records the final src of every classic script core prints.
	 *
	 * @param string $src    Fully resolved script URL.
	 * @param string $handle Script handle.
	 * @return string The unmodified `$src`.
	 */
	public function record_script_src( $src, $handle ) {
		$this->printed_src[ $handle ] = (string) $src;
		return $src;
	}

	/**
	 * Gutenberg plugin version, or null when inactive.
	 *
	 * @return string|null
	 */
	private function gutenberg_version() {
		return defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null;
	}

	/**
	 * Registers the admin bar badge.
	 */
	public function register_admin_bar_menu() {
		global $wp_admin_bar;

		// The panel only renders on admin screens; skip the badge elsewhere.
		if ( ! is_admin() ) {
			return;
		}

		$gutenberg = $this->gutenberg_version();
		$wp_admin_bar->add_menu(
			array(
				'id'     => 'package-provenance',
				'title'  => sprintf(
					'📦 WP %s · GB %s',
					esc_html( $GLOBALS['wp_version'] ?? '?' ),
					esc_html( $gutenberg ?? 'off' )
				),
				'href'   => '#',
				'parent' => 'top-secondary',
			)
		);
	}

	/**
	 * Resolves a registered `ver` the way core does when printing.
	 *
	 * `null` and `false` are not interchangeable: core omits the query arg
	 * entirely for `null`, and substitutes the WordPress version for `false`.
	 * Core registers a number of `wp-*` handles with `false` (`wp-util`,
	 * `wp-backbone`, `wp-api-request`, …), so casting both to `''` reports an
	 * empty version for files that are served with `?ver=<wp_version>`.
	 * `WP_Scripts::do_item()` and `WP_Script_Modules::get_src()` share the rule.
	 *
	 * @param string|bool|null $ver Registered version.
	 * @return string Version to display, or '' when core prints none.
	 */
	private function resolve_version( $ver ) {
		if ( null === $ver ) {
			return '';
		}
		return (string) ( $ver ? $ver : wp_scripts()->default_version );
	}

	/**
	 * Makes a registered src absolute the way core does when printing.
	 *
	 * Core registers its own packages root-relative (`/wp-includes/js/dist/…`)
	 * and prepends `WP_Scripts::$base_url` at print time, so a subdirectory
	 * install resolves them under the subdirectory. Mirrors the protocol and
	 * content-url checks in `WP_Scripts::do_item()`.
	 *
	 * @param string $src Registered src.
	 * @return string Absolute URL, or '' when `$src` is empty.
	 */
	private function absolute_src( $src ) {
		if ( '' === $src ) {
			return '';
		}

		$scripts     = wp_scripts();
		$content_url = $scripts->content_url;

		if ( preg_match( '|^(https?:)?//|', $src ) ) {
			return $src;
		}
		if ( $content_url && 0 === strpos( $src, $content_url ) ) {
			return $src;
		}

		return $scripts->base_url . $src;
	}

	/**
	 * Collects registered classic scripts and script modules with their sources.
	 *
	 * Runs late in the request so it sees everything the current screen
	 * registered, including conditional registrations like the wp-build
	 * polyfills (which only register on dashboard requests).
	 *
	 * @return array{wp: string, gutenberg: string|null, scripts: array, modules: array}
	 */
	private function collect() {
		$scripts = array();
		foreach ( wp_scripts()->registered as $handle => $dependency ) {
			if ( 0 !== strpos( $handle, 'wp-' ) || ! is_string( $dependency->src ) || '' === $dependency->src ) {
				continue;
			}

			$ver = $this->resolve_version( $dependency->ver );

			// Prefer the URL core actually printed. Fall back to reconstructing
			// it for handles registered but never printed on this screen.
			if ( isset( $this->printed_src[ $handle ] ) ) {
				$url = $this->printed_src[ $handle ];
			} else {
				$url = $this->absolute_src( $dependency->src );
				if ( '' !== $ver ) {
					$url = add_query_arg( 'ver', $ver, $url );
				}
			}

			$scripts[ $handle ] = array(
				'src'     => $dependency->src,
				'url'     => $url,
				'ver'     => $ver,
				'printed' => in_array( $handle, wp_scripts()->done, true ),
			);
		}
		ksort( $scripts );

		$modules = array();
		if ( function_exists( 'wp_script_modules' ) ) {
			try {
				$property = new \ReflectionProperty( wp_script_modules(), 'registered' );
				if ( PHP_VERSION_ID < 80100 ) {
					$property->setAccessible( true );
				}
				foreach ( (array) $property->getValue( wp_script_modules() ) as $id => $module ) {
					$ver = $this->resolve_version(
						array_key_exists( 'version', $module ) ? $module['version'] : null
					);
					$src = $this->absolute_src( (string) ( $module['src'] ?? '' ) );

					$modules[ (string) $id ] = array(
						'src' => $src,
						'url' => ( '' !== $src && '' !== $ver ) ? add_query_arg( 'ver', $ver, $src ) : $src,
						'ver' => $ver,
					);
				}
			} catch ( \ReflectionException $e ) {
				// Private property moved; the client-side import map still covers modules.
				$modules = array();
			}
		}
		ksort( $modules );

		return array(
			'wp'        => (string) ( $GLOBALS['wp_version'] ?? '' ),
			'gutenberg' => $this->gutenberg_version(),
			'scripts'   => $scripts,
			'modules'   => $modules,
		);
	}

	/**
	 * Prints the floating panel and its data.
	 */
	public function render() {
		$data = $this->collect();
		?>
		<script type="application/json" id="package-provenance-data"><?php echo wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP ); ?></script>
		<style>
			#package-provenance-panel {
				position: fixed; inset-block-end: 12px; inset-inline-end: 12px; z-index: 99999;
				inline-size: 80vw; max-block-size: 65vh;
				display: none; flex-direction: column; overflow: hidden;
				background: #1e1e1e; color: #d4d4d4; border: 1px solid #444; border-radius: 6px;
				font: 11px/1.5 Menlo, Consolas, monospace; box-shadow: 0 4px 16px rgba( 0, 0, 0, .4 );
			}
			#package-provenance-panel.is-open { display: flex; }
			#package-provenance-panel header {
				padding: 8px 10px; background: #2d2d2d; display: flex; gap: 10px; align-items: center;
			}
			#package-provenance-panel header input {
				flex: 1; background: #1e1e1e; color: inherit; border: 1px solid #555; border-radius: 3px;
				font: inherit; padding: 2px 6px;
			}
			#package-provenance-body { overflow: auto; padding: 4px 10px 10px; }
			#package-provenance-body table { border-collapse: collapse; inline-size: 100%; }
			#package-provenance-body td, #package-provenance-body th {
				padding: 1px 8px 1px 0; text-align: start; white-space: nowrap; vertical-align: top;
			}
			#package-provenance-body th { color: #9cdcfe; position: sticky; inset-block-start: 0; background: #1e1e1e; }
			.pkg-prov { padding: 0 5px; border-radius: 3px; color: #0a0a0a; font-weight: 700; }
			.pkg-prov-core { background: #6ab0f3; }
			.pkg-prov-gutenberg { background: #d49bd0; }
			.pkg-prov-polyfill { background: #e0a184; }
			.pkg-prov-app { background: #7fb069; }
			.pkg-prov-other { background: #9a9a9a; }
			#package-provenance-body a { color: #9cdcfe; text-decoration: none; }
			#package-provenance-body a:hover { text-decoration: underline; }
			/* Dim by text color, not row opacity, so provider labels stay legible. */
			.pkg-dim td { color: #8a8a8a; }
			.pkg-dim td a { color: #6a8caf; }
			.pkg-dim .pkg-prov { filter: saturate( .55 ) brightness( .82 ); }
			#package-provenance-note { color: #808080; margin-block-start: 6px; white-space: normal; }
			#package-provenance-help-toggle {
				background: #1e1e1e; color: inherit; border: 1px solid #555; border-radius: 3px;
				font: inherit; padding: 2px 8px; cursor: pointer; flex: none;
			}
			#package-provenance-help-toggle[aria-expanded="true"] {
				background: #9cdcfe; color: #0a0a0a; border-color: #9cdcfe;
			}
			#package-provenance-help {
				display: none; padding: 10px; background: #252526;
				overflow: auto; white-space: normal;
			}
			/* Fill the panel while open: min-block-size lets a flex child shrink
				below its content so its own overflow scrolls. The table is hidden
				rather than squeezed — both competing for the same box left the help
				clipped to a few lines. */
			#package-provenance-help.is-open { display: block; flex: 1; min-block-size: 0; }
			#package-provenance-help.is-open ~ #package-provenance-body { display: none; }
			#package-provenance-help h4 { color: #9cdcfe; margin: 12px 0 4px; font-size: 11px; }
			#package-provenance-help h4:first-child { margin-block-start: 0; }
			#package-provenance-help p { margin: 1.5em 0; color: #b8b8b8; }
			#package-provenance-help li { margin: 3px 0; color: #b8b8b8; }
			#package-provenance-help ol { margin: 3px 0; padding-inline-start: 18px; }
			#package-provenance-help table { border-collapse: collapse; margin-block-start: 4px; }
			#package-provenance-help td { padding: 2px 12px 2px 0; vertical-align: top; color: #b8b8b8; }
			#package-provenance-help code { color: #ce9178; }
			#package-provenance-help .pkg-help-warn { color: #e0a184; }
		</style>
		<div id="package-provenance-panel" role="dialog" aria-label="Package provenance">
			<header>
				<strong id="package-provenance-title"></strong>
				<input type="text" id="package-provenance-filter" placeholder="filter…" />
				<button type="button" id="package-provenance-help-toggle" aria-expanded="false" aria-controls="package-provenance-help">? help</button>
			</header>
			<div id="package-provenance-help">
				<h4>How WordPress picks the provider</h4>
				<p>Every package is registered by whoever gets there first, and the winner is decided per package, per screen, at print time:</p>
				<ol>
					<li>WordPress core registers its own bundled copies first.</li>
					<li>The Gutenberg plugin overrides core's registrations when active.</li>
					<li>Jetpack's wp-build-polyfills register last (<code>wp_default_scripts</code>, priority 20) and back off when the handle is already taken.</li>
				</ol>
				<p>Two exceptions. The polyfills <strong>force-replace</strong> <code>wp-notices</code>, <code>wp-private-apis</code> and <code>wp-rich-text</code> on WordPress versions whose copies are too old, taking the slot even when core or Gutenberg already filled it. And script modules are always first-wins: <code>wp_register_script_module()</code> silently ignores every later registration, so nothing can force a replacement there.</p>
				<p>A package missing from the list was never registered by anyone on this screen. That is normal — the polyfills only register when something on the screen asks for them.</p>

				<h4>How this panel labels it</h4>
				<p>The badge comes from the URL the browser actually requested, after core prepends the site URL and after any <code>script_loader_src</code> rewrite. First match wins, top to bottom:</p>
				<table>
					<tr><td><span class="pkg-prov pkg-prov-core">CORE</span></td><td>URL contains <code>/wp-includes/</code> or <code>/wp-admin/</code></td></tr>
					<tr><td><span class="pkg-prov pkg-prov-gutenberg">GUTENBERG</span></td><td>URL contains <code>/plugins/gutenberg/</code></td></tr>
					<tr><td><span class="pkg-prov pkg-prov-polyfill">POLYFILL</span></td><td>URL contains <code>wp-build-polyfills</code></td></tr>
					<tr><td><span class="pkg-prov pkg-prov-app">APP</span></td><td>URL contains <code>jetpack_vendor</code>, <code>/mu-plugins/</code> or <code>/plugins/</code></td></tr>
					<tr><td><span class="pkg-prov pkg-prov-other">OTHER</span></td><td>anything else, including packages with no URL</td></tr>
				</table>
				<p>Reading the served URL rather than the registered path means a CDN or cache-busting rewrite shows up here instead of being hidden.</p>
				<p>The <strong>served from</strong> column names the plugin or mu-plugin tree the file ships in. Several plugins can vendor the same package and the Jetpack autoloader loads the newest copy, so this column is where a replaced provider becomes visible: <code>wp-build-polyfills</code> served from <code>wpcomsh</code> means the wpcomsh copy beat the Jetpack plugin's. On WordPress.com Simple, the sun/moon deploy directory shows up here as <code>jetpack-plugin/sun</code> or <code>/moon</code>.</p>

				<h4>Reading the rows</h4>
				<p><strong>Dimmed</strong> means registered but not used on this screen: no tag printed for a classic script, or absent from the import map for a module. It does not mean broken.</p>
				<p><strong>ver</strong> is what core puts in <code>?ver=</code>. A handle registered with <code>false</code> shows the WordPress version, because that is what core substitutes; one registered with <code>null</code> shows nothing, because core prints no version at all.</p>
				<p class="pkg-help-warn">A hashed <code>ver</code> fingerprints the build that produced it, and builds are not byte-reproducible across environments: production hashes match the mirror repo's committed assets, while a local build only matches itself. Compare hashes within one build origin, never across.</p>
				<p class="pkg-help-warn">Packages compiled inline into an app bundle never appear here. Only the externalized surface exists at runtime, so an absent row is not proof that a package is unused.</p>
			</div>
			<div id="package-provenance-body"></div>
		</div>
		<script>
		( function () {
			const data = JSON.parse( document.getElementById( 'package-provenance-data' ).textContent );

			const provider = ( url ) =>
				! url ? 'other'
				: url.includes( '/wp-includes/' ) || url.includes( '/wp-admin/' ) ? 'core'
				: url.includes( '/plugins/gutenberg/' ) ? 'gutenberg'
				: url.includes( 'wp-build-polyfills' ) ? 'polyfill'
				: url.includes( 'jetpack_vendor' ) || url.includes( '/mu-plugins/' ) || url.includes( '/plugins/' ) ? 'app'
				: 'other';

			// The plugin or mu-plugin tree the file ships in. Matched on the URL
			// path, so a CDN origin (s0.wp.com and friends) changes nothing. On
			// WordPress.com Simple the sun/moon deploy dir is the story, so it is
			// kept as part of the source.
			const sourceOf = ( url ) => {
				if ( ! url ) {
					return '';
				}
				for ( const root of [ '/mu-plugins/', '/plugins/' ] ) {
					const at = url.indexOf( root );
					if ( -1 === at ) {
						continue;
					}
					const parts = url.slice( at + root.length ).split( /[/?#]/ );
					let source = parts[ 0 ] || '';
					if ( ( 'jetpack-plugin' === source || 'jetpack-mu-wpcom-plugin' === source ) &&
						( 'sun' === parts[ 1 ] || 'moon' === parts[ 1 ] ) ) {
						source += '/' + parts[ 1 ];
					}
					return source;
				}
				return '';
			};

			const esc = ( value ) => {
				const span = document.createElement( 'span' );
				span.textContent = String( value );
				return span.innerHTML;
			};
			const escAttr = ( value ) => esc( value ).replace( /"/g, '&quot;' );

			// Rows are recomputed on every paint so the import map is picked up
			// whenever it lands. Classic script state comes from PHP, which
			// already ran after every script printed.
			const compute = () => {
				const importMapEl = document.querySelector( 'script[type="importmap"]' );
				const importMap = importMapEl ? ( JSON.parse( importMapEl.textContent ).imports || {} ) : {};

				const rows = [];
				for ( const [ handle, info ] of Object.entries( data.scripts ) ) {
					rows.push( {
						name: handle,
						type: 'classic',
						// Classify by the URL core printed, not the registered
						// src: a script_loader_src rewrite (CDN, cache busting)
						// can serve the file from somewhere else entirely.
						provider: provider( info.url || info.src ),
						source: sourceOf( info.url || info.src ),
						ver: info.ver,
						url: info.url,
						// wp_scripts()->done is authoritative: this panel prints
						// after _wp_footer_scripts. Handles core folds into
						// load-scripts.php are done but print no per-handle tag,
						// so the DOM probe is only a fallback.
						loaded: info.printed || !! document.getElementById( handle + '-js' ),
					} );
				}
				const moduleIds = new Set( [ ...Object.keys( data.modules ), ...Object.keys( importMap ) ] );
				for ( const id of [ ...moduleIds ].sort() ) {
					const info = data.modules[ id ] || {};
					const url = importMap[ id ] || info.url || '';
					rows.push( {
						name: id,
						type: 'module',
						provider: provider( url ),
						source: sourceOf( url ),
						ver: ( url.match( /ver=([^&]+)/ ) || [ , info.ver || '' ] )[ 1 ],
						url,
						loaded: id in importMap,
					} );
				}
				return rows;
			};

			const panel = document.getElementById( 'package-provenance-panel' );
			const body = document.getElementById( 'package-provenance-body' );
			const filter = document.getElementById( 'package-provenance-filter' );
			document.getElementById( 'package-provenance-title' ).textContent =
				'WP ' + data.wp + ' · Gutenberg ' + ( data.gutenberg || 'inactive' );

			const paint = () => {
				const needle = filter.value.toLowerCase();
				const cells = compute()
					.filter( ( r ) => ! needle || r.name.toLowerCase().includes( needle ) || r.provider.includes( needle ) || r.source.toLowerCase().includes( needle ) )
					.map( ( r ) => '<tr class="' + ( r.loaded ? '' : 'pkg-dim' ) + '"><td>' + esc( r.name ) +
						'</td><td>' + r.type +
						'</td><td><span class="pkg-prov pkg-prov-' + r.provider + '">' + r.provider.toUpperCase() + '</span>' +
						'</td><td>' + esc( r.source ) +
						'</td><td>' + ( r.url
							? '<a href="' + escAttr( r.url ) + '" target="_blank" rel="noopener noreferrer">' + esc( r.ver || '↗' ) + '</a>'
							: esc( r.ver || '' ) ) + '</td></tr>' )
					.join( '' );
				body.innerHTML = '<table><tr><th>package</th><th>type</th><th>provider</th><th>served from</th><th>ver</th></tr>' + cells + '</table>' +
					'<p id="package-provenance-note">Dimmed rows are registered but unused on this screen. ' +
					'Packages compiled inline into an app bundle never appear here. ' +
					'See <strong>? help</strong> for how the provider is decided.</p>';
			};
			const help = document.getElementById( 'package-provenance-help' );
			const helpToggle = document.getElementById( 'package-provenance-help-toggle' );
			helpToggle.addEventListener( 'click', () => {
				const open = help.classList.toggle( 'is-open' );
				helpToggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			} );

			filter.addEventListener( 'input', paint );
			// First paint waits for the full document so footer script tags exist.
			if ( 'complete' === document.readyState ) {
				paint();
			} else {
				window.addEventListener( 'load', paint );
			}

			const badge = document.querySelector( '#wp-admin-bar-package-provenance a' );
			if ( badge ) {
				badge.addEventListener( 'click', ( event ) => {
					event.preventDefault();
					panel.classList.toggle( 'is-open' );
					if ( panel.classList.contains( 'is-open' ) ) {
						paint(); // Recompute: enqueue state may have changed since load.
					}
				} );
			}
		} )();
		</script>
		<?php
	}
}

new Package_Provenance_Helper();

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once __DIR__ . '/inc/class-package-provenance-predictor.php';
	require_once __DIR__ . '/inc/class-package-provenance-sources.php';
	require_once __DIR__ . '/inc/class-package-provenance-cli.php';
	WP_CLI::add_command( 'jetpack-debug provenance', 'Package_Provenance_CLI' );
}
