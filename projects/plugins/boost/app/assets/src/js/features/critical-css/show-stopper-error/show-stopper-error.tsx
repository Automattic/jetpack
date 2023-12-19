import { __ } from '@wordpress/i18n';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import ErrorNotice from '$features/error-notice/error-notice';
import FoldingElement from '../folding-element/folding-element';
import ErrorDescription from '../error-description/error-description';
import type { ErrorSet } from '../lib/stores/critical-css-state-errors';

type ShowStopperErrorTypes = {
	supportLink?: string;
	status: CriticalCssState[ 'status' ];
	primaryErrorSet: ErrorSet;
	statusError;
	regenerateCriticalCss;
	showRetry?: boolean;
};

const ShowStopperError: React.FC< ShowStopperErrorTypes > = ( {
	supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/',
	status,
	primaryErrorSet,
	statusError,
	regenerateCriticalCss,
	showRetry,
} ) => {
	const showErrorDescription = primaryErrorSet && status === 'generated';
	const showFoldingElement = showErrorDescription || statusError;

	return (
		<ErrorNotice
			title={ __( 'Failed to generate Critical CSS', 'jetpack-boost' ) }
			variant="module"
			actionButton={
				showRetry ? (
					<button className="secondary" onClick={ regenerateCriticalCss }>
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
			<p>
				{ showRetry
					? __(
							'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
							'jetpack-boost'
					  )
					: __(
							"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
							'jetpack-boost'
					  ) }
			</p>
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
							statusError
						) }
					</div>
				</FoldingElement>
			) }
		</ErrorNotice>
	);
};

export default ShowStopperError;
