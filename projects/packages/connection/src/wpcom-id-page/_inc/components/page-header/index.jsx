import { __ } from '@wordpress/i18n';

const ACTIVE_COLOR_JETPACK = '#069E08';
const ACTIVE_COLOR_WOO = '#7F54B3';
const INACTIVE_COLOR = '#A7AAAD';

/**
 * WordPress.com "W" circle logo in brand blue.
 *
 * @return {import('react').ReactNode} SVG element.
 */
function WpcomLogo() {
	return (
		<svg
			className="wpcom-id-page__logo wpcom-id-page__logo--wpcom"
			viewBox="0 0 72 72"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				fill="#016087"
				d="M36,0C16.1,0,0,16.1,0,36c0,19.9,16.1,36,36,36c19.9,0,36-16.2,36-36C72,16.1,55.8,0,36,0z M3.6,36 c0-4.7,1-9.1,2.8-13.2l15.4,42.3C11.1,59.9,3.6,48.8,3.6,36z M36,68.4c-3.2,0-6.2-0.5-9.1-1.3l9.7-28.2l9.9,27.3 c0.1,0.2,0.1,0.3,0.2,0.4C43.4,67.7,39.8,68.4,36,68.4z M40.5,20.8c1.9-0.1,3.7-0.3,3.7-0.3c1.7-0.2,1.5-2.8-0.2-2.7 c0,0-5.2,0.4-8.6,0.4c-3.2,0-8.5-0.4-8.5-0.4c-1.7-0.1-2,2.6-0.2,2.7c0,0,1.7,0.2,3.4,0.3l5,13.8L28,55.9L16.2,20.8 c2-0.1,3.7-0.3,3.7-0.3c1.7-0.2,1.5-2.8-0.2-2.7c0,0-5.2,0.4-8.6,0.4c-0.6,0-1.3,0-2.1,0C14.7,9.4,24.7,3.6,36,3.6 c8.4,0,16.1,3.2,21.9,8.5c-0.1,0-0.3,0-0.4,0c-3.2,0-5.4,2.8-5.4,5.7c0,2.7,1.5,4.9,3.2,7.6c1.2,2.2,2.7,4.9,2.7,8.9 c0,2.8-0.8,6.3-2.5,10.5l-3.2,10.8L40.5,20.8z M52.3,64l9.9-28.6c1.8-4.6,2.5-8.3,2.5-11.6c0-1.2-0.1-2.3-0.2-3.3 c2.5,4.6,4,9.9,4,15.5C68.4,47.9,61.9,58.4,52.3,64z"
			/>
		</svg>
	);
}

/**
 * Jetpack bolt circle logo.
 *
 * @param {object} props       - Component props.
 * @param {string} props.color - Fill color for the circle background.
 * @return {import('react').ReactNode} SVG element.
 */
function JetpackLogo( { color } ) {
	return (
		<svg
			className="wpcom-id-page__logo wpcom-id-page__logo--plugin"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<circle cx="16" cy="16" r="16" fill={ color } />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M15.3295 3.17557V18.6565H7.36005L15.3295 3.17557ZM16.9478 28.8244V13.313H24.9478L16.9478 28.8244Z"
				fill="white"
			/>
		</svg>
	);
}

/**
 * WooCommerce "W" circle logo.
 *
 * @param {object} props       - Component props.
 * @param {string} props.color - Fill color for the logo.
 * @return {import('react').ReactNode} SVG element.
 */
function WooCommerceLogo( { color } ) {
	return (
		<svg
			className="wpcom-id-page__logo wpcom-id-page__logo--plugin"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				fill={ color }
				d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM3.96289 6.48242C3.18274 6.48255 2.78715 6.84526 2.78711 7.51562C2.78716 8.186 3.20472 8.5711 3.96289 8.5713H4.80957V12.583C4.80963 13.7152 5.5685 14.3857 6.67871 14.3857C7.56882 14.3856 8.2837 13.9465 8.8223 12.9355L10.0205 10.6924V12.5947C10.0207 13.7156 10.7461 14.3857 11.8672 14.3857C12.7463 14.3856 13.3951 14.0014 14.0215 12.9355L16.7803 8.2744C17.3848 7.25229 16.9565 6.4827 15.627 6.48242C14.9124 6.48242 14.4499 6.71367 14.0322 7.49414L12.1309 11.0664V7.88965C12.1309 6.94438 11.68 6.48252 10.8447 6.48242C10.1852 6.48242 9.6577 6.76825 9.251 7.55957L7.45898 11.0664V7.92285C7.45898 6.91172 7.04118 6.48258 6.03027 6.48242H3.96289Z"
			/>
		</svg>
	);
}

/**
 * Checks whether any plugin slug in the connected list starts with the given prefix.
 *
 * @param {Object|Array} plugins - Connected plugins (object keyed by slug or array of {slug}).
 * @param {string}       prefix  - Slug prefix to match, e.g. "jetpack" or "woo".
 * @return {boolean} True if at least one matching plugin is connected.
 */
function hasPluginWithPrefix( plugins, prefix ) {
	if ( ! plugins ) {
		return false;
	}

	const slugs = Array.isArray( plugins ) ? plugins.map( p => p.slug ) : Object.keys( plugins );

	return slugs.some( slug => slug.startsWith( prefix ) );
}

/**
 * Page header for the WordPress.com ID admin page.
 *
 * @param {object} props                 - Component props.
 * @param {object} props.connectionState - JP_CONNECTION_INITIAL_STATE data.
 * @return {import('react').ReactNode} The rendered component.
 */
export default function PageHeader( { connectionState } ) {
	const plugins = connectionState?.connectedPlugins;
	const jetpackConnected = hasPluginWithPrefix( plugins, 'jetpack' );
	const wooConnected = hasPluginWithPrefix( plugins, 'woo' );

	return (
		<div className="wpcom-id-page__header">
			<div className="wpcom-id-page__header-left">
				<WpcomLogo />
				<h1>{ __( 'WordPress.com ID', 'jetpack-connection' ) }</h1>
			</div>
			<div className="wpcom-id-page__header-right">
				<JetpackLogo color={ jetpackConnected ? ACTIVE_COLOR_JETPACK : INACTIVE_COLOR } />
				<WooCommerceLogo color={ wooConnected ? ACTIVE_COLOR_WOO : INACTIVE_COLOR } />
			</div>
		</div>
	);
}
