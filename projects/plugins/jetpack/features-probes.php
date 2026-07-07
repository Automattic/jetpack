<?php
/**
 * Validation probe features for the Feature Catalog (Slice 1).
 *
 * Deliberately co-located here (not scattered into packages) until the model is validated.
 * Entitlements are STRING slugs — never \WPCOM_Features constants.
 *
 * @package automattic/jetpack
 */

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'register_feature' ) ) {
			return;
		}

		register_feature(
			'forms-multistep',
			array(
				'title'           => __( 'Multi-step forms', 'jetpack' ),
				'description'     => __( 'Break long forms into steps.', 'jetpack' ),
				'category'        => 'forms',
				'connection'      => 'none',
				'module'          => 'contact-form',
				'available_since' => array( 'jetpack' => '14.2' ),
				'recommend'       => array( 'high_content_volume' ),
			)
		);

		register_feature(
			'forms-file-uploads',
			array(
				'title'       => __( 'File upload field', 'jetpack' ),
				'description' => __( 'Let visitors attach files to submissions.', 'jetpack' ),
				'category'    => 'forms',
				'entitlement' => 'field-file',
				'connection'  => 'user',
				'module'      => 'contact-form',
			)
		);

		register_feature(
			'protect-firewall',
			array(
				'title'       => __( 'Web Application Firewall', 'jetpack' ),
				'description' => __( 'Block malicious requests.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'site',
				'module'      => 'waf',
			)
		);

		register_feature(
			'videopress',
			array(
				'title'       => __( 'VideoPress hosting', 'jetpack' ),
				'description' => __( 'Ad-free, high-quality video.', 'jetpack' ),
				'category'    => 'performance',
				'entitlement' => 'videopress',
				'connection'  => 'site',
				'module'      => 'videopress',
			)
		);
	}
);
