/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	Spinner,
	KeyboardShortcuts,
	ExternalLink,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useSubmitQuestion from './use-submit-question';

const waitStrings = [
	__( 'Good question, give me a moment to think about that 🤔', 'jetpack' ),
	__( 'Let me work out the answer to that, back soon!', 'jetpack' ),
	__( '🤔 Thinking, thinking, will be back with an answer soon', 'jetpack' ),
];
export default function QuestionAnswer() {
	const { question, setQuestion, answer, isLoading, submitQuestion, references } = useSubmitQuestion();

	return (
		<>
			<KeyboardShortcuts
				shortcuts={ {
					enter: submitQuestion,
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

					<Button variant="primary" disabled={ isLoading } onClick={ submitQuestion }>
						{ __( 'Ask', 'jetpack' ) }
					</Button>
				</div>
			</KeyboardShortcuts>
			<div>
				<div className="jetpack-ai-chat-answer-container">
					{ isLoading ? (
						<>
							<Spinner />
							{ waitStrings[ Math.floor( Math.random() * 3 ) ] }
						</>
					) : (
						// eslint-disable-next-line react/no-danger
						<div dangerouslySetInnerHTML={ { __html: answer } } />
					) }
				</div>
				{ references && references.length > 0 && ! isLoading && (
					<div className="jetpack-ai-chat-answer-references">
						<div>{ __( 'Additional resources:', 'jetpack' ) }</div>

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
