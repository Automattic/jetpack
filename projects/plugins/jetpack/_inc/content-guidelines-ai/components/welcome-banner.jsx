import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AiBanner from '../../shared/components/ai-banner';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function WelcomeBanner() {
	const { generate } = useGenerateAll();
	const { hasFeature } = useAiFeature();
	const { dismissBanner } = useDispatch( AI_STORE_NAME );

	const dismissed = useSelect( select => select( AI_STORE_NAME ).isBannerDismissed(), [] );

	const handleDismiss = useCallback( () => {
		dismissBanner();
	}, [ dismissBanner ] );

	const handleGetStarted = useCallback( () => {
		dismissBanner();
		generate();
	}, [ dismissBanner, generate ] );

	if ( dismissed || ! hasFeature ) {
		return null;
	}

	return (
		<AiBanner
			className="jetpack-content-guidelines-ai__banner"
			title={ __( 'Generate your guidelines in seconds', 'jetpack' ) }
			description={ __(
				'Use Jetpack to analyze your site and create draft guidelines based on your actual content.',
				'jetpack'
			) }
			actions={
				<>
					<Button className="jetpack-ai-banner__cta" variant="primary" onClick={ handleGetStarted }>
						{ __( 'Get started', 'jetpack' ) }
					</Button>
					<Button
						className="jetpack-ai-banner__close-text"
						variant="tertiary"
						onClick={ handleDismiss }
					>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</>
			}
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss banner', 'jetpack' ) }
		/>
	);
}
