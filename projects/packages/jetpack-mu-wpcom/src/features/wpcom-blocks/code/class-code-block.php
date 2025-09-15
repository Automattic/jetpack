<?php
/**
 * Code Block
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

use WP_HTML_Processor;
use WP_HTML_Text_Replacement;
use WP_Theme_JSON;

/**
 * Code Block class.
 *
 * Contains necessary functionality for the Code Block.
 */
abstract class Code_Block {
	const VERSION       = '2.1';
	const MODULE_PREFIX = '@a8cCodeBlock/';
	const BLOCK_NAME    = 'a8c/code';

	private static function should_load_block(): bool {
		$filtered_value = apply_filters( 'jetpack_mu_wpcom_should_load_code_block', false );
		return is_bool( $filtered_value ) ? $filtered_value : false;
	}

	public static function setup() {
		if ( ! self::should_load_block() ) {
			return;
		}

		self::init();
		add_action( 'wp_loaded', array( __CLASS__, 'register_block' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );

		// Core should handle this, but Script Module assets are not currently handled.
		add_action(
			'wp_enqueue_scripts',
			function () {
				if ( wp_should_load_block_editor_scripts_and_styles() ) {
					self::enqueue_editor_assets();
				}

				if ( ! wp_should_load_block_assets_on_demand() ) {
					wp_enqueue_script_module( self::MODULE_PREFIX . 'block-front' );
				}
			}
		);
		add_action( 'after_setup_theme', array( __CLASS__, 'after_setup_theme' ), 100 );
	}

	/** Set up the plugin. */
	private static function init() {
		wp_register_script(
			self::MODULE_PREFIX . 'block-definition',
			plugins_url( '../../../build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.js', __FILE__ ),
			array(
				'react',
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-data',
				'wp-editor',
				'wp-i18n',
				'wp-keycodes',
			),
			self::get_version( '../../../build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.js' )
		);

		wp_register_script_module(
			self::MODULE_PREFIX . 'block-edit-function',
			plugins_url( '../../../build-module/wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js', __FILE__ ),
			array(
				// This module is used for a Worker.
				// The module is not intended to actually be imported,
				// but this is a convenient way to pass the module URL
				// that is required to initialize the Worker.
				//
				// @TODO: Pass this as module data.
				array(
					'import' => 'dynamic',
					'id'     => self::MODULE_PREFIX . 'block-worker',
				),
			),
			self::get_version( '../../../build-module/wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js' )
		);

		wp_register_script_module(
			self::MODULE_PREFIX . 'block-worker',
			plugins_url( '../../../build-module/wpcom-blocks-code-worker/wpcom-blocks-code-worker.js', __FILE__ ),
			array(),
			self::get_version( '../../../build-module/wpcom-blocks-code-worker/wpcom-blocks-code-worker.js' )
		);

		wp_register_style(
			self::MODULE_PREFIX . 'editor',
			plugins_url( 'editor.css', __FILE__ ),
			array(),
			self::get_version( 'editor.css' )
		);

		wp_register_style(
			self::MODULE_PREFIX . 'style',
			plugins_url( 'a8c-code-block.css', __FILE__ ),
			array(),
			self::get_version( 'a8c-code-block.css' )
		);

		wp_register_script_module(
			self::MODULE_PREFIX . 'block-front',
			plugins_url( '../../../build-module/wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js', __FILE__ ),
			array(),
			self::get_version( '../../../build-module/wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js' )
		);
		add_filter(
			'script_module_data_' . self::MODULE_PREFIX . 'block-front',
			function ( array $data ): array {
				$data['i18n.Copy'] = __( 'Copy', 'jetpack-mu-wpcom' );
				return $data;
			}
		);
	}

	/** Register the block. */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/common/block.json',
			array(
				'editor_script'   => self::MODULE_PREFIX . 'block-definition',
				'editor_style'    => self::MODULE_PREFIX . 'editor',
				'style'           => self::MODULE_PREFIX . 'style',
				'render_callback' => array( __CLASS__, 'render_block' ),
			)
		);
	}

	/**
	 * Enqueue plugin assets necessary for the block editor.
	 */
	public static function enqueue_editor_assets() {
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
		if ( ! isset( $attributes['tokenizedLines'] ) ) {
			return $content;
		}

		$replacement_code_data = $attributes['tokenizedLines'];

		$replacer                             = Code_Block_Code_Replacer::create_fragment( $content );
		list($code_string, $replaced_content) = $replacer->get_updated_html_with_replaced_content( $replacement_code_data );

		if ( null === $replaced_content ) {
			return $content;
		}

		$extra_attrs      = array();
		$style_properties = array();

		if ( isset( $attributes['showCopyButton'] ) ) {
			wp_enqueue_script_module( self::MODULE_PREFIX . 'block-front' );
		}

		$show_line_numbers = isset( $attributes['showLineNumbers'] );
		if ( $show_line_numbers && ! empty( $attributes['tokenizedLines'] ) ) {
			$extra_attrs['class']  = 'show-line-numbers';
			$line_numbers_start_at = isset( $attributes['lineNumbersStartAt'] )
				? max( 0, min( 10000, (int) $attributes['lineNumbersStartAt'] ) )
				: 1;

			$max_line_number_width = floor(
				log10( $line_numbers_start_at + ( count( $attributes['tokenizedLines'] ) - 1 ) )
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
				$style_properties[] = "--{$color_attr}: {$attributes[ $color_attr ]};";
			}
		}

		if ( isset( $attributes['backgroundColor'] ) ) {
			$style_properties[] = "--colorBackground: var( --wp--preset--color--{$attributes['backgroundColor']} );";
		} elseif ( isset( $attributes['style']['color']['background'] ) ) {
			$style_properties[] = "--colorBackground: {$attributes['style']['color']['background']};";
		}

		if ( isset( $attributes['textColor'] ) ) {
			$style_properties[] = "--colorText: var( --wp--preset--color--{$attributes['textColor']} );";
		} elseif ( isset( $attributes['style']['color']['text'] ) ) {
			$style_properties[] = "--colorText: {$attributes['style']['color']['text']};";
		}

		if ( ! empty( $style_properties ) ) {
			$extra_attrs['style'] = implode( '; ', $style_properties );
		}

		$attrs = get_block_wrapper_attributes( $extra_attrs );

		$filename_html = ! empty( $attributes['filename'] )
			? sprintf( '<span class="a8c/code__filename">%s</span>', esc_html( $attributes['filename'] ) )
			: '';

		$copy_html = isset( $attributes['showCopyButton'] )
			? sprintf(
				'<button class="%s element-button a8c/code__btn-copy" type="button" data-copy-text="%s" hidden>%s</button>',
				WP_Theme_JSON::get_element_class_name( 'button' ),
				esc_attr( $code_string ),
				esc_html__( 'Copy', 'jetpack-mu-wpcom' ),
			)
			: '';

		$language_html = isset( $attributes['showLanguageName'] ) && ! empty( $attributes['language'] )
			? sprintf( '<span>%s</span>', esc_html( $attributes['language'] ) )
			: '';

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
	 *
	 * @TODO: Be safer. Check the return (bool: was removed) and behave accordingly.
	 */
	public static function after_setup_theme() {
		foreach ( array( 'wp_head', 'wp_footer', 'admin_print_footer_scripts' ) as $hook ) {
			remove_action( $hook, array( wp_script_modules(), 'print_enqueued_script_modules' ) );
			remove_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ) );

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

	/**
	 * The the version for a given file.
	 * This is helpful for block development to provide file modified time versions.
	 *
	 * @param string $path The file path relative to the plugin root.
	 */
	private static function get_version( string $path ): string {
		if ( ! WP_DEBUG ) {
			return self::VERSION;
		}
		return (string) filemtime( plugin_dir_path( __FILE__ ) . $path );
	}
}

