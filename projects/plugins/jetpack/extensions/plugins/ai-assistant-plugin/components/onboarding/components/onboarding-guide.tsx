import { Guide } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePrefetchAssets } from '../hooks/use-prefetch-assets';
import { pages, assetSources } from './pages';
import type { GuideProps } from '@wordpress/components/src/guide/types';
import type { FC } from 'react';

import '../style.scss';

const OnboardingGuide: FC = () => {
	const [ isOpen, setIsOpen ] = useState( true );
	usePrefetchAssets( assetSources );

	const closeGuide = () => {
		// Remove the onboarding query parameter from the URL
		const params = new URLSearchParams( window.location.search );
		params.delete( 'aiOnboarding' );
		const newUrl = location.pathname + '?' + params.toString() + location.hash;
		window.history.replaceState( {}, '', newUrl );

		// Close modal
		setIsOpen( false );
	};

	const config: GuideProps = {
		contentLabel: 'AI Assistant Onboarding Guide',
		pages,
		onFinish: closeGuide,
		finishButtonText: __( 'Elevate your content', 'jetpack' ),
	};

	if ( ! isOpen ) {
		return null;
	}

	return <Guide { ...config } />;
};

export default OnboardingGuide;
