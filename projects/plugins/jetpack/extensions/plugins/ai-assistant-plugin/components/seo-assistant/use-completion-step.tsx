import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMessages } from './wizard-messages';
import type { Step } from './types';

export const useCompletionStep = (): Step => {
	const [ keywords, setKeywords ] = useState( '' );
	const [ completed, setCompleted ] = useState( false );
	const { messages, setMessages, addMessage } = useMessages();

	const startHandler = useCallback(
		async ( { fromSkip } ) => {
			const firstMessages = [];
			if ( fromSkip ) {
				firstMessages.push( {
					content: __( 'Skipped!', 'jetpack' ),
					showIcon: true,
					id: 'a',
				} );
			}
			setMessages( firstMessages );
			await new Promise( resolve => setTimeout( resolve, 2000 ) );
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
		[ setMessages, addMessage ]
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
