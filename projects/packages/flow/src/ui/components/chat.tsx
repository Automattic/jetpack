import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import type { ReactNode } from 'react';

export type ChatMessage = { id: number; role: 'user' | 'assistant'; text: string };

type Props = { messages: ChatMessage[]; children?: ReactNode; footer: ReactNode };

/** The sidebar conversation: the user's prompts as bubbles, replies as plain text, input pinned below. */
export function Chat( { messages, children, footer }: Props ) {
	const end = useRef< HTMLDivElement >( null );

	useEffect( () => {
		end.current?.scrollIntoView?.( { block: 'end', behavior: 'smooth' } );
	}, [ messages.length, children ] );

	return (
		<aside className="jetpack-flow-chat" aria-label={ __( 'Flow assistant', 'jetpack-flow-pkg' ) }>
			<div className="jetpack-flow-chat__messages" role="log" aria-live="polite">
				{ messages.length === 0 && (
					<Text className="jetpack-flow-chat__message is-assistant">
						{ __(
							'Tell me what should happen, or pick a trigger on the left to start.',
							'jetpack-flow-pkg'
						) }
					</Text>
				) }
				{ messages.map( message => (
					<Text
						key={ message.id }
						className={ `jetpack-flow-chat__message is-${ message.role } jetpack-flow-enter` }
					>
						{ message.text }
					</Text>
				) ) }
				{ children }
				<div ref={ end } />
			</div>
			{ footer }
		</aside>
	);
}
