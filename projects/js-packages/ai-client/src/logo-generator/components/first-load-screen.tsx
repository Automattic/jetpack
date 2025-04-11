/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import { ImageLoader } from './image-loader.tsx';
import './first-load-screen.scss';

export const FirstLoadScreen: React.FC< {
	state?: 'loadingFeature' | 'analyzing' | 'generating';
} > = ( { state = 'loadingFeature' } ) => {
	const loadingLabel = __( 'Loading…', 'jetpack-ai-client' );
	const analyzingLabel = __(
		'Analyzing your site to create the perfect logo…',
		'jetpack-ai-client'
	);
	const generatingLabel = __( 'Generating logo…', 'jetpack-ai-client' );

	return (
		<div className="jetpack-ai-logo-generator-modal__loading-wrapper">
			<ImageLoader />
			<span className="jetpack-ai-logo-generator-modal__loading-message">
				{ state === 'loadingFeature' && loadingLabel }
				{ state === 'analyzing' && analyzingLabel }
				{ state === 'generating' && generatingLabel }
			</span>
		</div>
	);
};
