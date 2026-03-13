<?php
/**
 * Code Block
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

require_once __DIR__ . '/class-code-block-html-replacer.php';

use WP_Theme_JSON;

/**
 * Code Block class.
 *
 * Contains necessary functionality for the Code Block.
 */
abstract class Code_Block {
	const MODULE_PREFIX = '@a8cCodeBlock/';

	/**
	 * Language names for display.
	 *
	 * @var array<string, string>
	 */
	public static $language_name_rewrites = array(
		'Brainfuck' => 'Brainf***',
	);

	/**
	 * Filterable check for whether the block should be available.
	 *
	 * @return bool
	 */
	private static function should_load_block(): bool {
		$filtered_value = apply_filters( 'jetpack_mu_wpcom_should_load_code_block', true );
		return \is_bool( $filtered_value ) ? $filtered_value : false;
	}

	/**
	 * Check if the build assets required for the code block are available.
	 *
	 * @return bool
	 */
	private static function assets_available(): bool {
		static $result = null;
		if ( null === $result ) {
			$block_definition_asset_readable = is_readable( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.asset.php' );
			$module_asset_readable           = is_readable( Jetpack_Mu_Wpcom::BASE_DIR . 'build-module/assets.php' );
			$editor_style_asset_readable     = is_readable( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.asset.php' );
			$style_asset_readable            = is_readable( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-style/wpcom-blocks-code-style.asset.php' );

			$result = $block_definition_asset_readable && $module_asset_readable && $editor_style_asset_readable && $style_asset_readable;
			if ( ! $result && \defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';
				$data = array(
					'blog_id' => get_current_blog_id(),
				);

				$message = 'Missing build asset files.';
				if ( ! $block_definition_asset_readable ) {
					$message .= ' Block definition asset file is missing `' . Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.asset.php`.';
				}
				if ( ! $module_asset_readable ) {
					$message .= ' Module asset file is missing `' . Jetpack_Mu_Wpcom::BASE_DIR . 'build-module/assets.php`.';
				}
				if ( ! $editor_style_asset_readable ) {
					$message .= ' Editor style asset file is missing `' . Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.asset.php`.';
				}
				if ( ! $style_asset_readable ) {
					$message .= ' Style asset file is missing `' . Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-style/wpcom-blocks-code-style.asset.php`.';
				}

				log2logstash(
					array(
						'feature' => 'jetpack-enhanced-code-block',
						'message' => $message,
						'extra'   => wp_json_encode( $data, JSON_UNESCAPED_SLASHES ),
					)
				);
			}
		}
		return $result;
	}

	/**
	 * Set up the block.
	 */
	public static function setup() {
		if (
			! self::should_load_block() ||
			! self::assets_available()
		) {
			return;
		}

		add_action( 'after_setup_theme', array( __CLASS__, 'after_setup_theme' ), 100 );
		add_filter( 'register_block_type_args', array( __CLASS__, 'register_block_type_args' ), 150, 2 );
	}

	/**
	 * Registration of editor scripts, styles, and modules.
	 *
	 * Called lazily when editor assets are needed, not on every request.
	 */
	private static function register_editor_assets() {
		static $done = false;
		if ( $done ) {
			return;
		}
		$done = true;

		$block_definition_asset_file  = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.asset.php';
		$jetpack_wpcom_modules_assets = self::get_module_asset_data();

		// The block definition must contain the script dependencies that the edit function script module requires.
		// Append static dependency list here. Some duplicates may appear, that should be harmless.
		$block_definition_dependencies = array_merge(
			$block_definition_asset_file['dependencies'],
			array(
				'react',
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-data',
				'wp-editor',
				'wp-i18n',
				'wp-keycodes',
			)
		);

		wp_register_script(
			self::MODULE_PREFIX . 'block-definition',
			plugins_url( 'build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.js', Jetpack_Mu_Wpcom::BASE_FILE ),
			$block_definition_dependencies,
			$block_definition_asset_file['version'],
			array( 'in_footer' => true )
		);

		wp_register_script_module(
			self::MODULE_PREFIX . 'block-edit-function',
			plugins_url( 'build-module/wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js', Jetpack_Mu_Wpcom::BASE_FILE ),
			$jetpack_wpcom_modules_assets['wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js']['dependencies'],
			$jetpack_wpcom_modules_assets['wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js']['version']
		);

		$editor_style_asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.asset.php';
		wp_register_style(
			self::MODULE_PREFIX . 'editor',
			plugins_url( 'build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.css', Jetpack_Mu_Wpcom::BASE_FILE ),
			array(),
			$editor_style_asset_file['version']
		);

		$block_worker_url     = plugins_url( 'build-module/wpcom-blocks-code-worker/wpcom-blocks-code-worker.js', Jetpack_Mu_Wpcom::BASE_FILE );
		$block_worker_version = $jetpack_wpcom_modules_assets['wpcom-blocks-code-worker/wpcom-blocks-code-worker.js']['version'];
		add_filter(
			'script_module_data_' . self::MODULE_PREFIX . 'block-edit-function',
			function ( array $data ) use ( $block_worker_url, $block_worker_version ): array {
				$data['workerUrl']     = $block_worker_url;
				$data['workerVersion'] = $block_worker_version;
				return $data;
			}
		);
	}

	/**
	 * Enqueue view script module.
	 */
	private static function enqueue_view_assets() {
		static $done = false;
		if ( $done ) {
			return;
		}
		$done = true;

		$jetpack_wpcom_modules_assets = self::get_module_asset_data();
		wp_enqueue_script_module(
			self::MODULE_PREFIX . 'block-front',
			plugins_url( 'build-module/wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js', Jetpack_Mu_Wpcom::BASE_FILE ),
			$jetpack_wpcom_modules_assets['wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js']['dependencies'],
			$jetpack_wpcom_modules_assets['wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js']['version']
		);
	}

	/**
	 * Get the module asset data.
	 *
	 * @return array
	 */
	private static function get_module_asset_data() {
		static $jetpack_wpcom_modules_assets = null;
		if ( null === $jetpack_wpcom_modules_assets ) {
			$jetpack_wpcom_modules_assets = include Jetpack_Mu_Wpcom::BASE_DIR . 'build-module/assets.php';
		}
		return $jetpack_wpcom_modules_assets;
	}

	/**
	 * Set up the block view styles.
	 *
	 * Core's `wp-block-code` handle must be used in order to work with the global styles system.
	 * It relies on checking whether this style is enqueued to add the associated global styles to the page.
	 *
	 * Instead of using a different style handle, replace the registered style for `wp-block-code`.
	 *
	 * @see https://core.trac.wordpress.org/browser/tags/6.8.3/src/wp-includes/global-styles-and-settings.php#L322
	 *
	 * @global \WP_Styles $wp_styles
	 */
	public static function override_block_style() {
		global $wp_styles;

		$src = plugins_url( 'build/wpcom-blocks-code-style/wpcom-blocks-code-style.css', Jetpack_Mu_Wpcom::BASE_FILE );
		// Skip work if style is registered as desired.
		if ( isset( $wp_styles->registered['wp-block-code'] ) && $wp_styles->registered['wp-block-code']->src === $src ) {
			return;
		}

		$was_enqueued = wp_style_is( 'wp-block-code', 'enqueued' );
		wp_deregister_style( 'wp-block-code' );

		$style_asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-blocks-code-style/wpcom-blocks-code-style.asset.php';
		$version          = $style_asset_file['version'];

		wp_register_style(
			'wp-block-code',
			$src,
			array(),
			$version
		);
		if ( $was_enqueued ) {
			wp_enqueue_style( 'wp-block-code' );
		}
	}

	/**
	 * Filter for block registration to modify the core/code block.
	 *
	 * @param array  $args The block type arguments.
	 * @param string $block_type The block type name.
	 *
	 * @return array The modified block type arguments.
	 */
	public static function register_block_type_args( array $args, string $block_type ): array {
		if (
			'core/code' !== $block_type

			// In some cases the block may not include the content attribute.
			// Only perform enhancement on the _full_, expected block.
			|| ! isset( $args['attributes']['content'] )

			// Skip if the block is already processed.
			|| $args['render_callback'] === array( __CLASS__, 'render_block' )
		) {
			return $args;
		}

		// Register assets and hooks only when overriding the block.
		self::register_editor_assets();
		self::override_block_style();

		static $hooks_registered = false;
		if ( ! $hooks_registered ) {
			$hooks_registered = true;
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );
			add_action(
				'wp_enqueue_scripts',
				function () {
					if ( wp_should_load_block_editor_scripts_and_styles() ) {
						self::enqueue_editor_assets();
					}

					/*
					 * Core should handle this, but Script Module assets are not currently handled.
					 */
					if (
						! wp_should_load_block_assets_on_demand()
						&& has_block( 'core/code' )
					) {
						self::enqueue_view_assets();
					}
				}
			);
		}

		$args['render_callback']       = array( __CLASS__, 'render_block' );
		$args['editor_script_handles'] = array_merge( array( self::MODULE_PREFIX . 'block-definition' ), $args['editor_script_handles'] ?? array() );

		$args['editor_style_handles'] = array( self::MODULE_PREFIX . 'editor' );
		$args['style_handles']        = array( 'wp-block-code' );
		unset( $args['view_style_handles'] );

		/*
		 * Add selectors for typography targetting problematic elements.
		 *
		 * - The descendent PRE element needs font-family styling like this to ensure it receives
		 *   user agent default styling like monospace, as well as PRE element styling from themes,
		 *   and can also be styled by global styles and theme.json.
		 */
		$args['selectors'] = array(
			'root'       => '.wp-block-code',
			'typography' => array(

				/*
				 * These are experimental at the moment. The camelCase form appears to be used, but
				 * it's possible the kebab-case currently used in documentation may be used when
				 * they're stabilized.
				 */
				'fontFamily'  => '.wp-block-code, .wp-block-code pre',
				'font-family' => '.wp-block-code, .wp-block-code pre',
			),
		);

		/**
		 * Typography support:
		 *
		 * Line height and letter spacing may be problematic for rendering in the editor,
		 * line numbers, etc. Disable them.
		 *
		 * Text decoration is problematic with additional UI elements like buttons and
		 * line numbers. Disable.
		 */
		if ( isset( $args['supports']['typography'] ) && \is_array( $args['supports']['typography'] ) ) {
			$args['supports']['typography']['lineHeight']                   = false;
			$args['supports']['typography']['__experimentalLetterSpacing']  = false;
			$args['supports']['typography']['letterSpacing']                = false;
			$args['supports']['typography']['__experimentalTextDecoration'] = false;
			$args['supports']['typography']['textDecoration']               = false;
		} else {
			$args['supports']['typography'] = array(
				'fontSize'                      => true,
				'lineHeight'                    => false,

				// Currently experimental, but include likely stable forms as well.
				'__experimentalFontFamily'      => true,
				'__experimentalFontWeight'      => true,
				'__experimentalFontStyle'       => true,
				'__experimentalTextTransform'   => true,
				'fontFamily'                    => true,
				'fontWeight'                    => true,
				'fontStyle'                     => true,
				'textTransform'                 => true,

				'__experimentalDefaultControls' => array(
					'fontSize' => true,
				),
				'defaultControls'               => array(
					'fontSize' => true,
				),
			);
		}

		$args['attributes'] = array(
			// Content attribute is preserved for compatibility with the core/code block and transforms.
			'content'                 => $args['attributes']['content'],
			'tokenizedLines'          => array(
				'type'    => 'array',
				'default' =>
				array(),
			),
			'language'                => array(
				'type'    => 'string',
				'default' => '',
			),
			'languageConfidence'      => array(
				'type'    => 'string',
				'default' => 'unknown',
			),
			'triggerCodeUpdate'       => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'showCopyButton'          => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'showLanguageName'        => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'showLineNumbers'         => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'lineNumbersStartAt'      => array(
				'type'    => 'number',
				'default' => 1,
			),
			'filename'                => array(
				'type'    => 'string',
				'default' => '',
			),
			'colorComment'            => array(
				'type' => 'string',
			),
			'colorKeyword'            => array(
				'type' => 'string',
			),
			'colorBoolean'            => array(
				'type' => 'string',
			),
			'colorLiteral'            => array(
				'type' => 'string',
			),
			'colorString'             => array(
				'type' => 'string',
			),
			'colorSpecialString'      => array(
				'type' => 'string',
			),
			'colorMacroName'          => array(
				'type' => 'string',
			),
			'colorVariableDefinition' => array(
				'type' => 'string',
			),
			'colorTypeName'           => array(
				'type' => 'string',
			),
			'colorClassName'          => array(
				'type' => 'string',
			),
			'colorInvalid'            => array(
				'type' => 'string',
			),
		);
		$args['textdomain'] = 'jetpack-mu-wpcom';

		return $args;
	}

	/**
	 * Enqueue plugin assets necessary for the block editor.
	 */
	public static function enqueue_editor_assets() {
		static $done = false;
		if ( $done ) {
			return;
		}
		$done = true;

		/*
		 * The code block registration script depends on some script modules.
		 * This "dummy" module ensures those dependencies are available.
		 */
		wp_enqueue_script_module(
			self::MODULE_PREFIX . 'dummy',
			plugins_url( 'empty.js', __FILE__ ),
			array(
				array(
					'import' => 'dynamic',
					'id'     => self::MODULE_PREFIX . 'block-edit-function',
				),
			),
			'0.0.0' // This script never needs to be cache busted. It will never change.
		);
	}

	/**
	 * Render the block.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content The block content.
	 */
	public static function render_block( array $attributes, string $content ): string {
		if ( empty( $attributes['tokenizedLines'] ) || ! \is_array( $attributes['tokenizedLines'] ) ) {
			return $content;
		}

		$processed_content = Code_Block_HTML_Replacer::get_updated_html_with_replaced_content( $content, $attributes['tokenizedLines'], $attributes['language'] );
		if ( null === $processed_content ) {
			return $content;
		}
		list( $code_string, $replaced_content ) = $processed_content;

		$extra_attrs      = array();
		$style_properties = array();

		if ( $attributes['showCopyButton'] ?? false ) {
			self::enqueue_view_assets();
		}

		$show_line_numbers = $attributes['showLineNumbers'] ?? false;
		if ( $show_line_numbers ) {
			$extra_attrs['class']  = 'show-line-numbers';
			$line_numbers_start_at = isset( $attributes['lineNumbersStartAt'] )
				? max( 0, min( 10000, (int) $attributes['lineNumbersStartAt'] ) )
				: 1;

			$max_line_number_width = floor(
				log10( $line_numbers_start_at + \count( $attributes['tokenizedLines'] ) - 1 )
			) + 1;

			if ( $line_numbers_start_at !== 1 ) {
				$style_properties[] = '--line-numbers-start-at: ' . $line_numbers_start_at;
			}
			$style_properties[] = '--line-number-gutter-width: ' . $max_line_number_width . 'ch';
		}

		$color_attributes = array(
			'colorComment',
			'colorKeyword',
			'colorBoolean',
			'colorLiteral',
			'colorString',
			'colorSpecialString',
			'colorMacroName',
			'colorVariableDefinition',
			'colorTypeName',
			'colorClassName',
			'colorInvalid',
		);
		foreach ( $color_attributes as $color_attr ) {
			if ( ! empty( $attributes[ $color_attr ] ) ) {
				$style_properties[] = "--{$color_attr}: {$attributes[ $color_attr ]}";
			}
		}

		if ( isset( $attributes['backgroundColor'] ) ) {
			$style_properties[] = "--colorBackground: var( --wp--preset--color--{$attributes['backgroundColor']} )";
		} elseif ( isset( $attributes['style']['color']['background'] ) ) {
			$style_properties[] = "--colorBackground: {$attributes['style']['color']['background']}";
		}

		if ( isset( $attributes['textColor'] ) ) {
			$style_properties[] = "--colorText: var( --wp--preset--color--{$attributes['textColor']} )";
		} elseif ( isset( $attributes['style']['color']['text'] ) ) {
			$style_properties[] = "--colorText: {$attributes['style']['color']['text']}";
		}

		if ( ! empty( $style_properties ) ) {
			$extra_attrs['style'] = implode( '; ', $style_properties ) . ';';
		}

		$attrs = get_block_wrapper_attributes( $extra_attrs );

		$filename_html = ( ! empty( $attributes['filename'] ) )
			? \sprintf( '<span class="a8c/code__filename">%s</span>', esc_html( $attributes['filename'] ) )
			: '';

		$copy_html = ( $attributes['showCopyButton'] ?? false )
			? \sprintf(
				'<button class="%s element-button a8c/code__btn-copy" type="button" data-copy-text="%s" hidden>%s</button>',
				WP_Theme_JSON::get_element_class_name( 'button' ),
				esc_attr( $code_string ),
				esc_html__( 'Copy', 'jetpack-mu-wpcom' )
			)
			: '';

		$language_html = '';
		if ( $attributes['showLanguageName'] ?? false ) {
			$language_text = empty( $attributes['language'] )
				? __( 'Plain text', 'jetpack-mu-wpcom' )
				: $attributes['language'];
			$language_text = self::$language_name_rewrites[ $language_text ] ?? $language_text;
			$language_html = \sprintf(
				'<span>%s</span>',
				esc_html( $language_text )
			);
		}

		$header_right_html = ( $copy_html || $language_html )
			? "<div class=\"a8c/code__header-right\">{$copy_html}{$language_html}</div>"
			: '';
		$header_html       = ( $filename_html || $header_right_html )
			? "\n\t<div class=\"a8c/code__header\">{$filename_html}{$header_right_html}</div>"
			: '';

		$output = <<<HTML
<div {$attrs}>{$header_html}
	<div class="cm-editor">
		<div class="cm-scroller">
			{$replaced_content}
		</div>
	</div>
</div>
HTML;

		return $output;
	}

	/**
	 * Hook to allow the dummy script module to inject its dependencies into the importmap.
	 *
	 * Create an opportunity between printing the importmap and printing modules
	 * in order to prevent printing the dummy module.
	 *
	 * This is not essential, but does save some HTML on the page and a network request.
	 * The dummy module is only used to signal that some additional modules
	 * should be included in the importmap.
	 */
	public static function after_setup_theme() {
		foreach ( array( 'wp_head', 'wp_footer', 'admin_print_footer_scripts' ) as $hook ) {
			/*
			 * Script module actions are expected in this order:
			 *
			 * - WP_Script_Modules::print_import_map
			 * - WP_Script_Modules::print_script_module_preloads
			 * - WP_Script_Modules::print_enqueued_script_modules
			 *
			 * Attempt to remove actions starting from the end to that if a removal fails,
			 * the action can be restored to the expected position by adding it again.
			 */
			if ( ! remove_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ) ) ) {
				continue;
			}
			if ( ! remove_action( $hook, array( wp_script_modules(), 'print_enqueued_script_modules' ) ) ) {
				add_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ) );
				continue;
			}

			add_action(
				$hook,
				function () {
					wp_script_modules()->dequeue( self::MODULE_PREFIX . 'dummy' );
				},
				15
			);
			add_action( $hook, array( wp_script_modules(), 'print_enqueued_script_modules' ), 20 );
			add_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ), 20 );
			add_action(
				$hook,
				function () {
					wp_script_modules()->enqueue( self::MODULE_PREFIX . 'dummy' );
				},
				25
			);
		}
	}
}
