<?php
/**
 * Style output for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

use ET\Builder\FrontEnd\Module\Style;
use ET\Builder\Packages\Module\Options\Css\CssStyle;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Emits the module's styles, mirroring the Visual Builder style component.
 */
trait Module_Styles_Trait {

	use Custom_Css_Trait;

	/**
	 * Adds the module's styles to the style registry.
	 *
	 * @param array $args The style callback arguments.
	 *
	 * @return void
	 */
	public static function module_styles( $args ) {
		$attrs    = $args['attrs'] ?? array();
		$elements = $args['elements'];
		$settings = $args['settings'] ?? array();

		Style::add(
			array(
				'id'            => $args['id'] ?? '',
				'name'          => $args['name'] ?? '',
				'orderIndex'    => $args['orderIndex'] ?? 0,
				'storeInstance' => $args['storeInstance'] ?? null,
				'styles'        => array(
					$elements->style(
						array(
							'attrName'   => 'module',
							'styleProps' => array(
								'disabledOn' => array(
									'disabledModuleVisibility' => $settings['disabledModuleVisibility'] ?? null,
								),
							),
						)
					),
					CssStyle::style(
						array(
							'selector'  => $args['orderClass'],
							'attr'      => $attrs['css'] ?? array(),
							'cssFields' => self::custom_css(),
						)
					),
				),
			)
		);
	}
}
