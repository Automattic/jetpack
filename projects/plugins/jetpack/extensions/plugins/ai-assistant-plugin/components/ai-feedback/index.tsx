import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { thumbsUp, thumbsDown } from '@wordpress/icons';
import clsx from 'clsx';
import { useState } from 'react';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';

import './style.scss';

export default function AiFeedbackThumbs( {
	disabled = false,
	iconSize = 24,
	ratedItem,
	feature,
} ) {
	const [ itemsRated, setItemsRated ] = useState( {} );
	const { tracks } = useAnalytics();

	const rateAI = ( isThumbsUp: boolean ) => {
		const aiRating = isThumbsUp ? 'thumbs-up' : 'thumbs-down';

		setItemsRated( {
			...itemsRated,
			[ ratedItem ]: aiRating,
		} );

		tracks.recordEvent( 'jetpack_ai_feedback', {
			type: feature,
			rating: aiRating,
		} );
	};

	const checkThumb = ( thumbValue: string ) => {
		if ( ! itemsRated[ ratedItem ] ) {
			return false;
		}

		return itemsRated[ ratedItem ] === thumbValue;
	};

	return getFeatureAvailability( 'ai-response-feedback' ) ? (
		<div className="ai-assistant-feedback__selection">
			<Tooltip text={ __( 'I like this', 'jetpack' ) }>
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
			<Tooltip text={ __( "I don't find this useful", 'jetpack' ) }>
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
	) : (
		<></>
	);
}
