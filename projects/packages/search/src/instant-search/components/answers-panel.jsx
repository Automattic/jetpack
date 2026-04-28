import { __ } from '@wordpress/i18n';
import * as React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { markdownToHtml } from '../lib/markdown';
import './answers-panel.scss';

const ExternalLinkIcon = () => (
	<svg
		width="10"
		height="10"
		viewBox="0 0 10 10"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		className="jp-search-answers-panel__citation-icon"
	>
		<path
			d="M1 9L9 1M9 1H5M9 1V5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * AI Answers panel displayed above search results.
 *
 * @param {object} props           - Component props.
 * @param {string} props.status    - 'idle' | 'loading' | 'streaming' | 'done' | 'error'
 * @param {string} props.text      - Accumulated answer text (markdown).
 * @param {Array}  props.citations - Array of { title, url, excerpt } citation objects.
 * @return {React.ReactElement|null} The rendered panel or null.
 */
export default function AnswersPanel( { status, text, citations = [] } ) {
	const [ expanded, setExpanded ] = useState( false );
	const [ overflows, setOverflows ] = useState( false );
	const contentRef = useRef( null );

	// useLayoutEffect fires synchronously after DOM update but before paint,
	// so overflow detection and button render happen in the same frame as the collapse.
	useLayoutEffect( () => {
		if ( status === 'done' && contentRef.current ) {
			setOverflows( contentRef.current.scrollHeight > contentRef.current.clientHeight );
		}
	}, [ status, text ] );

	if ( status === 'idle' || status === 'error' ) {
		return null;
	}

	const isCollapsible = status === 'done';
	const isCollapsed = isCollapsible && ! expanded;
	// Keep fixed height through done+collapsed so the panel stays stable when
	// the toggle button appears — flex layout absorbs the button height internally.
	const isFixedHeight = status === 'loading' || status === 'streaming' || isCollapsed;
	const showMoreLabel = __( 'Show more', 'jetpack-search-pkg' );
	const showLessLabel = __( 'Show less', 'jetpack-search-pkg' );

	return (
		<div
			className={
				'jp-search-answers-panel' +
				( isFixedHeight ? ' jp-search-answers-panel--fixed-height' : '' )
			}
			aria-live="polite"
		>
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
					ref={ contentRef }
					className={
						'jp-search-answers-panel__content' +
						( isCollapsed ? ' jp-search-answers-panel__content--collapsed' : '' )
					}
				>
					<div
						className="jp-search-answers-panel__text"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: markdownToHtml( text ) } }
					/>
					{ status === 'done' && citations.length > 0 && (
						<ul className="jp-search-answers-panel__citations">
							{ citations.map( ( { title, url }, i ) => (
								<li key={ i }>
									<a href={ url } target="_blank" rel="noopener noreferrer">
										{ title }
										<ExternalLinkIcon />
									</a>
								</li>
							) ) }
						</ul>
					) }
				</div>
			) }
			{ isCollapsible && overflows && (
				<button
					className={
						'jp-search-answers-panel__toggle' +
						( expanded ? ' jp-search-answers-panel__toggle--expanded' : '' )
					}
					onClick={ () => setExpanded( e => ! e ) }
				>
					{ expanded ? showLessLabel : showMoreLabel }
					<span className="jp-search-answers-panel__toggle-icon" aria-hidden="true" />
				</button>
			) }
		</div>
	);
}
