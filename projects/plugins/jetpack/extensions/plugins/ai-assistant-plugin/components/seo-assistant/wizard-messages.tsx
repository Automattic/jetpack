import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import bigSkyIcon from './big-sky-icon.svg';

const Message = ( { message } ) => {
	return (
		<div
			className={ clsx( 'seo-assistant-wizard__message', {
				'is-user': message.isUser,
			} ) }
		>
			<div className="seo-assistant-wizard__message-icon">
				{ message.showIcon && (
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant avatar', 'jetpack' ) } />
				) }
			</div>

			{ message.type === 'past-options' && (
				<div className="seo-assistant-wizard__options">
					{ message.options.map( option => (
						<div
							key={ option.id }
							className={ clsx( 'seo-assistant-wizard__option', {
								'is-selected': option.selected,
							} ) }
						>
							{ option.content }
						</div>
					) ) }
				</div>
			) }

			{ ( ! message.type || message.type === 'chat' ) && (
				<div className="seo-assistant-wizard__message-text">{ message.content }</div>
			) }
		</div>
	);
};

const OptionMessages = ( { currentStepData } ) => {
	if ( currentStepData.type !== 'options' || ! currentStepData.options.length ) {
		return null;
	}

	return (
		<div className="seo-assistant-wizard__message">
			<div className="seo-assistant-wizard__message-icon"></div>
			<div className="seo-assistant-wizard__message-text">
				<div className="seo-assistant-wizard__options">
					{ currentStepData.options.map( option => (
						<button
							key={ option.id }
							className={ clsx( 'seo-assistant-wizard__option', {
								'is-selected': option.selected,
							} ) }
							onClick={ () => currentStepData.onSelect( option ) }
						>
							{ option.content }
						</button>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default function Messages( { currentStepData, messages } ) {
	const messagesEndRef = useRef< HTMLDivElement >( null );
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages ] );

	return (
		<div className="seo-assistant-wizard__messages">
			{ messages.map( message => (
				<Message key={ message.id } message={ message } />
			) ) }
			<OptionMessages currentStepData={ currentStepData } />
			<div ref={ messagesEndRef } />
		</div>
	);
}
