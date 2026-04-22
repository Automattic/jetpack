import { __ } from '@wordpress/i18n';
import './answers-panel.scss';

/**
 * AI Answers panel displayed above search results.
 *
 * @param {object} props           - Component props.
 * @param {string} props.status    - 'idle' | 'loading' | 'streaming' | 'done' | 'error'
 * @param {string} props.text      - Accumulated answer text.
 * @param {Array}  props.citations - Array of {title, url, excerpt} from the done event.
 * @return {React.ReactElement|null} The rendered panel or null.
 */
export default function AnswersPanel( { status, text, citations } ) {
	if ( status === 'idle' || status === 'error' ) {
		return null;
	}

	return (
		<div className="jp-search-answers-panel" aria-live="polite">
			{ status === 'loading' && (
				<div className="jp-search-answers-panel__loading">
					{ __( 'Finding an answer…', 'jetpack-search-pkg' ) }
				</div>
			) }

			{ ( status === 'streaming' || status === 'done' ) && (
				<>
					<p className="jp-search-answers-panel__text">{ text }</p>
					{ status === 'done' && citations?.length > 0 && (
						<ul className="jp-search-answers-panel__citations">
							{ citations.map( ( c, i ) => (
								<li key={ i }>
									<a href={ c.url } target="_blank" rel="noopener noreferrer">
										{ c.title }
									</a>
								</li>
							) ) }
						</ul>
					) }
				</>
			) }
		</div>
	);
}
