import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMessages } from './wizard-messages';
import type { Step, Results } from './types';

export const useCompletionStep = (): Step => {
	const [ value, setValue ] = useState( '' );
	const { messages, setMessages, addMessage } = useMessages();

	const startHandler = useCallback(
		async ( { fromSkip, results } ) => {
			const firstMessages = [];

			if ( fromSkip ) {
				firstMessages.push( {
					content: __( 'Skipped!', 'jetpack' ),
					showIcon: true,
					id: 'a',
				} );
			}
			setMessages( firstMessages );

			await new Promise( resolve => setTimeout( resolve, 1500 ) );

			const resultsString = Object.values( results )
				.map( ( result: Results[ string ] ) => `${ result.value ? '✅' : '❌' } ${ result.label }` )
				.join( '<br />' );

			addMessage( {
				content: createInterpolateElement(
					`Here's your updated checklist:<br />${ resultsString }<br /><br />`,
					{
						br: <br />,
					}
				),
				id: '1',
			} );

			const incomplete: { total: number; completed: number } = Object.values( results ).reduce(
				( acc: { total: number; completed: number }, result: Results[ string ] ) => {
					const total = acc.total + 1;
					const completed = acc.completed + ( result.value ? 1 : 0 );
					return { total, completed };
				},
				{ total: 0, completed: 0 }
			) as { total: number; completed: number };

			const incompleteString =
				incomplete.completed === incomplete.total
					? ''
					: `${ incomplete.completed } out of ${ incomplete.total }`;

			if ( incompleteString ) {
				addMessage( {
					content: createInterpolateElement(
						`<strong>You've optimized ${ incompleteString } items! 🎉</strong><br />Your post is looking great! Come back anytime to complete the rest.`,
						{
							strong: <strong />,
							br: <br />,
						}
					),
					id: '2',
				} );
			} else {
				addMessage( {
					content: createInterpolateElement(
						__(
							'<strong>SEO optimization complete! 🎉</strong><br/>Your blog post is now search-engine friendly.<br />Happy blogging! 😊',
							'jetpack'
						),
						{ br: <br />, strong: <strong /> }
					),
					showIcon: false,
					id: '3',
				} );
			}

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
		value,
		setValue,
	};
};
