<?php
/**
 * Jetpack_Script_Data.
 *
 * Adds Jetpack-plugin-specific data to the consolidated JetpackScriptData object.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;

/**
 * Jetpack_Script_Data class.
 */
class Jetpack_Script_Data {

	/**
	 * Configure script data.
	 */
	public static function configure() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'set_admin_script_data' ), 10, 1 );
	}

	/**
	 * Add Jetpack-plugin-specific data to the consolidated JetpackScriptData object.
	 *
	 * @since 15.6
	 *
	 * @param array $data The script data.
	 * @return array
	 */
	public static function set_admin_script_data( $data ) {
		/**
		 * Whether to show the Jetpack branding in editor panels (e.g., SEO, AI Assistant).
		 *
		 * @since 15.6
		 *
		 * @param bool $show Whether to show the Jetpack editor panel branding. Defaults to true.
		 */
		$data['jetpack'] = array(
			'flags' => array(
				'showJetpackBranding' => (bool) apply_filters( 'jetpack_show_editor_panel_branding', true ),
				'skipPhotonDomain'    => self::should_skip_photon_domain( $data ),
			),
		);

		return $data;
	}

	/**
	 * Whether image-serving blocks should skip the external Photon domain (i0.wp.com) and build
	 * URLs on the site's own Photon-like host instead.
	 *
	 * VIP sites serve images from a host of their own, and images routed through the public Photon
	 * domain are not reachable there.
	 *
	 * This is read by the Tiled Gallery block's skipPhotonDomain(), which runs inside the block's
	 * save() output — including when the editor regenerates that output to validate saved content.
	 * That regeneration happens while the post is being parsed, before any editor store holds
	 * settings, so the value has to travel in the script data rather than in editor settings.
	 *
	 * The signal is the plan slug rather than Host::is_vip_site(): it is what the block's previous
	 * isVIP() check used, and switching to the WPCOM_IS_VIP_ENV constant would change which sites get
	 * site-host URLs — and so which existing galleries need a deprecation to stay valid.
	 *
	 * @since 16.2
	 *
	 * @param array $data The script data, which may already carry the site plan.
	 * @return bool
	 */
	private static function should_skip_photon_domain( $data ) {
		// Another package may have put the plan in the payload already (see Publicize_Script_Data);
		// only look it up when it hasn't.
		$product_slug = $data['site']['plan']['product_slug'] ?? '';
		if ( '' === $product_slug ) {
			$jetpack_plan = Jetpack_Plan::get();
			$product_slug = $jetpack_plan['product_slug'];
		}

		/**
		 * Filter whether the Tiled Gallery and Image Compare blocks should skip the external
		 * Photon (i0.wp.com) domain and build image URLs on the site's own host instead.
		 *
		 * Defaults to true on VIP sites only, and false everywhere else.
		 *
		 * Changing this changes the markup Tiled Gallery saves, because it bakes the image URLs into its
		 * save() output. Galleries saved under the previous value stay valid — the block ships a
		 * deprecation for each image host, so flipping this either way is safe — and they are
		 * re-serialized with the new URLs the next time they are saved.
		 *
		 * Image Compare only uses this for its editor previews; its save() writes the attachment URLs
		 * through untouched, so its saved markup does not depend on this value.
		 *
		 * @module tiled-gallery
		 *
		 * @since 16.2
		 *
		 * @param bool $skip_photon_domain Whether to skip the external Photon domain.
		 */
		return (bool) apply_filters( 'jetpack_skip_photon_domain', 'vip' === $product_slug );
	}
}
