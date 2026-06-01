<?php
/**
 * Offline Mode feature registry.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Provides feature data for the Jetpack Offline Mode dashboard.
 */
class Jetpack_Offline_Mode_Features {
	const TYPE_MODULE  = 'module';
	const TYPE_PARTIAL = 'partial';

	/**
	 * Get dashboard data for the Offline Mode screen.
	 *
	 * @return array
	 */
	public static function get_dashboard_data() {
		$features = array_merge(
			self::get_offline_module_features(),
			array_values( self::get_partial_features() )
		);

		$group_order = array_flip( array_keys( self::get_groups() ) );

		usort(
			$features,
			function ( $a, $b ) use ( $group_order ) {
				$a_group = $group_order[ $a['group'] ] ?? PHP_INT_MAX;
				$b_group = $group_order[ $b['group'] ] ?? PHP_INT_MAX;

				if ( $a['group'] === $b['group'] ) {
					return strcasecmp( $a['name'], $b['name'] );
				}

				if ( $a_group === $b_group ) {
					return strcasecmp( $a['group'], $b['group'] );
				}

				return ( $a_group < $b_group ) ? -1 : 1;
			}
		);

		return array(
			'features'    => $features,
			'groups'      => self::get_groups(),
			'recommended' => self::get_recommended_modules(),
			'counts'      => array(
				'offline_safe' => count(
					array_filter(
						$features,
						function ( $feature ) {
							return self::TYPE_MODULE === $feature['type'];
						}
					)
				),
				'enabled'      => count(
					array_filter(
						$features,
						function ( $feature ) {
							return ! empty( $feature['active'] );
						}
					)
				),
				'partial'      => count(
					array_filter(
						$features,
						function ( $feature ) {
							return self::TYPE_PARTIAL === $feature['type'];
						}
					)
				),
			),
		);
	}

	/**
	 * Get recommended module slugs for local development.
	 *
	 * @return array
	 */
	public static function get_recommended_modules() {
		return array(
			'contact-form',
			'blocks',
			'shortcodes',
			'tiled-gallery',
			'carousel',
			'widgets',
			'widget-visibility',
			'markdown',
			'copy-post',
			'sharedaddy',
			'sitemaps',
			'seo-tools',
		);
	}

	/**
	 * Get curated partial offline features.
	 *
	 * @return array
	 */
	public static function get_partial_features() {
		$module = Jetpack::get_module( 'subscriptions' );

		return array(
			'newsletter' => array(
				'slug'              => 'newsletter',
				'module'            => 'subscriptions',
				'name'              => __( 'Newsletter', 'jetpack' ),
				'description'       => $module['description'] ?? __( 'Grow your subscriber list and deliver your content directly to their email inbox.', 'jetpack' ),
				'type'              => self::TYPE_PARTIAL,
				'group'             => 'audience',
				'active'            => Jetpack::is_module_active( 'subscriptions' ),
				'available'         => true,
				'recommended'       => false,
				'limitation'        => __( 'Local editor, theme, and plugin integration can be enabled. Email delivery, subscriber sync, and WordPress.com-backed flows still require a connection.', 'jetpack' ),
				'underlying_module' => 'subscriptions',
				'documentation_url' => self::get_documentation_url( 'newsletter' ),
			),
		);
	}

	/**
	 * Allow curated partial modules to activate and load in Offline Mode.
	 *
	 * @param bool   $allow        Whether the module is already allowed.
	 * @param string $module       Module slug.
	 * @param array  $_module_data Module metadata.
	 * @return bool
	 */
	public static function allow_partial_module_in_offline_mode( $allow, $module, $_module_data = array() ) {
		unset( $_module_data );

		if ( $allow ) {
			return true;
		}

		$partial_modules = wp_list_pluck( self::get_partial_features(), 'module' );
		return in_array( $module, $partial_modules, true );
	}

	/**
	 * Get dashboard groups.
	 *
	 * @return array
	 */
	public static function get_groups() {
		return array(
			'content'  => __( 'Content and editor', 'jetpack' ),
			'audience' => __( 'Audience and engagement', 'jetpack' ),
			'media'    => __( 'Media', 'jetpack' ),
			'traffic'  => __( 'Traffic and discovery', 'jetpack' ),
			'theme'    => __( 'Theme enhancements', 'jetpack' ),
			'other'    => __( 'Other local features', 'jetpack' ),
		);
	}

