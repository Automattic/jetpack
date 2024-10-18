import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import moment from 'moment';
import { useEffect, useState } from 'react';

export const useBloggingPrompts = ( { isBloganuary = false } ) => {
	const [ prompts, setPrompts ] = useState( [] );
	const [ promptIndex, setPromptIndex ] = useState( 0 );

	useEffect( () => {
		apiFetch( {
			path: addQueryArgs( `/wpcom/v3/blogging-prompts`, {
				per_page: isBloganuary ? 31 : 10,
				after: isBloganuary ? '--01-01' : moment().format( '--MM-DD' ),
				order: 'desc',
				force_year: new Date().getFullYear(),
			} ),
		} )
			.then( result => {
				return setPrompts( result );
			} )
			// eslint-disable-next-line no-console
			.catch( () => console.error( 'Unable to fetch blogging prompts' ) );
	}, [ isBloganuary ] );

	const hasPreviousPrompt = promptIndex > 0;
	const goToPreviousPrompt = () => {
		setPromptIndex( hasPreviousPrompt ? promptIndex - 1 : prompts.length - 1 );
	};

	const hasNextPrompt = promptIndex < prompts.length - 1;
	const goToNextPrompt = () => {
		setPromptIndex( hasNextPrompt ? promptIndex + 1 : 0 );
	};

	const prompt = prompts?.[ promptIndex ];
	const todayPrompt = prompts?.[ 0 ];

	return {
		prompt,
		todayPrompt,
		hasPreviousPrompt,
		goToPreviousPrompt,
		hasNextPrompt,
		goToNextPrompt,
	};
};
