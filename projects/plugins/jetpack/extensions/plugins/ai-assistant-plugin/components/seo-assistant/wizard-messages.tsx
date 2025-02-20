import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import bigSkyIcon from './big-sky-icon.svg';
import TypingMessage from './typing-message';
import type { Message } from './types';

const randomId = () => Math.random().toString( 32 ).substring( 2, 8 );

export const useMessages = () => {
	const [ messages, setMessages ] = useState< Message[] >( [] );

	const wrapMessagesWithId = useCallback(
		rawMessages => {
			setMessages(
				rawMessages.map( rawMessage => ( { ...rawMessage, id: rawMessage.id || randomId() } ) )
			);
		},
		[ setMessages ]
	);

	const addMessage = async ( message: Message ) => {
		const newMessage = {
			...message,
			showIcon: message.showIcon === false ? false : ! message.isUser,
			id: message.id || randomId(),
		} as Message;

		setMessages( prev => [ ...prev, newMessage ] );
	};

	/* Removes last message */
	const removeLastMessage = () => {
		setMessages( prev => prev.slice( 0, -1 ) );
	};

	/* Edits content of last message */
	const editLastMessage = ( content: Message[ 'content' ], append = false ) => {
		setMessages( prev => {
			const prevMessages = [ ...prev ];
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
			return prevMessages;
		} );
	};

	const setSelectedMessage = message => {
		setMessages( prev =>
			prev.map( prevMessage => ( { ...prevMessage, selected: message.id === prevMessage.id } ) )
		);
	};

	return {
		messages,
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
				{ messages.map( message => (
					<MessageBubble key={ message.id } onSelect={ onSelect } message={ message } />
				) ) }
				{ isBusy && <MessageBubble message={ { content: <TypingMessage />, showIcon: true } } /> }
			</div>
		</>
	);
}
