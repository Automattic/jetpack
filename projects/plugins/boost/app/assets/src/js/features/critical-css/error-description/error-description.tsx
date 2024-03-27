import classNames from 'classnames';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
import { useRegenerateCriticalCssAction } from '../lib/stores/critical-css-state';
import { useNavigate } from 'react-router-dom';

/**
 * Remove GET parameters that are used to cache-bust from display URLs, as they add visible noise
 * to the error output with no real benefit to users understanding which URLs are problematic.
 *
 * @param url The URL to strip cache parameters from.
 */
function stripCacheParams( url: string ): string {
	const urlObj = new URL( url );
	urlObj.searchParams.delete( 'donotcachepage' );
	return urlObj.toString();
}

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
			label: stripCacheParams( url ),
		};
	} );

	const rawErrors = rawError( errorSet );
	const regenerateAction = useRegenerateCriticalCssAction();
	const navigate = useNavigate();

	function retry() {
		regenerateAction.mutate();
		navigate( '/' );
	}

	const intepolateVars: InterpolateVars = {
		...actionLinkInterpolateVar( retry, 'retry' ),
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
						<p className={ classNames( styles[ 'raw-error' ], styles[ 'no-spacing' ] ) }>
							{ rawErrors }
						</p>
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