	/**
	 * Get fully offline module feature data.
	 *
	 * @return array
	 */
	private static function get_offline_module_features() {
		$features            = array();
		$recommended_modules = self::get_recommended_modules();

		foreach ( Jetpack::get_available_modules( false, false, false, null ) as $module_slug ) {
			$module = Jetpack::get_module( $module_slug );
			if ( ! $module ) {
				continue;
			}

			$module_name = isset( $module['name'] ) && '' !== $module['name'] ? $module['name'] : self::get_module_name_fallback( $module_slug );

			$features[] = array(
				'slug'              => $module_slug,
				'module'            => $module_slug,
				'name'              => $module_name,
				'description'       => $module['description'] ?? $module_name,
				'type'              => self::TYPE_MODULE,
				'group'             => self::get_module_group( $module_slug ),
				'active'            => Jetpack::is_module_active( $module_slug ),
				'available'         => true,
				'recommended'       => in_array( $module_slug, $recommended_modules, true ),
				'limitation'        => '',
				'underlying_module' => $module_slug,
				'documentation_url' => self::get_documentation_url( $module_slug ),
			);
		}

		return $features;
	}

	/**
	 * Get the Jetpack Redirect URL for a feature's documentation.
	 *
	 * @param string $feature Feature or module slug.
	 * @return string
	 */
	private static function get_documentation_url( $feature ) {
		$redirect_sources = array(
			'blocks'               => 'jetpack-support-blocks',
			'canonical-urls'       => 'jetpack-support-canonical-urls',
			'carousel'             => 'jetpack-support-carousel',
			'contact-form'         => 'jetpack-support-contact-form',
			'copy-post'            => 'jetpack-support-copy-post',
			'custom-content-types' => 'jetpack-support-custom-content-types',
			'google-fonts'         => 'jetpack-support-google-fonts',
			'gravatar-hovercards'  => 'jetpack-support-gravatar-hovercards',
			'infinite-scroll'      => 'jetpack-support-infinite-scroll',
			'latex'                => 'jetpack-support-beautiful-math-with-latex',
			'markdown'             => 'jetpack-support-markdown',
			'newsletter'           => 'https://jetpack.com/support/newsletter',
			'photon-cdn'           => 'jetpack-support-asset-cdn',
			'post-list'            => 'jetpack-support-post-list',
			'sharedaddy'           => 'jetpack-support-sharing',
			'shortcodes'           => 'jetpack-support-shortcode-embeds',
			'seo-tools'            => 'jetpack-support-seo-tools',
			'sitemaps'             => 'jetpack-support-sitemaps',
			'tiled-gallery'        => 'jetpack-support-tiled-galleries',
			'verification-tools'   => 'jetpack-support-site-verification-tools',
			'widget-visibility'    => 'jetpack-support-widget-visibility',
			'widgets'              => 'jetpack-support-extra-sidebar-widgets',
			'wpcom-reader'         => 'jetpack-support-reader',
		);

		$source = $redirect_sources[ $feature ] ?? 'jetpack-support-' . $feature;
		return Redirect::get_url( $source );
	}

	/**
	 * Get a readable module name from a module slug.
	 *
	 * @param string $module Module slug.
	 * @return string
	 */
	private static function get_module_name_fallback( $module ) {
		return ucwords( str_replace( '-', ' ', $module ) );
	}

	/**
	 * Map module slugs to developer dashboard groups.
	 *
	 * @param string $module Module slug.
	 * @return string
	 */
	private static function get_module_group( $module ) {
		$groups = array(
			'content'  => array( 'blocks', 'contact-form', 'copy-post', 'custom-content-types', 'latex', 'markdown', 'shortcodes' ),
			'audience' => array( 'gravatar-hovercards', 'sharedaddy', 'wpcom-reader' ),
			'media'    => array( 'carousel', 'photon-cdn', 'tiled-gallery' ),
			'traffic'  => array( 'canonical-urls', 'seo-tools', 'sitemaps', 'verification-tools' ),
			'theme'    => array( 'google-fonts', 'infinite-scroll', 'post-list', 'widget-visibility', 'widgets' ),
		);

		foreach ( $groups as $group => $modules ) {
			if ( in_array( $module, $modules, true ) ) {
				return $group;
			}
		}

		return 'other';
	}
}
