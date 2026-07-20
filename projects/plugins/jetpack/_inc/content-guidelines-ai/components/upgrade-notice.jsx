import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { recordAiEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function UpgradeNotice() {
	const { hasFeature } = useAiFeature();
	const { checkoutUrl } = useAICheckout();
	const { dismissBanner, hideUpgradeNotice } = useDispatch( AI_STORE_NAME );
	const dismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );
	const forced = useSelect( select => select( AI_STORE_NAME ).isUpgradeNoticeForced(), [] );
	const containerRef = useRef( null );

	// When a Generate click resurfaces the notice, scroll it into view — the
	// per-section buttons live far down the page while the notice mounts above
	// the list, and an off-viewport response to a click reads as a dead button.
	useEffect( () => {
		if ( forced ) {
			containerRef.current?.scrollIntoView( { behavior: 'smooth', block: 'center' } );
		}
	}, [ forced ] );

	const handleUpgradeClick = useCallback( () => {
		// Record the click only. Dismissal is persisted by the close button
		// ( onRemove ), so the nudge returns if checkout is opened and abandoned.
		recordAiEvent( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	}, [] );

	const handleDismiss = useCallback( () => {
		// hideUpgradeNotice clears the session flag even when the persisted
		// dismissal already happened (dismissBanner early-returns in that case).
		hideUpgradeNotice();
		dismissBanner();
	}, [ hideUpgradeNotice, dismissBanner ] );

	if ( hasFeature || ( dismissed && ! forced ) ) {
		return null;
	}

	return (
		<div ref={ containerRef }>
			<Notice
				status="success"
				isDismissible
				onRemove={ handleDismiss }
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
		</div>
	);
}
