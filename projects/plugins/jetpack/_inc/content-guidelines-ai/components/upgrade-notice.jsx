import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function UpgradeNotice() {
	const { requireUpgrade } = useAiFeature();
	const { checkoutUrl } = useAICheckout();

	if ( ! requireUpgrade ) {
		return null;
	}

	return (
		<Notice
			status="warning"
			isDismissible={ false }
			className="jetpack-content-guidelines-ai__upgrade-notice"
		>
			<p>
				{ __(
					'Upgrade to Jetpack AI to generate and improve your content guidelines.',
					'jetpack'
				) }
			</p>
			{ checkoutUrl && (
				<Button variant="primary" href={ checkoutUrl } target="_blank">
					{ __( 'Upgrade', 'jetpack' ) }
				</Button>
			) }
		</Notice>
	);
}
