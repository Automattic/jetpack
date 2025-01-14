import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { Step } from './types';

export const useKeywordsStep = ( { addMessage, onStep } ): Step => {
	const [ keywords, setKeywords ] = useState( '' );
	const [ completed, setCompleted ] = useState( false );

	const handleSkip = useCallback( () => {
		addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
		if ( onStep ) {
			onStep( { value: '' } );
		}
	}, [ addMessage, onStep ] );

	const handleKeywordsSubmit = useCallback( () => {
		if ( ! keywords.trim() ) {
			return handleSkip();
		}
		addMessage( { content: keywords, isUser: true } );

		const keywordlist = keywords
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
		const message = createInterpolateElement(
			/* Translators: wrapped string is list of keywords user has entered */
			sprintf( __( `Got it! You're targeting <b>%s</b>. ✨✅`, 'jetpack' ), keywordlist ),
			{
				b: <b />,
			}
		);
		addMessage( { content: message } );
		setCompleted( true );
		if ( onStep ) {
			onStep( { value: keywords } );
		}
	}, [ onStep, addMessage, keywords, handleSkip ] );

	return {
		id: 'keywords',
		title: __( 'Optimise for SEO', 'jetpack' ),
		label: __( 'Keywords', 'jetpack' ),
		messages: [
			{
				content: createInterpolateElement(
					__( "<b>Hi there! 👋 Let's optimise your blog post for SEO.</b>", 'jetpack' ),
					{ b: <b /> }
				),
				showIcon: true,
			},
			{
				content: createInterpolateElement(
					__(
						"Here's what we can improve:<br />1. Keywords<br />2. Title<br />3. Meta description",
						'jetpack'
					),
					{ br: <br /> }
				),
				showIcon: false,
			},
			{
				content: __(
					'To start, please enter 1–3 focus keywords that describe your blog post.',
					'jetpack'
				),
				showIcon: true,
			},
		],
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
