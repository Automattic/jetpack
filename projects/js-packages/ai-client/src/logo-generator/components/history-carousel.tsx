/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import loader from '../assets/images/loader.gif';
import { EVENT_NAVIGATE } from '../constants.js';
import useLogoGenerator from '../hooks/use-logo-generator.js';
import './history-carousel.scss';
/**
 * Types
 */
import type React from 'react';

export const HistoryCarousel: React.FC = () => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const { logos, selectedLogo, setSelectedLogoIndex, context, isLoadingHistory } =
		useLogoGenerator();

	const handleClick = ( index: number ) => {
		recordTracksEvent( EVENT_NAVIGATE, {
			context,
			logos_count: logos.length,
			selected_logo: index + 1,
		} );
		setSelectedLogoIndex( index );
	};

	const thumbnailFrom = ( url: string ): string => {
		const thumbnailURL = new URL( url );

		if ( ! thumbnailURL.searchParams.has( 'resize' ) ) {
			thumbnailURL.searchParams.append( 'resize', '48,48' );
		}

		return thumbnailURL.toString();
	};

	return (
		<div className="jetpack-ai-logo-generator__carousel">
			{ ! logos.length && isLoadingHistory && (
				<Button disabled className={ clsx( 'jetpack-ai-logo-generator__carousel-logo' ) }>
					<img height="48" width="48" src={ loader } alt={ 'loading' } />
				</Button>
			) }
			{ ! logos.length && ! isLoadingHistory && (
				<div>{ __( 'No logos generated history yet', 'jetpack-ai-client' ) }</div>
			) }
			{ logos.map( ( logo, index ) => (
				<Button
					key={ logo.url }
					className={ clsx( 'jetpack-ai-logo-generator__carousel-logo', {
						'is-selected': logo.url === selectedLogo.url,
					} ) }
					onClick={ () => handleClick( index ) }
				>
					<img src={ thumbnailFrom( logo.url ) } alt={ logo.description } />
				</Button>
			) ) }
		</div>
	);
};
