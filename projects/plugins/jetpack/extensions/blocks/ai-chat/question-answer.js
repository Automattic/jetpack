/**
 * WordPress dependencies
 */
import { Button, TextControl, KeyboardShortcuts, ExternalLink } from '@wordpress/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MarkdownIt from 'markdown-it';
/**
 * Internal dependencies
 */
import Loading from './loading';
import useSubmitQuestion from './use-submit-question';

export default function QuestionAnswer() {
	const [ answer, setAnswer ] = useState( '' );
	const [ aiResponse, setAiResponse ] = useState( '' );

	const markdownConverter = new MarkdownIt( { html: true } );

	useEffect( () => {
		if ( aiResponse !== '' && aiResponse !== undefined ) {
			if ( aiResponse === '[DONE]' ) {
				setAnswer( markdownConverter.render( `${ answer }` ) );
			} else {
				setAnswer( markdownConverter.renderInline( `${ answer }${ aiResponse }` ) );
			}
		}
	}, [ aiResponse ] );

	const { question, setQuestion, isLoading, submitQuestion, references, waitString, error } =
		useSubmitQuestion( setAiResponse );

	const handleSubmitQuestion = () => {
		setAnswer( '' );
		submitQuestion();
	};

	return (
		<>
			<KeyboardShortcuts
				shortcuts={ {
					enter: handleSubmitQuestion,
				} }
			>
				<div className="jetpack-ai-chat-question-wrapper">
					<TextControl
						className="jetpack-ai-chat-question-input"
						placeholder={ __( "Enter a question about this blog's content", 'jetpack' ) }
						size={ 50 }
						value={ question }
						onChange={ newQuestion => setQuestion( newQuestion ) }
					/>

					<Button variant="primary" disabled={ isLoading } onClick={ handleSubmitQuestion }>
						{ __( 'Ask', 'jetpack' ) }
					</Button>
				</div>
			</KeyboardShortcuts>
			<div>
				<div className="jetpack-ai-chat-answer-container">
					{ error && <div className="jetpack-ai-chat-error">{ error }</div> }
					{ isLoading ? (
						<>
							<Loading />
							{ <div className="jetpack-ai-chat-wait-string">{ waitString } </div> }
						</>
					) : (
						<div className="content">
							<RawHTML>{ answer }</RawHTML>
						</div>
					) }
				</div>
				{ references && references.length > 0 && (
					<div className="jetpack-ai-chat-answer-references">
						<div>{ __( 'Related resources:', 'jetpack' ) }</div>

						<ul>
							{ references.map( ( reference, index ) => (
								<li key={ index }>
									<ExternalLink href={ reference.url }>{ reference.title }</ExternalLink>
								</li>
							) ) }
						</ul>
					</div>
				) }
			</div>
		</>
	);
}
