/**
 * Stand-in for `@automattic/calypso-config`, fed by `Dashboard_Config_Data` and the defaults the Calypso app merged in.
 */

type ConfigData = Record< string, unknown > & {
	features?: Record< string, boolean >;
};

declare global {
	interface Window {
		jetpackBlazeDashboardConfig?: ConfigData;
	}
}

const DEFAULTS = {
	dsp_stripe_pub_key:
		'pk_live_51LYYzQF53KN4RFN0oHFYHpzmHGpuUAXZ6ygDAFxM4XkRArRsET0orrofmsynkd9DhFaOGEsDZ3RC4f8mgI0zhEyN000X8i0Mqx',
	dsp_widget_js_src: 'https://dsp.wp.com/widget.js',
	advertising_dashboard_path_prefix: '/advertising',
};

let data: ConfigData | null = null;

/**
 * Build the config once, the way `apps/blaze-dashboard/src/load-config.js` did.
 *
 * @return The merged config.
 */
function getData(): ConfigData {
	if ( data ) {
		return data;
	}

	const raw = ( typeof window !== 'undefined' && window.jetpackBlazeDashboardConfig ) || {};
	const isWooStore = !! raw.is_woo_store;
	// Blaze Ads releases before the is_blaze_plugin flag only reported is_woo_store.
	const isBlazePlugin = !! raw.is_blaze_plugin || isWooStore;

	data = {
		...DEFAULTS,
		...raw,
		blog_id: Number( raw.blog_id ) || 0,
		advertising_dashboard_path_prefix: isBlazePlugin
			? ( raw.dashboard_path_prefix as string ) || '/wc-blaze'
			: '/advertising',
		features: {
			...( raw.features || {} ),
			is_running_in_jetpack_site: raw.features?.is_running_in_jetpack_site ?? true,
			is_running_in_blaze_plugin: isBlazePlugin,
			is_running_in_woo_site: isWooStore,
			blaze_setup_mode: !! raw.need_setup,
		},
	};

	return data;
}

/**
 * Read a config value.
 *
 * @param key - Config key.
 * @return The value, or undefined.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function config( key: string ): any {
	return getData()[ key ];
}

config.isEnabled = ( flag: string ): boolean => !! getData().features?.[ flag ];

export { config as default, config };
export const isEnabled = config.isEnabled;
