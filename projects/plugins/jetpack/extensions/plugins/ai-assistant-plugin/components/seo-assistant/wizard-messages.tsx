/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import bigSkyIcon from './big-sky-icon.svg';
import TypingMessage from './typing-message';
import { useArrayState } from './use-array-state';
/**
 * Types
 */
import type { Message } from './types';

const randomId = () => Math.random().toString( 32 ).substring( 2, 8 );

/**
 * Custom hook to manage messages in the wizard
 * @param {number} count - The number of message arrays to initialize, for dynamic steps
 * @return {object} An object containing methods to manage messages
 */
export const useMessages = ( count = 1 ) => {
	const [ messagesArray, setMessages ] = useArrayState< Message[] >(
		Array.from( { length: count }, () => [] )
	);

	const wrapMessagesWithId = useCallback(
		( rawMessages: Message[], id = 0 ) => {
			setMessages(
				rawMessages.map( rawMessage => ( {
					...rawMessage,
					id: rawMessage.id || randomId(),
				} ) ),
				id
			);
		},
		[ setMessages ]
	);

	const addMessage = async ( message: Message, id = 0 ) => {
		const newMessage = {
			...message,
			showIcon: message.showIcon === false ? false : ! message.isUser,
			id: message.id || randomId(),
		} as Message;

		setMessages( previousMessages => [ ...previousMessages, newMessage ], id );
	};

	/* Removes last message */
	const removeLastMessage = ( id = 0 ) => {
		setMessages( previousMessages => previousMessages.slice( 0, -1 ), id );
	};

	/* Edits content of last message */
	const editLastMessage = ( content: Message[ 'content' ], append = false, id = 0 ) => {
		setMessages( previousMessages => {
			const next = [ ...previousMessages ];

			if ( next.length > 0 ) {
				const lastMessageContent = next[ next.length - 1 ].content;
				let newContent = content;

				if ( append ) {
					if ( typeof lastMessageContent === 'object' || typeof newContent === 'object' ) {
						newContent = (
							<>
								{ lastMessageContent }
								{ newContent }
							</>
						);
					} else {
						newContent = `${ lastMessageContent } + ${ newContent }`;
					}
				}

				next[ next.length - 1 ] = {
					...next[ next.length - 1 ],
					content: newContent,
				};
			}

			return next;
		}, id );
	};

	const setSelectedMessage = ( message: Message, id = 0 ) => {
		setMessages( previousMessages => {
			const next = previousMessages.map( previousMessage => ( {
				...previousMessage,
				selected: message.id === previousMessage.id,
			} ) );

			return next;
		}, id );
	};

	return {
		getMessages: ( id = 0 ) => messagesArray[ id ],
		setMessages: wrapMessagesWithId,
		addMessage,
		removeLastMessage,
		editLastMessage,
		setSelectedMessage,
	};
};

export const MessageBubble = ( { message, onSelect = ( m: Message ) => m } ) => {
	return (
		<div
			className={ clsx( 'jetpack-wizard-chat__message', {
				'is-user': message.isUser,
				'is-option': message.type === 'option',
			} ) }
		>
			<div className="jetpack-wizard-chat__message-icon">
				{ message.showIcon && (
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant avatar', 'jetpack' ) } />
				) }
			</div>

			{ message.type === 'option' && (
				<button
					className={ clsx( 'jetpack-wizard-chat__option', {
						'is-selected': message.selected,
					} ) }
					onClick={ () => onSelect( message ) }
				>
					{ message.content }
				</button>
			) }

			{ ( ! message.type || message.type === 'chat' ) && (
				<div className="jetpack-wizard-chat__message-text">{ message.content }</div>
			) }
		</div>
	);
};

export default function Messages( { onSelect, messages, isBusy } ) {
	return (
		<>
			<div className="jetpack-wizard-chat__messages">
				{ messages.map( ( message: Message ) => (
					<MessageBubble key={ message.id } onSelect={ onSelect } message={ message } />
				) ) }
				{ isBusy && <MessageBubble message={ { content: <TypingMessage />, showIcon: true } } /> }
			</div>
		</>
	);
}
