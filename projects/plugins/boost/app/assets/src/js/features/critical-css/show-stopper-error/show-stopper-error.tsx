import { __ } from '@wordpress/i18n';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import ErrorNotice from '$features/error-notice/error-notice';
import { useEffect, useState } from 'react';
import FoldingElement from '../folding-element/folding-element';
import ErrorDescription from '../error-description/error-description';

// This simulates a global variable that is shared between all instances of this component.
let globalValue = true;

const useSharedValue = () => {
	const [ value, setValue ] = useState( globalValue );
	const setGlobalValue = newValue => {
		globalValue = newValue;
		setValue( newValue );
	};

	return [ value, setGlobalValue ];
};

type ShowStopperErrorTypes = {
	supportLink?: string;
	status: CriticalCssState[ 'status' ];
	primaryErrorSet;
	statusError;
	regenerateCriticalCss;
};

const ShowStopperError: React.FC< ShowStopperErrorTypes > = ( {
	supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/',
	status,
	primaryErrorSet,
	statusError,
	regenerateCriticalCss,
} ) => {
	const [ firstTime, setFirstTime ] = useSharedValue();
	const showErrorDescription = primaryErrorSet && status === 'generated';
	const showFoldingElement = showErrorDescription || statusError;

	useEffect( () => {
		return () => {
			setFirstTime( false );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<ErrorNotice
			title={ __( 'Failed to generate Critical CSS', 'jetpack-boost' ) }
			actionButton={
				firstTime === false ? (
					<a
						className="button button-secondary"
						href={ supportLink }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'Contact Support', 'jetpack-boost' ) }
					</a>
				) : (
					<button className="secondary" onClick={ regenerateCriticalCss }>
						{ __( 'Refresh', 'jetpack-boost' ) }
					</button>
				)
			}
		>
			<p>
				{ firstTime === false
					? __(
							"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
							'jetpack-boost'
					  )
					: __(
							'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
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
