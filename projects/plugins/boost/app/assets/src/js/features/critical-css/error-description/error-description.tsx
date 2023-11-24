import classNames from 'classnames';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { regenerateCriticalCss } from '../lib/stores/critical-css-state';
import {
	describeErrorSet,
	suggestion,
	rawError,
} from '../lib/describe-critical-css-recommendations';
import actionLinkInterpolateVar from '$lib/utils/action-link-interpolate-var';
import { type InterpolateVars } from '$lib/utils/interplate-vars-types';
import supportLinkInterpolateVar from '$lib/utils/support-link-interpolate-var';
import FoldingElement from '../folding-element/folding-element';
import MoreList from '../more-list/more-list';
import styles from './error-description.module.scss';
import Suggestion from '../suggestion/suggestion';
import { CriticalCssErrorDescriptionTypes, FormattedURL } from './types';

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

	const intepolateVars: InterpolateVars = {
		...actionLinkInterpolateVar( regenerateCriticalCss, 'retry' ),
		...supportLinkInterpolateVar(),
		b: <b />,
	};

	if ( 'listLink' in suggestion( errorSet ) ) {
		intepolateVars.link = (
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<a href={ suggestion( errorSet ).listLink } target="_blank" rel="noreferrer" />
		);
	}

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
						<p className={ styles[ 'raw-error' ] }>{ rawErrors }</p>
					</FoldingElement>
				) : (
					<p className={ classNames( styles[ 'raw-error' ], styles[ 'fade-in' ] ) }>
						{ rawErrors }
					</p>
				) ) }
		</div>
	);
};

export default CriticalCssErrorDescription;
