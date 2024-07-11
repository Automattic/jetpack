import { __, sprintf } from '@wordpress/i18n';
import FoldingElement from '../folding-element/folding-element';
import { ErrorSet, getPrimaryErrorSet } from '../lib/critical-css-errors';
import { CriticalCssState } from '../lib/stores/critical-css-state-types';
import { Notice } from '@automattic/jetpack-components';
import { describeErrorSet, suggestion } from '../lib/describe-critical-css-recommendations';
import { createInterpolateElement } from '@wordpress/element';
import getSupportLinkCriticalCss from '$lib/utils/get-support-link-critical-css';
import NumberedList from '../numbered-list/numbered-list';
import getCriticalCssErrorSetInterpolateVars from '$lib/utils/get-critical-css-error-set-interpolate-vars';
import formatErrorSetUrls from '$lib/utils/format-error-set-urls';
import actionLinkInterpolateVar from '$lib/utils/action-link-interpolate-var';
import { recordBoostEvent } from '$lib/utils/analytics';

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
	const showLearnSection = primaryErrorSet && cssState.status === 'generated';

	return (
		<>
			<Notice
				level="error"
				title={ __( 'Failed to generate Critical CSS', 'jetpack-boost' ) }
				hideCloseButton={ true }
			>
				{ showLearnSection ? (
					<>
						<Description errorSet={ primaryErrorSet } />
						<FoldingElement
							labelExpandedText={ __( 'Learn what to do', 'jetpack-boost' ) }
							labelCollapsedText={ __( 'Learn what to do', 'jetpack-boost' ) }
							onExpand={ ( isExpanded: boolean ) => {
								if ( isExpanded ) {
									recordBoostEvent( 'critical_css_learn_more_expanded', {} );
								}
							} }
						>
							<div className="raw-error">
								<p>{ __( 'Please follow the troubleshooting steps below', 'jetpack-boost' ) }</p>
								<Steps errorSet={ primaryErrorSet } />
								<DocumentationSection errorType={ primaryErrorSet.type.toString() } />
							</div>
						</FoldingElement>
					</>
				) : (
					<OtherErrors
						cssState={ cssState }
						retry={ retry }
						showRetry={ showRetry }
						supportLink={ supportLink }
					/>
				) }
			</Notice>
		</>
	);
};

const Description = ( { errorSet }: { errorSet: ErrorSet } ) => {
	const displayUrls = formatErrorSetUrls( errorSet );

	return (
		<p>
			{ createInterpolateElement( describeErrorSet( errorSet ), {
				b: <b />,
			} ) }{ ' ' }
			{ displayUrls.map( ( { href, label }, index ) => (
				<a href={ href } target="_blank" rel="noreferrer" key={ index }>
					{ label }
				</a>
			) ) }
		</p>
	);
};

const Steps = ( { errorSet }: { errorSet: ErrorSet } ) => {
	const details = suggestion( errorSet );
	if ( ! details.list ) {
		return null;
	}

	const interpolateVars = getCriticalCssErrorSetInterpolateVars( errorSet );

	return <NumberedList items={ details.list } interpolateVars={ interpolateVars } />;
};

const DocumentationSection = ( {
	message,
	errorType,
}: {
	message?: string;
	errorType: string;
} ) => {
	if ( message === undefined ) {
		message = __(
			'If you are still experiencing this issue, <link>learn more</link> from our documentation.',
			'jetpack-boost'
		);
	}

	return (
		<p>
			{ createInterpolateElement( message, {
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ getSupportLinkCriticalCss( errorType ) }
						target="_blank"
						rel="noopener noreferrer"
						onClick={ () => {
							recordBoostEvent( 'critical_css_learn_more', {} );
						} }
					/>
				),
			} ) }
		</p>
	);
};

const OtherErrors = ( { cssState, retry, showRetry, supportLink }: ShowStopperErrorTypes ) => {
	const firstTimeError = __(
		'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
		'jetpack-boost'
	);

	const secondTimeError = __(
		"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
		'jetpack-boost'
	);

	return (
		<>
			{ cssState.status_error === 'css-gen-library-failure' ? (
				<>
					<p>
						{ __(
							'Critical CSS Generator library is either not found or invalid.',
							'jetpack-boost'
						) }
					</p>
					<DocumentationSection
						message={ __(
							'<link>Learn how</link> to fix this by visiting our documentation.',
							'jetpack-boost'
						) }
						errorType={ cssState.status_error }
					/>
					<p>
						{ createInterpolateElement(
							__(
								'If the problem has been resolved, refresh the page and click <retry>here</retry> to try regenerating critical css.',
								'jetpack-boost'
							),
							{
								...actionLinkInterpolateVar( () => {
									recordBoostEvent( 'critical_css_retry', {
										error_type: 'CssGenLibraryFailure',
									} );

									retry();
								}, 'retry' ),
							}
						) }
					</p>
				</>
			) : (
				<>
					<p>{ showRetry ? firstTimeError : secondTimeError }</p>
					<p>
						{ sprintf(
							/* translators: %s: error message */
							__( `Error: %s`, 'jetpack-boost' ),
							cssState.status_error
						) }
					</p>
					{ showRetry ? (
						<button
							className="secondary"
							onClick={ () => {
								recordBoostEvent( 'critical_css_retry', {
									error_type: 'UnknownError',
								} );

								retry();
							} }
						>
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
					) }
				</>
			) }
		</>
	);
};

export default ShowStopperError;
