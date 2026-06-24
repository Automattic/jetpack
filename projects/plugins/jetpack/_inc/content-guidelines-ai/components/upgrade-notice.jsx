import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { recordAiEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function UpgradeNotice() {
	const { hasFeature } = useAiFeature();
	const { checkoutUrl } = useAICheckout();
	const { dismissBanner } = useDispatch( AI_STORE_NAME );
	const dismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	const handleUpgradeClick = useCallback( () => {
		recordAiEvent( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
		// Persist dismissal so the empty-state prompt doesn't reappear once the
		// user has acted on it. Reuses the same per-user flag as the banner —
		// the two prompts are mutually exclusive (feature vs. no feature).
		dismissBanner();
	}, [ dismissBanner ] );

	if ( hasFeature || dismissed ) {
		return null;
	}

	return (
		<Notice
			status="success"
			isDismissible
			onRemove={ dismissBanner }
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
