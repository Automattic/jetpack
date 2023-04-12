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

export default function QuestionAnswer() {
	const { query, setQuery, docs, isLoading, submitQuestion, references } = useSubmitQuestion();

	return (
		<>
			<div className="question-input">
				<KeyboardShortcuts
					shortcuts={ {
						enter: submitQuestion,
					} }
				>
					<TextControl
						id="jetpack-ai-chat-query-input"
						placeholder={ __( 'Enter a question to Ask WP!', 'jetpack' ) }
						size={ 50 }
						value={ query }
						onChange={ newQuery => setQuery( newQuery ) }
					/>

					<Button variant="primary" disabled={ isLoading } onClick={ submitQuestion }>
						{ __( 'Get Docs', 'jetpack' ) }
					</Button>
				</KeyboardShortcuts>
			</div>
			<div>
				<div id="jetpack-ai-chat-docs-container">
					{ isLoading ? (
						<>
							<Spinner />
							{ __( 'Looking for the answer …', 'jetpack' ) }
						</>
					) : (
						<div> { docs } </div>
					) }
				</div>
				{ references && references.length > 0 && ! isLoading && (
					<div className="references">
						<div>{ __( 'The above answer was sourced from the following pages:', 'jetpack' ) }</div>

						<ul>
							{ references.map( ( reference, index ) => (
								<li key={ index }>
									<ExternalLink href={ reference }>{ reference }</ExternalLink>
								</li>
							) )}
						</ul>
					</div>
				) }
			</div>
		</>
	);
}
