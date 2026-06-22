import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Notice } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { recordAiEvent } from '../lib/tracks';

export default function UpgradeNotice() {
	const { hasFeature } = useAiFeature();
	const { checkoutUrl } = useAICheckout();

	const handleUpgradeClick = useCallback( () => {
		recordAiEvent( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	}, [] );

	if ( hasFeature ) {
		return null;
	}

	return (
		<Notice
			status="success"
			isDismissible
			className="jetpack-content-guidelines-ai__upgrade-notice"
		>
			<p>
				{ __(
					'Not sure where to start? Jetpack can read your site and suggest guidelines tailored to your content. Upgrade to get started.',
					'jetpack'
				) }
			</p>
			{ checkoutUrl && (
				<Button
					variant="primary"
					href={ checkoutUrl }
					target="_blank"
					onClick={ handleUpgradeClick }
				>
					{ __( 'Upgrade', 'jetpack' ) }
				</Button>
			) }
		</Notice>
	);
}
