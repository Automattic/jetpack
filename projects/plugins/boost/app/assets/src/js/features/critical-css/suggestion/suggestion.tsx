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

			{ showClosingParagraph && suggestion( errorSet ).closingParagraph && (
				<p className={ styles[ 'suggestion-closing' ] }>
					{ createInterpolateElement( suggestion( errorSet ).closingParagraph, interpolateVars ) }
				</p>
			) }

			{ FooterComponent && <FooterComponent /> }
		</>
	);
};

export default Suggestion;
