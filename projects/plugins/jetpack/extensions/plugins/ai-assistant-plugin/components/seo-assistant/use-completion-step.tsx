import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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

			await new Promise( resolve => setTimeout( resolve, 1000 ) );

			const resultsString = Object.values( results )
				.map( ( result: Results[ string ] ) => `${ result.value ? '✅' : '❌' } ${ result.label }` )
				.join( '<br />' );

			addMessage( {
				content: createInterpolateElement(
					__( "Here's your updated checklist:", 'jetpack' ) +
						'<br />' +
						resultsString +
						'<br /><br />',
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
					: sprintf(
							/* translators: %1$d is the number of completed items, %2$d is the total number of items */
							__( "You've optimized %1$d out of %2$d items! 🎉", 'jetpack' ),
							incomplete.completed,
							incomplete.total
					  );

			if ( incompleteString ) {
				const teaseCompletion = __(
					'Your post is looking great! Come back anytime to complete the rest.',
					'jetpack'
				);
				addMessage( {
					content: createInterpolateElement(
						'<strong>' + incompleteString + '</strong><br />' + teaseCompletion,
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
							'<strong>SEO improvements complete! 🎉</strong><br/>Your blog post is now search-engine friendly.<br />Happy blogging! 😊',
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
		title: __( 'Your post is ready', 'jetpack' ),
		label: 'completion',
		messages,
		type: 'completion',
		onStart: startHandler,
		submitCtaLabel: __( 'Done!', 'jetpack' ),
		value,
		setValue,
	};
};
