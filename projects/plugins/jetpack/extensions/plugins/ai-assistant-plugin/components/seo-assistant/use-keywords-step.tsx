import { createInterpolateElement, useCallback, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { InputStep } from './types';

export const useKeywordsStep = (): InputStep => {
	const [ keywords, setKeywords ] = useState( '' );
	const [ completed, setCompleted ] = useState( false );
	const { messages, setMessages, addMessage, removeLastMessage } = useMessages();

	useEffect( () => {
		setMessages( [
			{
				content: __(
					'To start, please enter 1–3 focus keywords that describe your blog post.',
					'jetpack'
				),
				showIcon: true,
			},
		] );
	}, [ setMessages ] );

	const handleSkip = useCallback( () => {
		addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
	}, [ addMessage ] );

	const handleKeywordsSubmit = useCallback( async () => {
		if ( ! keywords.trim() ) {
			return handleSkip();
		}
		addMessage( { content: keywords, isUser: true } );
		addMessage( { content: <TypingMessage /> } );

		const keywordlist = await new Promise( resolve =>
			setTimeout( () => {
				const commaSeparatedKeywords = keywords
					.split( ',' )
					.map( k => k.trim() )
					.reduce( ( acc, curr, i, arr ) => {
						if ( arr.length === 1 ) {
							return curr;
						}
						if ( i === arr.length - 1 ) {
							return `${ acc } </b>&<b> ${ curr }`;
						}
						return i === 0 ? curr : `${ acc }, ${ curr }`;
					}, '' );
				resolve( commaSeparatedKeywords );
			}, 500 )
		);
		removeLastMessage();

		const message = createInterpolateElement(
			/* Translators: wrapped string is list of keywords user has entered */
			sprintf( __( `Got it! You're targeting <b>%s</b>. ✨✅`, 'jetpack' ), keywordlist ),
			{
				b: <b />,
			}
		);
		addMessage( { content: message } );
		setCompleted( true );
	}, [ addMessage, keywords, handleSkip, removeLastMessage ] );

	return {
		id: 'keywords',
		title: __( 'Optimise for SEO', 'jetpack' ),
		label: __( 'Keywords', 'jetpack' ),
		messages,
		type: 'input',
		placeholder: __( 'Photography, plants', 'jetpack' ),
		onSubmit: handleKeywordsSubmit,
		onSkip: handleSkip,
		completed,
		setCompleted,
		value: keywords,
		setValue: setKeywords,
	};
};
