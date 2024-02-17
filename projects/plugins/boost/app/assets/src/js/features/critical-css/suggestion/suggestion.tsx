import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type ErrorSet } from '../lib/critical-css-errors';
import { suggestion, footerComponent } from '../lib/describe-critical-css-recommendations';
import { type InterpolateVars } from '$lib/utils/interplate-vars-types';
import NumberedList from '../numbered-list/numbered-list';
import styles from './suggestion.module.scss';

type SuggestionTypes = {
	errorSet: ErrorSet;
	interpolateVars: InterpolateVars;
	showClosingParagraph: boolean;
};

/**
 * Show a suggestion for how a user might be able to fix a Critical CSS issue.
 *
 * @param props                      - Properties
 * @param props.errorSet             - The set of errors to show a suggestion for.
 * @param props.interpolateVars      - Variables to interpolate into the suggestion.
 * @param props.showClosingParagraph - Whether to show the closing paragraph.
 */
const Suggestion: React.FC< SuggestionTypes > = ( {
	errorSet,
	interpolateVars,
	showClosingParagraph,
} ) => {
	const FooterComponent = footerComponent( errorSet );
	const details = suggestion( errorSet );

	return (
		<>
			<h5 className={ styles[ 'suggestion-title' ] }>{ __( 'What to do', 'jetpack-boost' ) }</h5>

			<p className={ styles.suggestion }>
				{ createInterpolateElement( suggestion( errorSet ).paragraph, interpolateVars ) }
			</p>

			{ details.list && (
				<NumberedList items={ details.list } interpolateVars={ interpolateVars } />
			) }

			{ showClosingParagraph && details.closingParagraph && (
				<p className={ styles[ 'suggestion-closing' ] }>
					{ createInterpolateElement( details.closingParagraph, interpolateVars ) }
				</p>
			) }

			{ FooterComponent && <FooterComponent /> }
		</>
	);
};

export default Suggestion;
