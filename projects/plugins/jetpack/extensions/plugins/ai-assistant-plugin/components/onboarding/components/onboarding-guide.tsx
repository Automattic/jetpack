import { Guide } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAICheckout from '../../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import { usePrefetchAssets } from '../hooks/use-prefetch-assets';
import { pages, assetSources } from './pages';
import type { GuideProps } from '@wordpress/components/src/guide/types';
import type { FC, KeyboardEvent, SyntheticEvent } from 'react';

import '../style.scss';

const OnboardingGuide: FC = () => {
	const [ isOpen, setIsOpen ] = useState( true );
	const { checkoutUrl } = useAICheckout();

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { isFeatureActive } = useSelect( 'core/edit-post' );
	const isWelcomeGuideActive = isFeatureActive( 'welcomeGuide' );

	// eslint-disable-next-line no-console
	console.log( isWelcomeGuideActive );

	// Preload assets to avoid flickering as much as possible
	usePrefetchAssets( assetSources );

	if ( isWelcomeGuideActive ) {
		return null;
	}

	const finishButtonText = __( 'Elevate your content', 'jetpack' );

	const closeGuide = (
		e: KeyboardEvent< HTMLDivElement | HTMLButtonElement > | SyntheticEvent
	) => {
		// If user clicks on the finish button on the final page of the walkthrough
		// open the checkout page in a new tab
		if ( ( e.target as HTMLElement ).tagName === 'BUTTON' ) {
			const target = e.target as HTMLButtonElement;
			const text = target.textContent || target.innerText;

			if ( text === finishButtonText ) {
				window.open( checkoutUrl, '_blank' );
			}
		}

		// Remove the onboarding query parameter from the URL
		// so it doesn't pop back up if the page is refreshed
		const params = new URLSearchParams( window.location.search );
		params.delete( 'guide' );
		const newUrl = location.pathname + '?' + params.toString() + location.hash;
		window.history.replaceState( {}, '', newUrl );

		// Close modal
		setIsOpen( false );
	};

	const config: GuideProps = {
		contentLabel: 'AI Assistant Onboarding Guide',
		pages,
		onFinish: closeGuide,
		finishButtonText,
	};

	if ( ! isOpen ) {
		return null;
	}

	return <Guide { ...config } />;
};

export default OnboardingGuide;
