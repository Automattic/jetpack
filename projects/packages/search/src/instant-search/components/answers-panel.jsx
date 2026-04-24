import { __ } from '@wordpress/i18n';
import * as React from 'react';
import { markdownToHtml } from '../lib/markdown';
import './answers-panel.scss';

/**
 * AI Answers panel displayed above search results.
 *
 * @param {object} props        - Component props.
 * @param {string} props.status - 'idle' | 'loading' | 'streaming' | 'done' | 'error'
 * @param {string} props.text   - Accumulated answer text (markdown).
 * @return {React.ReactElement|null} The rendered panel or null.
 */
export default function AnswersPanel( { status, text } ) {
	if ( status === 'idle' || status === 'error' ) {
		return null;
	}

	return (
		<div className="jp-search-answers-panel" aria-live="polite">
			<h2 className="jp-search-answers-panel__heading">
				{ __( 'AI answer', 'jetpack-search-pkg' ) }
			</h2>
			{ status === 'loading' && (
				<div className="jp-search-answers-panel__loading">
					{ __( 'Finding an answer…', 'jetpack-search-pkg' ) }
				</div>
			) }
			{ ( status === 'streaming' || status === 'done' ) && (
				<div
					className="jp-search-answers-panel__text"
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ { __html: markdownToHtml( text ) } }
				/>
			) }
		</div>
	);
}
