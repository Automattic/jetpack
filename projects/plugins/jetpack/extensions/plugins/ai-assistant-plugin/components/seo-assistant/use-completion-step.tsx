import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { CompletionStep } from './types';

export const useCompletionStep = (): CompletionStep => {
	const [ keywords, setKeywords ] = useState( '' );
	const [ completed, setCompleted ] = useState( false );
	const { messages, setMessages, addMessage, removeLastMessage } = useMessages();

	const startHandler = useCallback(
		async ( { fromSkip } ) => {
			const firstMessages = [
				{
					content: <TypingMessage />,
					showIcon: true,
					id: '2',
				},
			];
			if ( fromSkip ) {
				firstMessages.unshift( {
					// @ts-expect-error - type is properly defined, unsure why it's erroring
					content: __( 'Skipped!', 'jetpack' ),
					showIcon: true,
					id: 'a',
				} );
			}
			setMessages( firstMessages );
			await new Promise( resolve => setTimeout( resolve, 2000 ) );
			removeLastMessage();
			// await new Promise( resolve => setTimeout( resolve, 1000 ) );
			addMessage( {
				content: createInterpolateElement(
					"Here's your updated checklist:<br />✅ Title<br />✅ Meta description<br /><br />",
					{
						br: <br />,
					}
				),
				id: '1',
			} );
			addMessage( {
				content: createInterpolateElement(
					__(
						'<strong>SEO optimization complete! 🎉</strong><br/>Your blog post is now search-engine friendly.',
						'jetpack'
					),
					{ br: <br />, strong: <strong /> }
				),
				showIcon: false,
				id: '3',
			} );
			addMessage( {
				content: __( 'Happy blogging! 😊', 'jetpack' ),
				showIcon: false,
				id: '4',
			} );
			return 'completion';
		},
		[ setMessages, addMessage, removeLastMessage ]
	);

	return {
		id: 'completion',
		title: __( 'Your post is SEO-ready', 'jetpack' ),
		label: 'completion',
		messages,
		type: 'completion',
		onStart: startHandler,
		submitCtaLabel: __( 'Done!', 'jetpack' ),
		completed,
		setCompleted,
		value: keywords,
		setValue: setKeywords,
	};
};
