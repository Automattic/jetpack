import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
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
	const editLastMessage = ( content: Message[ 'content' ] ) => {
		setMessages( prev => {
			const prevMessages = [ ...prev ];
			if ( prevMessages.length > 0 ) {
				prevMessages[ prevMessages.length - 1 ] = {
					...prevMessages[ prevMessages.length - 1 ],
					content,
				};
			}
			return prevMessages;
		} );
	};

	return {
		messages,
		setMessages: wrapMessagesWithId,
		addMessage,
		removeLastMessage,
		editLastMessage,
	};
};

export const MessageBubble = ( { message } ) => {
	return (
		<div
			className={ clsx( 'assistant-wizard__message', {
				'is-user': message.isUser,
			} ) }
		>
			<div className="assistant-wizard__message-icon">
				{ message.showIcon && (
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant avatar', 'jetpack' ) } />
				) }
			</div>

			{ message.type === 'past-options' && (
				<div className="assistant-wizard__options">
					{ message.options.map( option => (
						<div
							key={ option.id }
							className={ clsx( 'assistant-wizard__option', {
								'is-selected': option.selected,
							} ) }
						>
							{ option.content }
						</div>
					) ) }
				</div>
			) }

			{ ( ! message.type || message.type === 'chat' ) && (
				<div className="assistant-wizard__message-text">{ message.content }</div>
			) }
		</div>
	);
};

const OptionMessages = ( { options = [], onSelect } ) => {
	if ( ! options.length ) {
		return null;
	}

	return (
		<div className="assistant-wizard__message">
			<div className="assistant-wizard__message-icon"></div>
			<div className="assistant-wizard__message-text">
				<div className="assistant-wizard__options">
					{ options.map( option => (
						<button
							key={ option.id }
							className={ clsx( 'assistant-wizard__option', {
								'is-selected': option.selected,
							} ) }
							onClick={ () => onSelect( option ) }
						>
							{ option.content }
						</button>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default function Messages( { options, onSelect, messages, loading } ) {
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	return (
		<>
			<div className="assistant-wizard__messages">
				{ messages.map( message => (
					<MessageBubble key={ message.id } message={ message } />
				) ) }
				<OptionMessages options={ options } onSelect={ onSelect } />
				{ loading && <MessageBubble message={ { content: <TypingMessage /> } } /> }
			</div>
			<div ref={ messagesEndRef } />
		</>
	);
}
