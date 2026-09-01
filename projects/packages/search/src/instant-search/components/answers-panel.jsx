import { __, sprintf } from '@wordpress/i18n';
import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { markdownToHtml } from '../lib/markdown';
import AnimatedEllipsis from './animated-ellipsis';
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
 * @param {object}        props             - Component props.
 * @param {string}        props.status      - 'idle' | 'loading' | 'streaming' | 'done' | 'error'
 * @param {string}        props.text        - Accumulated answer text (markdown).
 * @param {Array}         props.citations   - Array of { title, url, excerpt } citation objects.
 * @param {object}        props.error       - Error info: { message, code, source } or null.
 * @param {string|null}   props.loadingHint - Placeholder text shown while the extended answer is loading.
 * @param {Function|null} props.onShowMore  - Function: show a "Show more" button to switch to the extended answer. null: extended mode active, render full content. undefined: standard overflow toggle.
 * @return {React.ReactElement|null} The rendered panel or null.
 */
export default function AnswersPanel( {
	status,
	text,
	citations = [],
	error = null,
	loadingHint = null,
	onShowMore,
} ) {
	const [ expanded, setExpanded ] = useState( false );
	const [ overflows, setOverflows ] = useState( false );
	const contentRef = useRef( null );

	// Reset collapse state when the displayed answer switches (e.g. brief → extended loading).
	useEffect( () => {
		if ( status === 'loading' || status === 'streaming' ) {
			setExpanded( false );
			setOverflows( false );
		}
	}, [ status ] );

	// useLayoutEffect fires synchronously after DOM update but before paint,
	// so overflow detection and button render happen in the same frame as the collapse.
	useLayoutEffect( () => {
		if ( status === 'done' && contentRef.current ) {
			setOverflows( contentRef.current.scrollHeight > contentRef.current.clientHeight );
		}
	}, [ status, text ] );

	if ( status === 'idle' ) {
		return null;
	}

	if ( status === 'error' ) {
		return (
			<div className="jp-search-answers-panel jp-search-answers-panel--error" role="alert">
				<h2 className="jp-search-answers-panel__heading">
					{ __( 'AI answer', 'jetpack-search-pkg' ) }
				</h2>
				<div className="jp-search-answers-panel__error">
					<p className="jp-search-answers-panel__error-message">
						{ __( 'Sorry, an error occurred while generating an answer.', 'jetpack-search-pkg' ) }
					</p>
					{ error && (
						<p
							className="jp-search-answers-panel__error-detail"
							data-testid="answers-panel-error-detail"
						>
							{ error.message }
							{ error.code !== null && (
								<>
									<br />
									{
										/* translators: %s: numeric error code */ sprintf(
											__( 'Error code: %s', 'jetpack-search-pkg' ),
											error.code
										)
									}
								</>
							) }
						</p>
					) }
				</div>
			</div>
		);
	}

	// onShowMore semantics:
	//   function  → brief answer is done; show a "Show more" button to load the extended answer
	//   null      → extended mode is active; render full combined content without collapse
	//   undefined → no dual-answer flow; use standard overflow expand/collapse toggle
	const isCollapsible = status === 'done';
	// In extended mode (null) the panel is always fully expanded.
	const isCollapsed = isCollapsible && onShowMore === undefined && ! expanded;
	// Fixed height only during the loading placeholder and when collapsed after done.
	// During streaming the panel grows naturally with the incoming content.
	const isFixedHeight = status === 'loading' || isCollapsed;
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
					{ __( 'Finding an answer', 'jetpack-search-pkg' ) }
					<AnimatedEllipsis />
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
									<a
										href={ /^https?:\/\//i.test( url ) ? url : '#' }
										target="_blank"
										rel="noopener noreferrer"
									>
										{ title }
										<ExternalLinkIcon />
									</a>
								</li>
							) ) }
						</ul>
					) }
				</div>
			) }
			{ onShowMore === null && loadingHint && (
				<p className="jp-search-answers-panel__loading-hint">
					{ loadingHint }
					<AnimatedEllipsis />
				</p>
			) }
			{ isCollapsible && typeof onShowMore === 'function' && (
				<button className="jp-search-answers-panel__toggle" onClick={ onShowMore }>
					{ showMoreLabel }
					<span className="jp-search-answers-panel__toggle-icon" aria-hidden="true" />
				</button>
			) }
			{ isCollapsible && onShowMore === undefined && overflows && (
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