/**
 * Safely replace block HTML content with tokenized HTML.
 */
// phpcs:ignore
class Code_Block_Code_Replacer extends WP_HTML_Processor {
	/**
	 * Replace the code placeholder.
	 *
	 * This method does not perform any safety checking on the provided HTML.
	 *
	 * @param array $tokenized_code_data The tokenized code data.
	 * @return null|array{0: string, 1: string}
	 */
	public function get_updated_html_with_replaced_content( array $tokenized_code_data ): ?array {
		// Find the location for insertion.
		if ( ! $this->next_tag( 'CODE' ) ) {
			return null;
		}
		$this->set_bookmark( 'code_block_html_replace_start' );

		// The code should be 1 HTML CODE element containing the text.
		// <code>### text ###</code>.
		if (
			! $this->next_token() ||
			! $this->get_token_type() === '#text'
		) {
			return null;
		}
		$code_string = $this->get_modifiable_text();
		if (
			! $this->next_token() ||
			! $this->get_tag() === 'CODE' ||
			! $this->is_tag_closer()
		) {
			return null;
		}
		$this->set_bookmark( 'code_block_html_replace_end' );

		if ( ! isset(
			$this->bookmarks['_code_block_html_replace_start'],
			$this->bookmarks['_code_block_html_replace_end']
		) ) {
			return null;
		}

		/** @todo make this an array */
		$replacement_code_html = '';
		foreach ( $tokenized_code_data as $line ) {
			$replacement_code_html .= '<div class="cm-line">';
			foreach ( $line as $chunk ) {
				$code = base64_decode( $chunk[0], true );
				if ( false === $code ) {
					continue;
				}
				$class = $chunk[1] ?? null;

				if ( ! $class ) {
					$replacement_code_html .= esc_html( $code );
				} else {
					$replacement_code_html .= sprintf(
						'<span class="%s">%s</span>',
						esc_attr( $class ),
						_wp_specialchars(
							$code,
							ENT_NOQUOTES,
							false,
							true // Double-encode, yes. Do not attempt to normalize this text.
						)
					);
				}
			}
			$replacement_code_html .= '</div>';
		}

		// We'll start at the end of the CODE opener.
		$bm_start = $this->bookmarks['_code_block_html_replace_start'];
		$bm_end   = $this->bookmarks['_code_block_html_replace_end'];
		$start    = $bm_start->start + $bm_start->length;
		$length   = $bm_end->start - $start;

		$this->lexical_updates[] = new WP_HTML_Text_Replacement(
			$start,
			$length,
			$replacement_code_html
		);

		return array( $code_string, $this->get_updated_html() );
	}
}
