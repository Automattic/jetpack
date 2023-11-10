import { useState } from 'react';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { regenerateCriticalCss } from '../../../stores/critical-css-state';
import {
	describeErrorSet,
	suggestion,
	footerComponent,
	rawError,
} from '../../../utils/describe-critical-css-recommendations';
import actionLinkInterpolateVar from '../../utils/action-link-interpolate-var';
import supportLinkInterpolateVar from '../../utils/support-link-interpolate-var';
import FoldingElement from '../folding-element';
import styles from './styles.module.scss';
import {
	CriticalCssErrorDescriptionTypes,
	MoreListTypes,
	FormattedURL,
	SuggestionTypes,
	NumberedListTypes,
} from './types';

const CriticalCssErrorDescription: React.FC< CriticalCssErrorDescriptionTypes > = ( {
	errorSet,
	showSuggestion = true,
	foldRawErrors = true,
	showClosingParagraph = true,
} ) => {
	// Keep a set of URLs in an easy-to-render {href:, label:} format.
	// Each should show the URL in its label, but actually link to error.meta.url if available.
	const displayUrls: FormattedURL[] = Object.entries( errorSet.byUrl ).map( ( [ url, error ] ) => {
		let href = url;
		if ( error.meta.url && typeof error.meta.url === 'string' ) {
			href = error.meta.url;
		}
		return {
			href,
			label: url,
		};
	} );

	const rawErrors = rawError( errorSet );

	const intepolateVars = {
		...actionLinkInterpolateVar( regenerateCriticalCss, 'retry' ),
		...supportLinkInterpolateVar(),
		b: <b />,
	};

	return (
		<div className={ styles[ 'error-description' ] }>
			<span>{ createInterpolateElement( describeErrorSet( errorSet ), intepolateVars ) }</span>

			<MoreList entries={ displayUrls } />

			{ showSuggestion && (
				<Suggestion
					errorSet={ errorSet }
					interpolateVars={ intepolateVars }
					showClosingParagraph={ showClosingParagraph }
				/>
			) }

			{ !! rawErrors &&
				( foldRawErrors ? (
					<FoldingElement
						labelExpandedText={ __( 'See error message', 'jetpack-boost' ) }
						labelCollapsedText={ __( 'Hide error message', 'jetpack-boost' ) }
					>
						{ /* @todo - <p className="raw-error" transition:slide|local> */ }
						<p className={ styles[ 'raw-error' ] }>{ rawErrors }</p>
					</FoldingElement>
				) : (
					// @todo - <p class="raw-error" transition:slide|local>
					<p className={ styles[ 'raw-error' ] }>{ rawErrors }</p>
				) ) }
		</div>
	);
};

const MoreList: React.FC< MoreListTypes > = ( { entries = [], showLimit = 2 } ) => {
	const { expanded, setExpanded } = useState( false );
	const listItems = expanded ? entries : entries.slice( 0, showLimit );
	const showExpandButton = ! expanded && entries.length > showLimit;

	return (
		<>
			<ul className={ styles[ 'more-list' ] }>
				{ listItems.map( ( { href, label }, index ) => (
					// @todo - fix key.
					<li key={ index }>
						<a href={ href } target="_blank" rel="noreferrer">
							{ label }
						</a>
					</li>
				) ) }
			</ul>
			{ showExpandButton && (
				// eslint-disable-next-line jsx-a11y/anchor-is-valid
				<a
					onClick={ event => {
						event.preventDefault();
						setExpanded( ! expanded );
					} }
					href="#"
				>
					{ sprintf(
						/* translators: %d is the number of items in this list hidden behind this link */
						__( '…and %d more', 'jetpack-boost' ),
						entries.length - showLimit
					) }
				</a>
			) }
		</>
	);
};

const Suggestion: React.FC< SuggestionTypes > = ( {
	errorSet,
	interpolateVars,
	showClosingParagraph,
} ) => {
	const FooterComponent = footerComponent( errorSet );

	return (
		<>
			<h5 className={ styles[ 'suggestion-title' ] }>{ __( 'What to do', 'jetpack-boost' ) }</h5>

			<p className={ styles.suggestion }>
				{ createInterpolateElement( suggestion( errorSet ).paragraph, interpolateVars ) }
			</p>

			{ suggestion( errorSet ).list && (
				<NumberedList items={ suggestion( errorSet ).list } interpolateVars={ interpolateVars } />
			) }

			{ showClosingParagraph && !! suggestion( errorSet ).closingParagraph && (
				<p className={ styles[ 'suggestion-closing' ] }>
					{ createInterpolateElement( suggestion( errorSet ).closingParagraph, interpolateVars ) }
				</p>
			) }

			{ FooterComponent && <FooterComponent /> }
		</>
	);
};

const NumberedList: React.FC< NumberedListTypes > = ( { items, interpolateVars } ) => {
	return (
		<ol className="numbered-list">
			{ items.map( ( item, index ) => (
				// @todo - fix key
				// @todo - fix item that shows for error 500. It holds a hard-coded link in the translatable string.
				<li key={ index }>
					<span className="index">{ index + 1 }</span>
					<span className="text">{ createInterpolateElement( item, interpolateVars ) }</span>
				</li>
			) ) }
		</ol>
	);
};

export default CriticalCssErrorDescription;
