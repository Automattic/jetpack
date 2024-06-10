import clsx from 'clsx';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { describeErrorSet, rawError } from '../lib/describe-critical-css-recommendations';
import FoldingElement from '../folding-element/folding-element';
import MoreList from '../more-list/more-list';
import styles from './error-description.module.scss';
import Suggestion from '../suggestion/suggestion';
import { CriticalCssErrorDescriptionTypes, FormattedURL } from './types';
import getCriticalCssErrorSetInterpolateVars from '$lib/utils/get-critical-css-error-set-interpolate-vars';

/**
 * Remove GET parameters that are used to cache-bust from display URLs, as they add visible noise
 * to the error output with no real benefit to users understanding which URLs are problematic.
 *
 * @param url The URL to strip cache parameters from.
 */
export function stripCacheParams( url: string ): string {
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
	const intepolateVars = getCriticalCssErrorSetInterpolateVars( errorSet );

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
						<p className={ clsx( styles[ 'raw-error' ], styles[ 'no-spacing' ] ) }>{ rawErrors }</p>
					</FoldingElement>
				) : (
					<p className={ clsx( styles[ 'raw-error' ], styles[ 'fade-in' ] ) }>{ rawErrors }</p>
				) ) }
		</div>
	);
};

export default CriticalCssErrorDescription;
