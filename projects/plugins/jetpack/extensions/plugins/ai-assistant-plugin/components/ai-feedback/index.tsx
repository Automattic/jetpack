import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { thumbsUp, thumbsDown } from '@wordpress/icons';
import clsx from 'clsx';
import { useState } from 'react';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';

import './style.scss';

export default function AiFeedbackThumbs( { disabled = false, iconSize = 24, ratedItem } ) {
	const [ itemsRated, setItemsRated ] = useState( {} );

	const rateAI = ( isThumbsUp: boolean ) => {
		const aiRating = isThumbsUp ? 'thumbs-up' : 'thumbs-down';

		setItemsRated( {
			...itemsRated,
			[ ratedItem ]: aiRating,
		} );

		// calls to Tracks or whatever else can be made here
	};

	const checkThumb = ( thumbValue: string ) => {
		if ( ! itemsRated[ ratedItem ] ) {
			return false;
		}

		return itemsRated[ ratedItem ] === thumbValue;
	};

	return getFeatureAvailability( 'ai-response-feedback' ) ? (
		<div className="ai-assistant-feedback__selection">
			<Button
				aria-label={ __( 'Good Response', 'jetpack' ) }
				disabled={ disabled }
				icon={ thumbsUp }
				onClick={ () => rateAI( true ) }
				iconSize={ iconSize }
				showTooltip={ false }
				className={ clsx( { 'ai-assistant-feedback__thumb-selected': checkThumb( 'thumbs-up' ) } ) }
			/>
			<Button
				aria-label={ __( 'Bad Response', 'jetpack' ) }
				disabled={ disabled }
				icon={ thumbsDown }
				onClick={ () => rateAI( false ) }
				iconSize={ iconSize }
				showTooltip={ false }
				className={ clsx( {
					'ai-assistant-feedback__thumb-selected': checkThumb( 'thumbs-down' ),
				} ) }
			/>
		</div>
	) : (
		<></>
	);
}
