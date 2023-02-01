import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

export const RegenerateCriticalCssNotice = () => {
	return (
		<Notice level="info" title={ __( 'Regenerate Critical CSS', 'jetpack-boost' ) }>
			<p>
				{ __(
					'We noticed some updates to your site that may have changed your HTML/CSS structure.',
					'jetpack-boost'
				) }
			</p>
			<p>
				{ __(
					'Please regenerate your Critical CSS to maintain optimal site performance.',
					'jetpack-boost'
				) }
			</p>
		</Notice>
	);
};
