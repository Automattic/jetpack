<?php
/**
 * Jetpack AI Assistant Block.
 *
 * @since 12.2
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AIAssistant;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Gutenberg;

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
	( ( new Host() )->is_wpcom_simple()
		|| ! ( new Status() )->is_offline_mode()
	) && apply_filters( 'jetpack_ai_enabled', true )
	) {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Jetpack AI Assistant block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Jetpack AI Assistant block attributes.
 * @param string $content String containing the Jetpack AI Assistant block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$content
	);
}

/**
 * Retrieve the Chrome trial AI token for use with the Chrome AI feature.
 * This ultimately sets an Origin-Trial header with the token.
 */
function add_chrome_ai_token_headers() {
	$token_transient_names = array( 'jetpack-ai-chrome-ai-translation-token', 'jetpack-ai-chrome-ai-summarization-token' );

	foreach ( $token_transient_names as $token_transient_name ) {
		$cached_token = get_transient( $token_transient_name );

		if ( ! $cached_token ) {
			$blog_id = \Jetpack_Options::get_option( 'id' );

			// get the token from wpcom
			$wpcom_request = Client::wpcom_json_api_request_as_user(
				sprintf( '/sites/%d/jetpack-ai/ai-assistant-feature', $blog_id ),
				'v2',
				array(
					'method'  => 'GET',
					'headers' => array(
						'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
					),
					'timeout' => 30,
				),
				null,
				'wpcom'
			);

			$response_code = wp_remote_retrieve_response_code( $wpcom_request );
			if ( 200 === $response_code ) {
				$ai_assistant_feature_data = json_decode( wp_remote_retrieve_body( $wpcom_request ), true );

				if ( ! empty( $ai_assistant_feature_data['chrome-ai-token'] ) ) {
					set_transient(
						$token_transient_name,
						$ai_assistant_feature_data['chrome-ai-token'],
						3600 // cache for an hour, but this can probably be longer
					);

					$cached_token = $ai_assistant_feature_data['chrome-ai-token'];
				}
			}
		}

		if ( $cached_token ) {
			echo '<meta http-equiv="origin-trial" content="' . esc_attr( $cached_token ) . '">';
		}
	}
}

/**
 * Register extensions.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-form-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-content-lens' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-backend-prompts' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-usage-panel' );
			Jetpack_Gutenberg::set_extension_available( 'ai-featured-image-generator' );
			Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-experimental-image-generation-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-general-purpose-image-generator' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-site-logo-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization-keywords-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-image-extension' );

			if ( apply_filters( 'breve_enabled', true ) ) {
				Jetpack_Gutenberg::set_extension_available( 'ai-proofread-breve' );
			}

			if ( apply_filters( 'ai_seo_enhancer_enabled_unrestricted', false ) ) {
				Jetpack_Gutenberg::set_extension_available( 'ai-seo-enhancer-enabled-unrestricted' );
				Jetpack_Gutenberg::set_extension_available( 'ai-seo-enhancer' );
			} elseif ( apply_filters( 'ai_seo_enhancer_enabled', false ) ) {
				Jetpack_Gutenberg::set_availability_for_plan( 'ai-seo-enhancer' );
			}
		}
	}
);

/**
 * Register the `ai-list-to-table-transform` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'list_to_table_transform_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-list-to-table-transform' );
		}
	}
);

/**
 * Register the `ai-response-feedback` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'ai_response_feedback_enabled', true )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-response-feedback' );
		}
	}
);

/**
 * Register the `ai-seo-assistant` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'ai_seo_assistant_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-seo-assistant' );
		}
	}
);

/**
 * Register the `ai-use-chrome-ai-sometimes` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'ai_chrome_ai_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-use-chrome-ai-sometimes' );
			add_chrome_ai_token_headers();
		}
	}
);
