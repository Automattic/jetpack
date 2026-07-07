<?php
/**
 * STRESS-TEST feature registrations for the Feature Catalog.
 *
 * A deliberately granular set of sub-features across different Jetpack parts, chosen to
 * probe where the catalog abstraction breaks down (coarse module on/off, module-less
 * cloud features, cross-plugin capabilities, unknown entitlement slugs, applicability).
 * NOT intended to ship as-is — this is exploratory. See the failure analysis in
 * ~/a8c/plans/jetpack-features-catalog/failure-analysis.html.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'Automattic\Jetpack\Features\register_feature' ) ) {
			return;
		}

		$f = static function ( $slug, $title, $description, $args = array() ) {
			register_feature(
				$slug,
				array_merge(
					array(
						'title'       => $title,
						'description' => $description,
					),
					$args
				)
			);
		};

		// --- Forms: many sub-features, ONE shared module (contact-form). Probes coarse is_active. ---
		$f(
			'forms-webhooks',
			'Form webhooks',
			'Send form submissions to any URL as a webhook.',
			array(
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'contact-form',
				'entitlement' => 'form-webhooks',
			)
		);
		$f(
			'forms-salesforce',
			'Salesforce integration',
			'Send form submissions to Salesforce as new leads.',
			array(
				'category'    => 'writing',
				'connection'  => 'user',
				'module'      => 'contact-form',
				'entitlement' => 'form-integrations',
			)
		);
		$f(
			'forms-google-sheets',
			'Export to Google Sheets',
			'Export form responses to a connected Google Sheet.',
			array(
				'category'   => 'writing',
				'connection' => 'user',
				'module'     => 'contact-form',
			)
		);
		$f(
			'forms-crm',
			'Jetpack CRM integration',
			'Sync form submissions into Jetpack CRM contacts.',
			array(
				'category'   => 'writing',
				'connection' => 'none',
				'module'     => 'contact-form',
			)
		);
		$f(
			'forms-akismet',
			'Akismet spam filtering',
			'Automatically filter spam out of form submissions with Akismet.',
			array(
				'category'    => 'writing',
				'connection'  => 'site',
				'module'      => 'contact-form',
				'entitlement' => 'akismet',
			)
		);
		$f(
			'forms-ai-generation',
			'AI form generation',
			'Generate a ready-to-use form from a text prompt.',
			array(
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'contact-form',
				'entitlement' => 'ai-assistant',
			)
		);

		// --- Social/Publicize: sub-features share the publicize module. ---
		$f(
			'social-image-generator',
			'Social Image Generator',
			'Automatically create share images for your posts.',
			array(
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'publicize',
				'entitlement' => 'social-image-generator',
			)
		);
		$f(
			'social-image-focal-point',
			'Social image focal point',
			'Choose the focal point used in auto-generated social images.',
			array(
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'publicize',
				'entitlement' => 'social-image-generator',
			)
		);
		$f(
			'social-message-templates',
			'Message templates',
			'Save and reuse templates for your social messages.',
			array(
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'publicize',
				'entitlement' => 'social-enhanced-publishing',
			)
		);
		$f(
			'social-share-scheduling',
			'Share scheduling',
			'Schedule social shares to publish at a future time.',
			array(
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'publicize',
				'entitlement' => 'social-enhanced-publishing',
			)
		);

		// --- Search: two modes, one module. ---
		$f(
			'search-instant',
			'Instant Search',
			'Show results instantly as visitors type, with filtering and sorting.',
			array(
				'category'    => 'search',
				'connection'  => 'site',
				'module'      => 'search',
				'entitlement' => 'instant-search',
			)
		);

		// --- VideoPress: a toggle, a free block, and a QUOTA (not a toggle). ---
		$f(
			'videopress-block',
			'VideoPress block',
			'Embed ad-free, high-quality video with the block editor.',
			array(
				'category'   => 'writing',
				'connection' => 'none',
				'module'     => 'videopress',
			)
		);
		$f(
			'videopress-1tb-storage',
			'1 TB video storage',
			'Store up to 1 TB of uploaded video.',
			array(
				'category'    => 'writing',
				'connection'  => 'site',
				'module'      => 'videopress',
				'entitlement' => 'videopress-1tb-storage',
			)
		);

		// --- Newsletter/Subscriptions sub-features. ---
		$f(
			'newsletter-paid',
			'Paid newsletter / content gating',
			'Charge for subscriptions and gate content behind a paywall.',
			array(
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'subscriptions',
				'entitlement' => 'paid-newsletter',
			)
		);
		$f(
			'newsletter-reader',
			'Reader distribution',
			'Distribute your newsletter through the WordPress.com Reader.',
			array(
				'category'   => 'engagement',
				'connection' => 'user',
				'module'     => 'subscriptions',
			)
		);

		// --- Stats: free vs commercial, one module. ---
		$f(
			'stats-commercial',
			'Commercial Stats',
			'Advanced, commercial-grade traffic analytics.',
			array(
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'stats',
				'entitlement' => 'stats-commercial',
			)
		);

		// --- FAILURE MODE A: MODULE-LESS cloud/product features (module => null). is_active defaults true. ---
		$f(
			'ai-content-assistant',
			'AI content assistant',
			'Draft and improve content with an AI writing assistant.',
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-assistant',
			)
		);
		$f(
			'ai-seo-enhancer',
			'AI SEO enhancer',
			'Generate SEO titles and meta descriptions with AI.',
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-seo-enhancer',
			)
		);
		$f(
			'ai-image-generator',
			'AI image generator',
			'Create images from text prompts with AI.',
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-assistant',
			)
		);
		$f(
			'backup-realtime',
			'Real-time backups',
			'Continuously back up every change to your site.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'real-time-backups',
			)
		);
		$f(
			'backup-activity-log',
			'Full activity log',
			'See a complete record of every change and action on your site.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'full-activity-log',
			)
		);
		$f(
			'backup-restore',
			'One-click restore',
			'Restore your site to any previous point with one click.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'restore',
			)
		);
		$f(
			'scan-malware',
			'Malware scanning',
			'Automatically scan your site for malware and vulnerabilities.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'scan',
			)
		);
		$f(
			'scan-autofix',
			'Auto-fix threats',
			'Resolve detected security threats with one click.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'scan',
			)
		);

		// --- FAILURE MODE B: CROSS-PLUGIN features (belong to standalone Boost/Protect plugins, not jetpack). ---
		$f(
			'boost-image-cdn',
			'Boost: Image CDN',
			'Serve resized, optimized images from a global CDN.',
			array(
				'category'   => 'performance',
				'connection' => 'none',
				'module'     => 'boost-image-cdn',
			)
		);
		$f(
			'boost-critical-css',
			'Boost: Critical CSS',
			'Generate critical CSS in the cloud to speed up rendering.',
			array(
				'category'    => 'performance',
				'connection'  => 'site',
				'module'      => 'boost-critical-css',
				'entitlement' => 'cloud-critical-css',
			)
		);
		$f(
			'boost-defer-js',
			'Boost: Defer JS',
			'Defer non-essential JavaScript to improve load times.',
			array(
				'category'   => 'performance',
				'connection' => 'none',
				'module'     => 'boost-defer-js',
			)
		);
		$f(
			'protect-scan-history',
			'Protect: scan history',
			'Review the history of security scans and detected threats.',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'module'      => 'protect-scan',
				'entitlement' => 'scan',
			)
		);

		// --- FAILURE MODE C: platform-only features (exist on wpcom Simple, not self-hosted). No is_applicable => shows as available. ---
		$f(
			'wpcom-staging-site',
			'Staging site',
			'Create a staging copy of your site to test changes safely.',
			array(
				'category'    => 'general',
				'connection'  => 'site',
				'entitlement' => 'staging-sites',
			)
		);
		$f(
			'wpcom-sftp-access',
			'SFTP/SSH access',
			'Access your site files and database over SFTP and SSH.',
			array(
				'category'    => 'general',
				'connection'  => 'none',
				'entitlement' => 'sftp',
			)
		);
		$f(
			'wpcom-github-deployments',
			'GitHub deployments',
			'Deploy code to your site automatically from GitHub.',
			array(
				'category'    => 'general',
				'connection'  => 'site',
				'entitlement' => 'github-deployments',
			)
		);

		// --- FAILURE MODE D: entitlement slug that does not exist in WPCOM_Features (typo/unknown). ---
		$f(
			'made-up-feature',
			'A feature with a bogus entitlement',
			'A probe with a deliberately invalid entitlement slug, to show unknown slugs degrade silently.',
			array(
				'category'    => 'other',
				'connection'  => 'none',
				'entitlement' => 'this-slug-does-not-exist',
			)
		);
	}
);
