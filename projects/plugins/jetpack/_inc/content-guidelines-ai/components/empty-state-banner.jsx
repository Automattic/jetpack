import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function EmptyStateBanner() {
	const { generate } = useGenerateAll();
	const { hasFeature } = useAiFeature();
	const { dismissBanner } = useDispatch( AI_STORE_NAME );

	const dismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	// The plans store defaults hasFeature to true until its fetch resolves, so
	// rendering before resolution would flash the banner on no-plan sites and
	// then swap it for the upgrade notice. Wait for the real answer instead.
	const featureResolved = useSelect(
		select => select( 'wordpress-com/plans' ).hasFinishedResolution( 'getAiAssistantFeature' ),
		[]
	);

	const handleDismiss = useCallback( () => {
		dismissBanner();
	}, [ dismissBanner ] );

	const handleGetStarted = useCallback( () => {
		dismissBanner();
		generate();
	}, [ dismissBanner, generate ] );

	if ( ! featureResolved || dismissed || ! hasFeature ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__banner">
			<div className="jetpack-content-guidelines-ai__banner-content">
				<h2>{ __( 'Generate your guidelines in seconds', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Use Jetpack to analyze your site and create draft guidelines based on your actual content.',
						'jetpack'
					) }
				</p>
				<div className="jetpack-content-guidelines-ai__banner-actions">
					<Button
						className="jetpack-content-guidelines-ai__banner-cta"
						variant="primary"
						onClick={ handleGetStarted }
					>
						{ __( 'Get started', 'jetpack' ) }
					</Button>
					<Button
						className="jetpack-content-guidelines-ai__banner-close-text"
						variant="tertiary"
						onClick={ handleDismiss }
					>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</div>
			</div>
			<Button
				className="jetpack-content-guidelines-ai__banner-close"
				icon={ closeSmall }
				label={ __( 'Dismiss banner', 'jetpack' ) }
				size="small"
				onClick={ handleDismiss }
			/>
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--top" />
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--bottom" />
		</div>
	);
}
