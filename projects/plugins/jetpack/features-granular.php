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

		$f = static function ( $slug, $title, $args = array() ) {
			register_feature( $slug, array_merge( array( 'title' => $title ), $args ) );
		};

		// --- Forms: many sub-features, ONE shared module (contact-form). Probes coarse is_active. ---
		$f(
			'forms-webhooks',
			'Form webhooks',
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
			array(
				'category'   => 'writing',
				'connection' => 'user',
				'module'     => 'contact-form',
			)
		);
		$f(
			'forms-crm',
			'Jetpack CRM integration',
			array(
				'category'   => 'writing',
				'connection' => 'none',
				'module'     => 'contact-form',
			)
		);
		$f(
			'forms-akismet',
			'Akismet spam filtering',
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
			array(
				'category'   => 'writing',
				'connection' => 'none',
				'module'     => 'videopress',
			)
		);
		$f(
			'videopress-1tb-storage',
			'1 TB video storage',
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
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-assistant',
			)
		);
		$f(
			'ai-seo-enhancer',
			'AI SEO enhancer',
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-seo-enhancer',
			)
		);
		$f(
			'ai-image-generator',
			'AI image generator',
			array(
				'category'    => 'ai',
				'connection'  => 'site',
				'entitlement' => 'ai-assistant',
			)
		);
		$f(
			'backup-realtime',
			'Real-time backups',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'real-time-backups',
			)
		);
		$f(
			'backup-activity-log',
			'Full activity log',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'full-activity-log',
			)
		);
		$f(
			'backup-restore',
			'One-click restore',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'restore',
			)
		);
		$f(
			'scan-malware',
			'Malware scanning',
			array(
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'scan',
			)
		);
		$f(
			'scan-autofix',
			'Auto-fix threats',
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
			array(
				'category'   => 'performance',
				'connection' => 'none',
				'module'     => 'boost-image-cdn',
			)
		);
		$f(
			'boost-critical-css',
			'Boost: Critical CSS',
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
			array(
				'category'   => 'performance',
				'connection' => 'none',
				'module'     => 'boost-defer-js',
			)
		);
		$f(
			'protect-scan-history',
			'Protect: scan history',
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
			array(
				'category'    => 'general',
				'connection'  => 'site',
				'entitlement' => 'staging-sites',
			)
		);
		$f(
			'wpcom-sftp-access',
			'SFTP/SSH access',
			array(
				'category'    => 'general',
				'connection'  => 'none',
				'entitlement' => 'sftp',
			)
		);
		$f(
			'wpcom-github-deployments',
			'GitHub deployments',
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
			array(
				'category'    => 'other',
				'connection'  => 'none',
				'entitlement' => 'this-slug-does-not-exist',
			)
		);
	}
);
