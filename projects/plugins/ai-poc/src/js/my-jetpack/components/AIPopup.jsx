import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner, TextControl } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './AIPopup.scss';

const AIPopup = ( { onClose } ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ chatInput, setChatInput ] = useState( '' );
	const [ conversation, setConversation ] = useState( [] );
	const chatEndRef = useRef( null );

	// Auto-scroll to bottom when new messages are added
	useEffect( () => {
		chatEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	}, [ conversation ] );

	const sendMessage = async prompt => {
		if ( ! prompt.trim() ) {
			return;
		}

		// Add user message to conversation
		setConversation( prev => [ ...prev, { type: 'user', message: prompt } ] );
		setIsLoading( true );
		setChatInput( '' );

		try {
			const result = await apiFetch( {
				path: '/jetpack-ai-poc/v1/agent',
				method: 'POST',
				data: {
					prompt,
				},
			} );

			// Add AI response to conversation
			if ( result.success ) {
				setConversation( prev => [ ...prev, { type: 'assistant', message: result.message } ] );
			} else {
				setConversation( prev => [
					...prev,
					{
						type: 'error',
						message: result.message || __( 'Failed to execute action', 'jetpack-ai-poc' ),
					},
				] );
			}
		} catch ( err ) {
			setConversation( prev => [
				...prev,
				{
					type: 'error',
					message:
						err.message ||
						__( 'An error occurred while processing your request', 'jetpack-ai-poc' ),
				},
			] );
		} finally {
			setIsLoading( false );
		}
	};

	const handlePredefinedAction = prompt => {
		sendMessage( prompt );
	};

	const handleChatSubmit = e => {
		e.preventDefault();
		sendMessage( chatInput );
	};

	return (
		<div className="jetpack-ai-poc-popup-overlay" onClick={ onClose }>
			<div className="jetpack-ai-poc-popup jetpack-ai-poc-chat" onClick={ e => e.stopPropagation() }>
				<div className="jetpack-ai-poc-popup__header">
					<h2>{ __( 'AI Assistant', 'jetpack-ai-poc' ) }</h2>
					<button
						className="jetpack-ai-poc-popup__close"
						onClick={ onClose }
						aria-label={ __( 'Close', 'jetpack-ai-poc' ) }
					>
						×
					</button>
				</div>

				<div className="jetpack-ai-poc-popup__content">
					<h3 className="jetpack-ai-poc-chat__title">
						{ __( 'What would you like to do today?', 'jetpack-ai-poc' ) }
					</h3>

					<div className="jetpack-ai-poc-popup__actions">
						<Button
							variant="secondary"
							onClick={ () =>
								handlePredefinedAction(
									'Enable site security features (Account Protection and Downtime Monitor)'
								)
							}
							disabled={ isLoading }
						>
							{ __( 'Enable Site Security', 'jetpack-ai-poc' ) }
						</Button>

						<Button
							variant="secondary"
							onClick={ () =>
								handlePredefinedAction(
									'Disable site security features (Account Protection and Downtime Monitor)'
								)
							}
							disabled={ isLoading }
						>
							{ __( 'Disable Site Security', 'jetpack-ai-poc' ) }
						</Button>

						<Button variant="secondary" disabled={ true }>
							{ __( 'Generate Site Report', 'jetpack-ai-poc' ) }
						</Button>
					</div>

					<div className="jetpack-ai-poc-chat__conversation">
						{ conversation.length > 0 && (
							<div className="jetpack-ai-poc-chat__messages">
								{ conversation.map( ( msg, index ) => (
									<div key={ index } className={ `jetpack-ai-poc-chat__message jetpack-ai-poc-chat__message--${ msg.type }` }>
										<div className="jetpack-ai-poc-chat__message-content">{ msg.message }</div>
									</div>
								) ) }
								{ isLoading && (
									<div className="jetpack-ai-poc-chat__message jetpack-ai-poc-chat__message--assistant">
										<div className="jetpack-ai-poc-chat__message-content">
											<Spinner />
											<span>{ __( 'Thinking…', 'jetpack-ai-poc' ) }</span>
										</div>
									</div>
								) }
								<div ref={ chatEndRef } />
							</div>
						) }
					</div>

					<div className="jetpack-ai-poc-chat__input-section">
						<p className="jetpack-ai-poc-chat__input-label">
							{ __( 'Or ask for anything', 'jetpack-ai-poc' ) }
						</p>
						<form onSubmit={ handleChatSubmit } className="jetpack-ai-poc-chat__input-form">
							<TextControl
								value={ chatInput }
								onChange={ setChatInput }
								placeholder={ __( 'Type your message here…', 'jetpack-ai-poc' ) }
								disabled={ isLoading }
								className="jetpack-ai-poc-chat__input"
							/>
							<Button
								type="submit"
								variant="primary"
								disabled={ isLoading || ! chatInput.trim() }
								className="jetpack-ai-poc-chat__send-button"
							>
								{ __( 'Send', 'jetpack-ai-poc' ) }
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AIPopup;
