/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import bigSkyIcon from './big-sky-icon.svg';
import TypingMessage from './typing-message';
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
	const [ messagesArray, setMessagesArray ] = useState< Message[][] >(
		Array.from( { length: count }, () => [] )
	);

	const wrapMessagesWithId = useCallback( ( rawMessages: Message[], id = 0 ) => {
		setMessagesArray( prev => {
			const next = [ ...prev ];
			next[ id ] = rawMessages.map( rawMessage => ( {
				...rawMessage,
				id: rawMessage.id || randomId(),
			} ) );
			return next;
		} );
	}, [] );

	const addMessage = async ( message: Message, id = 0 ) => {
		const newMessage = {
			...message,
			showIcon: message.showIcon === false ? false : ! message.isUser,
			id: message.id || randomId(),
		} as Message;

		setMessagesArray( prev => {
			const next = [ ...prev ];
			next[ id ] = [ ...next[ id ], newMessage ];
			return next;
		} );
	};

	/* Removes last message */
	const removeLastMessage = ( id = 0 ) => {
		setMessagesArray( prev => {
			const next = [ ...prev ];
			next[ id ] = next[ id ].slice( 0, -1 );
			return next;
		} );
	};

	/* Edits content of last message */
	const editLastMessage = ( content: Message[ 'content' ], append = false, id = 0 ) => {
		setMessagesArray( prev => {
			const next = [ ...prev ];
			const prevMessages = [ ...next[ id ] ];
			if ( prevMessages.length > 0 ) {
				const lastMessageContent = prevMessages[ prevMessages.length - 1 ].content;
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
				prevMessages[ prevMessages.length - 1 ] = {
					...prevMessages[ prevMessages.length - 1 ],
					content: newContent,
				};
			}
			return next;
		} );
	};

	const setSelectedMessage = ( message: Message, id = 0 ) => {
		setMessagesArray( prev => {
			const next = [ ...prev ];
			next[ id ] = next[ id ].map( prevMessage => ( {
				...prevMessage,
				selected: message.id === prevMessage.id,
			} ) );
			return next;
		} );
	};

	return {
		getMessages: ( id = 0 ) => messagesArray[ id ],
		setMessages: ( messages: Message[], id = 0 ) => wrapMessagesWithId( messages, id ),
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
