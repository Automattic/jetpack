import { __ } from '@wordpress/i18n';
import ErrorNotice from '$features/error-notice/error-notice';
import FoldingElement from '../folding-element/folding-element';
import ErrorDescription from '../error-description/error-description';
import { getPrimaryErrorSet } from '../lib/critical-css-errors';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';

type ShowStopperErrorTypes = {
	supportLink?: string;
	cssState: CriticalCssState;
	retry: () => void;
	showRetry?: boolean;
};

const ShowStopperError: React.FC< ShowStopperErrorTypes > = ( {
	supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/',
	cssState,
	retry,
	showRetry,
} ) => {
	const primaryErrorSet = getPrimaryErrorSet( cssState );
	const showErrorDescription = primaryErrorSet && cssState.status === 'generated';
	const showFoldingElement = showErrorDescription || cssState.status_error;

	const firstTimeError = __(
		'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
		'jetpack-boost'
	);

	const secondTimeError = __(
		"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
		'jetpack-boost'
	);

	return (
		<ErrorNotice
			title={ __( 'Failed to generate Critical CSS', 'jetpack-boost' ) }
			variant="module"
			actionButton={
				showRetry ? (
					<button className="secondary" onClick={ retry }>
						{ __( 'Refresh', 'jetpack-boost' ) }
					</button>
				) : (
					<a
						className="button button-secondary"
						href={ supportLink }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'Contact Support', 'jetpack-boost' ) }
					</a>
				)
			}
		>
			<p>{ showRetry ? firstTimeError : secondTimeError }</p>
			{ showFoldingElement && (
				<FoldingElement
					labelExpandedText={ __( 'See error message', 'jetpack-boost' ) }
					labelCollapsedText={ __( 'Hide error message', 'jetpack-boost' ) }
				>
					<div className="raw-error">
						{ showErrorDescription ? (
							<ErrorDescription
								errorSet={ primaryErrorSet }
								showSuggestion={ true }
								showClosingParagraph={ false }
								foldRawErrors={ false }
							/>
						) : (
							cssState.status_error
						) }
					</div>
				</FoldingElement>
			) }
		</ErrorNotice>
	);
};

export default ShowStopperError;
