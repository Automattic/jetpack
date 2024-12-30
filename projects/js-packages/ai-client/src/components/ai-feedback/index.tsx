/**
 * External dependencies
 */
import {
	useAnalytics,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { thumbsUp, thumbsDown } from '@wordpress/icons';
import clsx from 'clsx';
/*
 * Internal dependencies
 */
import './style.scss';
/**
 * Types
 */
import type React from 'react';

type AiFeedbackThumbsProps = {
	disabled?: boolean;
	iconSize?: number;
	ratedItem?: string;
	feature?: string;
	savedRatings?: Record< string, string >;
	options?: {
		mediaLibraryId?: number;
		prompt?: string;
		revisedPrompt?: string;
		block?: string | null;
	};
	onRate?: ( rating: string ) => void;
};

/**
 * Get the availability of a feature.
 *
 * @param {string} feature - The feature to check availability for.
 * @return {boolean}       - Whether the feature is available.
 */
function getFeatureAvailability( feature: string ): boolean {
	return getJetpackExtensionAvailability( feature ).available === true;
}

/**
 * AiFeedbackThumbs component.
 *
 * @param {AiFeedbackThumbsProps} props - component props.
 * @return {React.ReactElement} - rendered component.
 */
export default function AiFeedbackThumbs( {
	disabled = false,
	iconSize = 24,
	ratedItem = '',
	feature = '',
	savedRatings = {},
	options = {},
	onRate,
}: AiFeedbackThumbsProps ): React.ReactElement {
	if ( ! getFeatureAvailability( 'ai-response-feedback' ) ) {
		return null;
	}

	const [ itemsRated, setItemsRated ] = useState( {} );
	const { tracks } = useAnalytics();

	useEffect( () => {
		const newItemsRated = { ...savedRatings, ...itemsRated };

		if ( JSON.stringify( newItemsRated ) !== JSON.stringify( itemsRated ) ) {
			setItemsRated( newItemsRated );
		}
	}, [ savedRatings ] );

	const checkThumb = ( thumbValue: string ) => {
		if ( ! itemsRated[ ratedItem ] ) {
			return false;
		}

		return itemsRated[ ratedItem ] === thumbValue;
	};

	const rateAI = ( isThumbsUp: boolean ) => {
		const aiRating = isThumbsUp ? 'thumbs-up' : 'thumbs-down';

		if ( ! checkThumb( aiRating ) ) {
			setItemsRated( {
				...itemsRated,
				[ ratedItem ]: aiRating,
			} );

			onRate?.( aiRating );

			tracks.recordEvent( 'jetpack_ai_feedback', {
				type: feature,
				rating: aiRating,
				mediaLibraryId: options.mediaLibraryId || null,
				prompt: options.prompt || null,
				revisedPrompt: options.revisedPrompt || null,
				block: options.block || null,
			} );
		}
	};

	return (
		<div className="ai-assistant-feedback__selection">
			<Tooltip text={ __( 'I like this', 'jetpack-ai-client' ) }>
				<Button
					disabled={ disabled }
					icon={ thumbsUp }
					onClick={ () => rateAI( true ) }
					iconSize={ iconSize }
					showTooltip={ false }
					className={ clsx( {
						'ai-assistant-feedback__thumb-selected': checkThumb( 'thumbs-up' ),
					} ) }
				/>
			</Tooltip>
			<Tooltip text={ __( "I don't find this useful", 'jetpack-ai-client' ) }>
				<Button
					disabled={ disabled }
					icon={ thumbsDown }
					onClick={ () => rateAI( false ) }
					iconSize={ iconSize }
					showTooltip={ false }
					className={ clsx( {
						'ai-assistant-feedback__thumb-selected': checkThumb( 'thumbs-down' ),
					} ) }
				/>
			</Tooltip>
		</div>
	);
}
