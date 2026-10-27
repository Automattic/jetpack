<?php
/**
 * Catalog of the triggers and actions Jetpack Flow can connect.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Describes every trigger and action: its label, product, config fields, and whether it is usable on this site.
 */
class Catalog {

	/**
	 * Plugins a trigger or action can depend on, keyed by the slug used in `requires`.
	 *
	 * @return array<string,array{name:string,file:string}>
	 */
	public static function plugins() {
		return array(
			'jetpack'     => array(
				'name' => 'Jetpack',
				'file' => 'jetpack/jetpack.php',
			),
			'woocommerce' => array(
				'name' => 'WooCommerce',
				'file' => 'woocommerce/woocommerce.php',
			),
			'mailpoet'    => array(
				'name' => 'MailPoet',
				'file' => 'mailpoet/mailpoet.php',
			),
			'akismet'     => array(
				'name' => 'Akismet',
				'file' => 'akismet/akismet.php',
			),
			'zero-bs-crm' => array(
				'name' => 'Jetpack CRM',
				'file' => 'zero-bs-crm/ZeroBSCRM.php',
			),
		);
	}

	/**
	 * Trigger definitions keyed by ID.
	 *
	 * `hook` and `args` wire the trigger to a WordPress action. Triggers without one fire through
	 * `do_action( 'jetpack_flow_event', $id, $payload )`, the inbound events endpoint, or Engine internals.
	 *
	 * @return array<string,array>
	 */
	public static function triggers() {
		$jetpack_forms = class_exists( '\Automattic\Jetpack\Forms\ContactForm\Feedback' );
		$jetpack_news  = class_exists( 'Jetpack_Subscriptions' );
		$podcast       = class_exists( '\Automattic\Jetpack\Podcast\Feed\Customize_Feed' );
		$woo           = class_exists( 'WooCommerce' );
		$crm           = function_exists( 'zeroBSCRM_install_core' ) || defined( 'ZBS_ROOTFILE' );
		$akismet       = class_exists( 'Akismet' );

		$form_tokens  = array( 'name', 'email', 'message', 'form_title', 'entry_url' );
		$order_tokens = array( 'order_id', 'order_total', 'currency', 'email', 'name', 'products' );
		$post_tokens  = array( 'post_id', 'post_title', 'post_url', 'author_name', 'author_email' );
		$spam_tokens  = array( 'name', 'email', 'message' );

		$triggers = array(
			'post_published'            => array(
				'label'       => __( 'New post published', 'jetpack-flow-pkg' ),
				'description' => __( 'A post is published.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'hook'        => 'transition_post_status',
				'args'        => 3,
				'tokens'      => $post_tokens,
				'available'   => true,
			),
			'page_published'            => array(
				'label'       => __( 'New page published', 'jetpack-flow-pkg' ),
				'description' => __( 'A page is published.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'hook'        => 'transition_post_status',
				'args'        => 3,
				'tokens'      => $post_tokens,
				'available'   => true,
			),
			'user_registered'           => array(
				'label'       => __( 'New user added', 'jetpack-flow-pkg' ),
				'description' => __( 'A new user account is created.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'hook'        => 'user_register',
				'args'        => 1,
				'tokens'      => array( 'user_id', 'name', 'email', 'username' ),
				'available'   => true,
			),
			'plugin_update_available'   => array(
				'label'       => __( 'Plugin update available', 'jetpack-flow-pkg' ),
				'description' => __( 'WordPress finds a new version of an installed plugin.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'tokens'      => array( 'plugin', 'version' ),
				'available'   => true,
			),
			'wp_update_available'       => array(
				'label'       => __( 'WordPress update available', 'jetpack-flow-pkg' ),
				'description' => __( 'A new version of WordPress is available.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'tokens'      => array( 'version' ),
				'available'   => true,
			),
			'comment_posted'            => array(
				'label'       => __( 'New comment', 'jetpack-flow-pkg' ),
				'description' => __( 'A visitor leaves a comment.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'hook'        => 'comment_post',
				'args'        => 2,
				'tokens'      => array( 'name', 'email', 'message', 'post_title', 'post_url' ),
				'available'   => true,
			),
			'schedule_daily'            => array(
				'label'       => __( 'Every day', 'jetpack-flow-pkg' ),
				'description' => __( 'Runs once a day.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'tokens'      => array( 'date' ),
				'available'   => true,
			),
			'form_submitted'            => array(
				'label'       => __( 'Form submitted', 'jetpack-flow-pkg' ),
				'description' => __( 'Someone submits a Jetpack Form.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'hook'        => 'grunion_after_feedback_post_inserted',
				'args'        => 4,
				'tokens'      => $form_tokens,
				'available'   => $jetpack_forms,
				'requires'    => 'jetpack',
			),
			'newsletter_subscribed'     => array(
				'label'       => __( 'New newsletter subscriber', 'jetpack-flow-pkg' ),
				'description' => __( 'A visitor subscribes through a Jetpack Subscribe form.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'hook'        => 'jetpack_subscriptions_form_submission',
				'args'        => 1,
				'tokens'      => array( 'email' ),
				'available'   => $jetpack_news,
				'requires'    => 'jetpack',
			),
			'podcast_episode_published' => array(
				'label'       => __( 'New podcast episode published', 'jetpack-flow-pkg' ),
				'description' => __( 'A post is published in your Jetpack Podcast category.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'hook'        => 'transition_post_status',
				'args'        => 3,
				'tokens'      => $post_tokens,
				'available'   => $podcast,
				'requires'    => 'jetpack',
			),
			'site_down'                 => array(
				'label'       => __( 'Site goes down', 'jetpack-flow-pkg' ),
				'description' => __( 'Jetpack Monitor reports downtime. Send the event to the inbound URL shown on the dashboard.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'tokens'      => array( 'site_url', 'reason' ),
				'available'   => true,
				'inbound'     => true,
			),
			'site_recovered'            => array(
				'label'       => __( 'Site is back up', 'jetpack-flow-pkg' ),
				'description' => __( 'Jetpack Monitor reports the site recovered.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'tokens'      => array( 'site_url', 'downtime' ),
				'available'   => true,
				'inbound'     => true,
			),
			'stats_spike'               => array(
				'label'       => __( 'Traffic spike', 'jetpack-flow-pkg' ),
				'description' => __( 'Stats show a sudden jump in visits. Send the event to the inbound URL shown on the dashboard.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'tokens'      => array( 'site_url', 'views', 'post_title' ),
				'available'   => true,
				'inbound'     => true,
			),
			'form_spam_caught'          => array(
				'label'       => __( 'Form submission held for spam', 'jetpack-flow-pkg' ),
				'description' => __( 'Akismet flags a Jetpack Form submission as spam.', 'jetpack-flow-pkg' ),
				'product'     => 'akismet',
				'hook'        => 'grunion_after_feedback_post_inserted',
				'args'        => 4,
				'tokens'      => $form_tokens,
				'available'   => $akismet && $jetpack_forms,
				'requires'    => $akismet ? 'jetpack' : 'akismet',
			),
			'comment_spam_caught'       => array(
				'label'       => __( 'Comment held for spam', 'jetpack-flow-pkg' ),
				'description' => __( 'Akismet flags a comment as spam.', 'jetpack-flow-pkg' ),
				'product'     => 'akismet',
				'hook'        => 'comment_post',
				'args'        => 2,
				'priority'    => 20,
				'tokens'      => $spam_tokens,
				'available'   => $akismet,
				'requires'    => 'akismet',
			),
			'payment_received'          => array(
				'label'       => __( 'Payment received', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce payment completes.', 'jetpack-flow-pkg' ),
				'product'     => 'woocommerce',
				'hook'        => 'woocommerce_payment_complete',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $woo,
				'requires'    => 'woocommerce',
			),
			'woo_product_purchased'     => array(
				'label'       => __( 'Product purchased', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce order is completed.', 'jetpack-flow-pkg' ),
				'product'     => 'woocommerce',
				'hook'        => 'woocommerce_order_status_completed',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $woo,
				'requires'    => 'woocommerce',
			),
			'woo_new_order'             => array(
				'label'       => __( 'New WooCommerce order', 'jetpack-flow-pkg' ),
				'description' => __( 'A WooCommerce order is placed.', 'jetpack-flow-pkg' ),
				'product'     => 'woocommerce',
				'hook'        => 'woocommerce_new_order',
				'args'        => 1,
				'tokens'      => $order_tokens,
				'available'   => $woo,
				'requires'    => 'woocommerce',
			),
			'crm_contact_created'       => array(
				'label'       => __( 'New CRM contact', 'jetpack-flow-pkg' ),
				'description' => __( 'A contact is added in Jetpack CRM.', 'jetpack-flow-pkg' ),
				'product'     => 'crm',
				'hook'        => 'zbs_new_customer',
				'args'        => 1,
				'tokens'      => array( 'contact_id', 'email', 'name' ),
				'available'   => $crm,
				'requires'    => 'zero-bs-crm',
			),
		);

		/**
		 * Filters the Flow trigger catalog.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $triggers Trigger definitions keyed by ID.
		 */
		return apply_filters( 'jetpack_flow_triggers', $triggers );
	}

	/**
	 * AI providers connected on the Connectors page, keyed by provider ID.
	 *
	 * @return array<string,string>
	 */
	public static function ai_providers() {
		$providers = array();

		if ( function_exists( 'wp_get_connectors' ) ) {
			foreach ( (array) wp_get_connectors() as $id => $connector ) {
				if ( 'ai_provider' === ( $connector['type'] ?? '' ) ) {
					$providers[ (string) $id ] = (string) ( $connector['name'] ?? $id );
				}
			}
		}

		// Keep only providers that have credentials, when the AI client can tell.
		if ( $providers && class_exists( '\WordPress\AiClient\AiClient' ) ) {
			try {
				$registry = \WordPress\AiClient\AiClient::defaultRegistry();
				foreach ( array_keys( $providers ) as $id ) {
					if ( $registry->hasProvider( $id ) && ! $registry->isProviderConfigured( $id ) ) {
						unset( $providers[ $id ] );
					}
				}
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Show every connector if the registry cannot be queried.
			}
		}

		return $providers;
	}

	/**
	 * Action definitions keyed by ID.
	 *
	 * @return array<string,array>
	 */
	public static function actions() {
		$text = static function ( $name, $label, $required = false, $type = 'text', $extra = array() ) {
			return array_merge(
				array(
					'name'     => $name,
					'label'    => $label,
					'type'     => $type,
					'required' => $required,
				),
				$extra
			);
		};
		$opts = static function ( $pairs ) {
			$out = array();
			foreach ( $pairs as $value => $label ) {
				$out[] = array(
					'value' => (string) $value,
					'label' => $label,
				);
			}
			return $out;
		};

		$http_formats = $opts(
			array(
				'json'       => 'JSON',
				'urlencoded' => 'URL-encoded',
			)
		);

		$abilities = array();
		if ( function_exists( 'wp_get_abilities' ) ) {
			foreach ( wp_get_abilities() as $ability ) {
				$abilities[ $ability->get_name() ] = $ability->get_label() ? $ability->get_label() : $ability->get_name();
			}
		}

		$ai_providers = self::ai_providers();
		$ai_ready     = function_exists( 'wp_ai_client_prompt' ) && ( $ai_providers || ! function_exists( 'wp_get_connectors' ) );
		$provider     = $text(
			'provider',
			__( 'AI provider', 'jetpack-flow-pkg' ),
			false,
			'select',
			array(
				'default' => '',
				'options' => $opts( array( '' => __( 'Automatic', 'jetpack-flow-pkg' ) ) + $ai_providers ),
			)
		);

		$actions = array(
			'email_user'             => array(
				'label'       => __( 'Email a user', 'jetpack-flow-pkg' ),
				'description' => __( 'Send an email to any user on this site, a role, or an address.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text(
						'recipient_type',
						__( 'Send to', 'jetpack-flow-pkg' ),
						true,
						'select',
						array(
							'default' => 'user',
							'options' => $opts(
								array(
									'user'          => __( 'A specific user', 'jetpack-flow-pkg' ),
									'role'          => __( 'Everyone with a role', 'jetpack-flow-pkg' ),
									'trigger_email' => __( 'The email from the trigger', 'jetpack-flow-pkg' ),
									'email'         => __( 'An email address', 'jetpack-flow-pkg' ),
								)
							),
						)
					),
					$text( 'user_id', __( 'User', 'jetpack-flow-pkg' ), false, 'user', array( 'showIf' => array( 'recipient_type' => 'user' ) ) ),
					$text(
						'role',
						__( 'Role', 'jetpack-flow-pkg' ),
						false,
						'role',
						array(
							'showIf'  => array( 'recipient_type' => 'role' ),
							'default' => 'administrator',
						)
					),
					$text( 'email', __( 'Email address', 'jetpack-flow-pkg' ), false, 'email', array( 'showIf' => array( 'recipient_type' => 'email' ) ) ),
					$text( 'subject', __( 'Subject', 'jetpack-flow-pkg' ), true ),
					$text( 'message', __( 'Message', 'jetpack-flow-pkg' ), true, 'textarea' ),
				),
				'available'   => true,
			),
			'create_draft'           => array(
				'label'       => __( 'Create a draft post', 'jetpack-flow-pkg' ),
				'description' => __( 'Save a draft post with the trigger data.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'title', __( 'Title', 'jetpack-flow-pkg' ), true ),
					$text( 'content', __( 'Content', 'jetpack-flow-pkg' ), false, 'textarea' ),
				),
				'available'   => true,
			),
			'create_draft_page'      => array(
				'label'       => __( 'Create a draft page', 'jetpack-flow-pkg' ),
				'description' => __( 'Save a draft page with the trigger data.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'title', __( 'Title', 'jetpack-flow-pkg' ), true ),
					$text( 'content', __( 'Content', 'jetpack-flow-pkg' ), false, 'textarea' ),
				),
				'available'   => true,
			),
			'create_user'            => array(
				'label'       => __( 'Create a new user', 'jetpack-flow-pkg' ),
				'description' => __( 'Add a user account and email them a link to set their password.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true, 'text', array( 'default' => '{{email}}' ) ),
					$text( 'username', __( 'Username', 'jetpack-flow-pkg' ) ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
					$text( 'role', __( 'Role', 'jetpack-flow-pkg' ), false, 'role', array( 'default' => 'subscriber' ) ),
				),
				'available'   => true,
			),
			'add_media'              => array(
				'label'       => __( 'Add new media', 'jetpack-flow-pkg' ),
				'description' => __( 'Download a file from a URL into the media library.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'url', __( 'File URL', 'jetpack-flow-pkg' ), true, 'url' ),
					$text( 'title', __( 'Title', 'jetpack-flow-pkg' ) ),
				),
				'available'   => true,
			),
			'webhook'                => array(
				'label'       => __( 'Send a webhook', 'jetpack-flow-pkg' ),
				'description' => __( 'Send the trigger data to any HTTPS URL.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'url', __( 'HTTPS URL', 'jetpack-flow-pkg' ), true, 'url' ),
					$text(
						'method',
						__( 'Method', 'jetpack-flow-pkg' ),
						false,
						'select',
						array(
							'default' => 'POST',
							'options' => $opts(
								array(
									'POST' => 'POST',
									'PUT'  => 'PUT',
									'GET'  => 'GET',
								)
							),
						)
					),
					$text(
						'format',
						__( 'Format', 'jetpack-flow-pkg' ),
						false,
						'select',
						array(
							'default' => 'json',
							'options' => $http_formats,
						)
					),
				),
				'available'   => true,
			),
			'post_to_url'            => array(
				'label'       => __( 'POST to a URL', 'jetpack-flow-pkg' ),
				'description' => __( 'POST the trigger data to a URL.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$text( 'url', __( 'URL', 'jetpack-flow-pkg' ), true, 'url' ),
					$text(
						'format',
						__( 'Format', 'jetpack-flow-pkg' ),
						false,
						'select',
						array(
							'default' => 'json',
							'options' => $http_formats,
						)
					),
				),
				'available'   => true,
			),
			'newsletter_subscribe'   => array(
				'label'       => __( 'Add Jetpack newsletter subscriber', 'jetpack-flow-pkg' ),
				'description' => __( 'Subscribe an email address to your Jetpack newsletter.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true, 'text', array( 'default' => '{{email}}' ) ),
				),
				'available'   => class_exists( 'Jetpack_Subscriptions' ),
				'requires'    => 'jetpack',
			),
			'social_share'           => array(
				'label'       => __( 'Share a post on social media', 'jetpack-flow-pkg' ),
				'description' => __( 'Share a post to your connected Jetpack Social networks.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'fields'      => array(
					$text( 'post_id', __( 'Post ID', 'jetpack-flow-pkg' ), true, 'text', array( 'default' => '{{post_id}}' ) ),
					$text( 'message', __( 'Message', 'jetpack-flow-pkg' ), false, 'textarea' ),
				),
				'available'   => class_exists( '\Automattic\Jetpack\Publicize\Publicize' ),
				'requires'    => 'jetpack',
			),
			'podcast_create_episode' => array(
				'label'       => __( 'Create a podcast episode', 'jetpack-flow-pkg' ),
				'description' => __( 'Add an episode to your Jetpack Podcast, with an optional audio file.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'fields'      => array(
					$text( 'title', __( 'Episode title', 'jetpack-flow-pkg' ), true ),
					$text( 'description', __( 'Show notes', 'jetpack-flow-pkg' ), false, 'textarea' ),
					$text( 'audio_url', __( 'Audio file URL', 'jetpack-flow-pkg' ), false, 'url' ),
					$text(
						'status',
						__( 'Status', 'jetpack-flow-pkg' ),
						false,
						'select',
						array(
							'default' => 'draft',
							'options' => $opts(
								array(
									'draft'   => __( 'Draft', 'jetpack-flow-pkg' ),
									'publish' => __( 'Publish', 'jetpack-flow-pkg' ),
								)
							),
						)
					),
				),
				'available'   => class_exists( '\Automattic\Jetpack\Podcast\Feed\Customize_Feed' ),
				'requires'    => 'jetpack',
			),
			'google_sheet'           => array(
				'label'       => __( 'Create a Google Sheet', 'jetpack-flow-pkg' ),
				'description' => __( 'Create a spreadsheet in Google Drive with the trigger data.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'fields'      => array(
					$text( 'title', __( 'Sheet title', 'jetpack-flow-pkg' ), true ),
				),
				'available'   => class_exists( '\Automattic\Jetpack\External_Connections' ),
				'requires'    => 'jetpack',
			),
			'run_ability'            => array(
				'label'       => __( 'Run a Jetpack ability', 'jetpack-flow-pkg' ),
				'description' => __( 'Run any WordPress ability, such as Jetpack module, Monitor and newsletter abilities.', 'jetpack-flow-pkg' ),
				'product'     => 'jetpack',
				'fields'      => array(
					$text(
						'ability',
						__( 'Ability', 'jetpack-flow-pkg' ),
						true,
						'select',
						array( 'options' => $opts( $abilities ) )
					),
					$text( 'input', __( 'Input (JSON)', 'jetpack-flow-pkg' ), false, 'textarea' ),
				),
				'available'   => (bool) $abilities,
				'requires'    => 'jetpack',
			),
			'ai_summarize'           => array(
				'label'       => __( 'Summarize with AI', 'jetpack-flow-pkg' ),
				'description' => __( 'Summarize some text. Use {{ai_text}} in the next step.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$provider,
					$text( 'content', __( 'Text to summarize', 'jetpack-flow-pkg' ), true, 'textarea', array( 'default' => '{{message}}' ) ),
					$text(
						'style',
						__( 'Summary style', 'jetpack-flow-pkg' ),
						false,
						'select',
						array(
							'default' => 'sentence',
							'options' => $opts(
								array(
									'sentence'  => __( 'One sentence', 'jetpack-flow-pkg' ),
									'paragraph' => __( 'Short paragraph', 'jetpack-flow-pkg' ),
									'bullets'   => __( 'Bullet points', 'jetpack-flow-pkg' ),
								)
							),
						)
					),
				),
				'outputs'     => array( 'ai_text' ),
				'available'   => $ai_ready,
			),
			'ai_generate_text'       => array(
				'label'       => __( 'Write text with AI', 'jetpack-flow-pkg' ),
				'description' => __( 'Generate text from a prompt. Use {{ai_text}} in the next step.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$provider,
					$text( 'prompt', __( 'Prompt', 'jetpack-flow-pkg' ), true, 'textarea' ),
				),
				'outputs'     => array( 'ai_text' ),
				'available'   => $ai_ready,
			),
			'ai_generate_image'      => array(
				'label'       => __( 'Generate an image with AI', 'jetpack-flow-pkg' ),
				'description' => __( 'Generate an image and add it to the media library. Use {{ai_image_url}} in the next step.', 'jetpack-flow-pkg' ),
				'product'     => 'wordpress',
				'fields'      => array(
					$provider,
					$text( 'prompt', __( 'Image prompt', 'jetpack-flow-pkg' ), true, 'textarea' ),
				),
				'outputs'     => array( 'ai_image_url', 'ai_image_id' ),
				'available'   => $ai_ready,
			),
			'akismet_check'          => array(
				'label'       => __( 'Check content with Akismet', 'jetpack-flow-pkg' ),
				'description' => __( 'Ask Akismet whether a piece of content is spam, and email a warning if it is.', 'jetpack-flow-pkg' ),
				'product'     => 'akismet',
				'fields'      => array(
					$text( 'content', __( 'Content to check', 'jetpack-flow-pkg' ), true, 'textarea', array( 'default' => '{{message}}' ) ),
					$text( 'email', __( 'Author email', 'jetpack-flow-pkg' ), false, 'text', array( 'default' => '{{email}}' ) ),
					$text( 'name', __( 'Author name', 'jetpack-flow-pkg' ), false, 'text', array( 'default' => '{{name}}' ) ),
					$text( 'notify_email', __( 'Email me if it is spam', 'jetpack-flow-pkg' ), false, 'email' ),
				),
				'available'   => class_exists( 'Akismet' ),
				'requires'    => 'akismet',
			),
			'mailpoet_subscribe'     => array(
				'label'       => __( 'Add to MailPoet list', 'jetpack-flow-pkg' ),
				'description' => __( 'Subscribe an email address to a MailPoet list.', 'jetpack-flow-pkg' ),
				'product'     => 'mailpoet',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true, 'text', array( 'default' => '{{email}}' ) ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
					$text( 'list_name', __( 'List name', 'jetpack-flow-pkg' ) ),
				),
				'available'   => class_exists( '\MailPoet\API\API' ),
				'requires'    => 'mailpoet',
			),
			'crm_add_contact'        => array(
				'label'       => __( 'Add CRM contact', 'jetpack-flow-pkg' ),
				'description' => __( 'Create or update a contact in Jetpack CRM.', 'jetpack-flow-pkg' ),
				'product'     => 'crm',
				'fields'      => array(
					$text( 'email', __( 'Email', 'jetpack-flow-pkg' ), true, 'text', array( 'default' => '{{email}}' ) ),
					$text( 'first_name', __( 'First name', 'jetpack-flow-pkg' ) ),
				),
				'available'   => function_exists( 'zeroBS_integration_addOrUpdateCustomer' ),
				'requires'    => 'zero-bs-crm',
			),
		);

		/**
		 * Filters the Flow action catalog.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $actions Action definitions keyed by ID.
		 */
		return apply_filters( 'jetpack_flow_actions', $actions );
	}

	/**
	 * Install and activation state of one dependency.
	 *
	 * @param string $slug Key from plugins().
	 * @return string active, inactive or missing.
	 */
	private static function plugin_status( $slug ) {
		$file = self::plugins()[ $slug ]['file'] ?? '';
		if ( ! $file || ! file_exists( WP_PLUGIN_DIR . '/' . $file ) ) {
			return 'missing';
		}
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return is_plugin_active( $file ) || is_plugin_active_for_network( $file ) ? 'active' : 'inactive';
	}

	/**
	 * Catalog in the shape the dashboard consumes.
	 *
	 * @return array
	 */
	public static function for_rest() {
		$shape = static function ( $items ) {
			$out = array();
			foreach ( $items as $id => $item ) {
				unset( $item['hook'], $item['args'], $item['priority'] );
				$out[] = array_merge(
					array(
						'id'       => $id,
						'fields'   => array(),
						'tokens'   => array(),
						'requires' => '',
					),
					$item
				);
			}
			return $out;
		};

		$plugins = array();
		foreach ( self::plugins() as $slug => $plugin ) {
			$plugins[ $slug ] = array_merge(
				$plugin,
				array(
					'slug'   => $slug,
					'status' => self::plugin_status( $slug ),
				)
			);
		}

		return array(
			'triggers' => $shape( self::triggers() ),
			'actions'  => $shape( self::actions() ),
			'plugins'  => $plugins,
		);
	}
}
