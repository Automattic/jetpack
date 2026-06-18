<?php
/**
 * Hand-maintained Phan stubs for the Divi 5 builder framework (`ET\Builder\*`).
 *
 * Divi isn't a Composer dependency (commercial product, not on WordPress.org or
 * GitHub), so it can't use the auto-generated tools/stubs pipeline. These
 * signatures let Phan type-check the Divi 5 VideoPress module. Update by hand if
 * the APIs used here change.
 *
 * Phan picks this up automatically: it lives under `.phan/stubs/`, which the base
 * config parses (declaring these `ET\Builder\*` symbols) while excluding from
 * analysis. There is no named `divi` stub to add to `+stubs` in `config.php` —
 * the base config's `make_phan_config()` has no `divi` case and would throw on one.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace ET\Builder\Framework\DependencyManagement\Interfaces {
	/**
	 * A dependency that can be loaded by the Divi dependency tree.
	 */
	interface DependencyInterface {
		/**
		 * Loads the dependency.
		 *
		 * @return void
		 */
		public function load();
	}
}

namespace ET\Builder\Packages\ModuleLibrary {
	/**
	 * Registers a module with the Divi module library.
	 */
	class ModuleRegistration {
		/**
		 * Registers a module from its `module.json` folder.
		 *
		 * @param string $module_json_folder_path Path to the folder holding `module.json`.
		 * @param array  $args                    Registration arguments (e.g. `render_callback`).
		 *
		 * @return void
		 */
		public static function register_module( $module_json_folder_path, $args ) {}
	}
}

namespace ET\Builder\Packages\Module {
	/**
	 * Renders a Divi module.
	 */
	class Module {
		/**
		 * Renders a module to its final HTML.
		 *
		 * @param array $args Render arguments.
		 *
		 * @return string
		 */
		public static function render( $args ) {
			return '';
		}
	}
}

namespace ET\Builder\Packages\Module\Options\Css {
	/**
	 * Builds custom CSS styles for a module.
	 */
	class CssStyle {
		/**
		 * Returns the custom CSS style output.
		 *
		 * @param array $args Style arguments.
		 *
		 * @return string
		 */
		public static function style( $args ) {
			return '';
		}
	}
}

namespace ET\Builder\Packages\Module\Options\Element {
	/**
	 * Builds element class names for a module.
	 */
	class ElementClassnames {
		/**
		 * Returns the element class names.
		 *
		 * @param array $args Class name arguments.
		 *
		 * @return string
		 */
		public static function classnames( $args ) {
			return '';
		}
	}
}

namespace ET\Builder\FrontEnd\Module {
	/**
	 * Registers module styles with the front-end style manager.
	 */
	class Style {
		/**
		 * Adds styles for a module.
		 *
		 * @param array $args Style arguments.
		 *
		 * @return void
		 */
		public static function add( $args ) {}
	}
}

namespace ET\Builder\FrontEnd\BlockParser {
	/**
	 * Looks up parsed blocks during front-end rendering.
	 */
	class BlockParserStore {
		/**
		 * Returns the parent of a parsed block.
		 *
		 * @param string $id             The block id.
		 * @param string $store_instance The store instance id.
		 *
		 * @return object|null
		 */
		public static function get_parent( $id, $store_instance ) {
			return null;
		}
	}
}

namespace ET\Builder\VisualBuilder\Assets {
	/**
	 * Registers Visual Builder package builds.
	 */
	class PackageBuildManager {
		/**
		 * Registers a package build (script/style bundle) with the Visual Builder.
		 *
		 * @param array $args Package build arguments.
		 *
		 * @return void
		 */
		public static function register_package_build( $args ) {}
	}
}
