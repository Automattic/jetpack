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
	 * Construction.
	 */
	public function __construct() {
		add_action( 'wp_before_admin_bar_render', array( $this, 'register_admin_bar_menu' ), 1000000 );
		add_action( 'admin_footer', array( $this, 'render' ), 1000 );
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
			$scripts[ $handle ] = array(
				'src'     => $dependency->src,
				'ver'     => (string) $dependency->ver,
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
					if ( 0 !== strpos( (string) $id, '@' ) ) {
						continue;
					}
					$modules[ $id ] = array(
						'src' => (string) ( $module['src'] ?? '' ),
						'ver' => (string) ( $module['version'] ?? '' ),
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
				inline-size: 640px; max-inline-size: calc( 100vw - 24px ); max-block-size: 65vh;
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
			/* Dim by text color, not row opacity, so provider labels stay legible. */
			.pkg-dim td { color: #8a8a8a; }
			.pkg-dim .pkg-prov { filter: saturate( .55 ) brightness( .82 ); }
			#package-provenance-note { color: #808080; margin-block-start: 6px; white-space: normal; }
		</style>
		<div id="package-provenance-panel" role="dialog" aria-label="Package provenance">
			<header>
				<strong id="package-provenance-title"></strong>
				<input type="text" id="package-provenance-filter" placeholder="filter…" />
			</header>
			<div id="package-provenance-body"></div>
		</div>
		<script>
		( function () {
			const data = JSON.parse( document.getElementById( 'package-provenance-data' ).textContent );

			const provider = ( url ) =>
				! url ? 'other'
				: url.includes( '/wp-includes/' ) ? 'core'
				: url.includes( '/plugins/gutenberg/' ) ? 'gutenberg'
				: url.includes( 'wp-build-polyfills' ) ? 'polyfill'
				: url.includes( 'jetpack_vendor' ) || url.includes( '/plugins/' ) ? 'app'
				: 'other';

			// Ground truth from the DOM: which classic handles actually printed,
			// and what the import map really maps each module id to.
			const importMapEl = document.querySelector( 'script[type="importmap"]' );
			const importMap = importMapEl ? ( JSON.parse( importMapEl.textContent ).imports || {} ) : {};

			const rows = [];
			for ( const [ handle, info ] of Object.entries( data.scripts ) ) {
				const inDom = !! document.getElementById( handle + '-js' );
				rows.push( {
					name: handle,
					type: 'classic',
					provider: provider( info.src ),
					ver: info.ver,
					loaded: inDom || info.printed,
				} );
			}
			const moduleIds = new Set( [ ...Object.keys( data.modules ), ...Object.keys( importMap ) ] );
			for ( const id of [ ...moduleIds ].sort() ) {
				const src = importMap[ id ] || ( data.modules[ id ] || {} ).src || '';
				rows.push( {
					name: id,
					type: 'module',
					provider: provider( src ),
					ver: ( src.match( /ver=([^&]+)/ ) || [ , ( data.modules[ id ] || {} ).ver || '' ] )[ 1 ],
					loaded: id in importMap,
				} );
			}

			const panel = document.getElementById( 'package-provenance-panel' );
			const body = document.getElementById( 'package-provenance-body' );
			const filter = document.getElementById( 'package-provenance-filter' );
			document.getElementById( 'package-provenance-title' ).textContent =
				'WP ' + data.wp + ' · Gutenberg ' + ( data.gutenberg || 'inactive' );

			const paint = () => {
				const needle = filter.value.toLowerCase();
				const cells = rows
					.filter( ( r ) => ! needle || r.name.toLowerCase().includes( needle ) || r.provider.includes( needle ) )
					.map( ( r ) => '<tr class="' + ( r.loaded ? '' : 'pkg-dim' ) + '"><td>' + r.name +
						'</td><td>' + r.type +
						'</td><td><span class="pkg-prov pkg-prov-' + r.provider + '">' + r.provider.toUpperCase() + '</span>' +
						'</td><td>' + ( r.ver || '' ) + '</td></tr>' )
					.join( '' );
				body.innerHTML = '<table><tr><th>package</th><th>type</th><th>provider</th><th>ver</th></tr>' + cells + '</table>' +
					'<p id="package-provenance-note">Dimmed rows are registered but not loaded on this screen. ' +
					'Packages compiled inline into an app bundle never appear here — only the externalized surface is visible at runtime.</p>';
			};
			filter.addEventListener( 'input', paint );
			paint();

			const badge = document.querySelector( '#wp-admin-bar-package-provenance a' );
			if ( badge ) {
				badge.addEventListener( 'click', ( event ) => {
					event.preventDefault();
					panel.classList.toggle( 'is-open' );
				} );
			}
		} )();
		</script>
		<?php
	}
}

new Package_Provenance_Helper();
