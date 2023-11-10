import { __, _n, sprintf } from '@wordpress/i18n';
import { replaceCssState, updateProvider } from '../../../stores/critical-css-state';
import { type Provider } from '../../../stores/critical-css-state-types';
import InfoIcon from '../../svg/info';
import BackButton from '../back-button';
import CloseButton from '../close-button';

type PropTypes = {
	issues: Provider[];
};

const AdvancedCriticalCss: React.FC< PropTypes > = ( { issues } ) => {
	const dismissedIssues = issues.filter( issue => issue.error_status === 'dismissed' );
	const activeIssues = issues.filter( issue => issue.error_status !== 'dismissed' );

	const heading =
		activeIssues.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	function showDismissedIssues() {
		replaceCssState( {
			providers: issues.map( issue => {
				issue.error_status = 'active';
				return issue;
			} ),
		} );
	}

	function dismissProviderByKey( key ) {
		updateProvider( key, { error_status: 'dismissed' } );
	}

	return (
		<div className="jb-container--narrow jb-critical-css__advanced">
			<BackButton />

			<h3>{ __( 'Critical CSS advanced recommendations', 'jetpack-boost' ) }</h3>

			<section key={ heading }>
				<p>{ heading }</p>

				{ dismissedIssues.length > 0 && (
					<p>
						<button className="components-button is-link" onClick={ showDismissedIssues }>
							{ sprintf(
								/* translators: %d is a number of recommendations which were previously hidden by the user */
								_n(
									'Show %d hidden recommendation.',
									'Show %d hidden recommendations.',
									dismissedIssues.length,
									'jetpack-boost'
								),
								dismissedIssues.length
							) }
						</button>
					</p>
				) }
			</section>

			{ activeIssues.map( ( { key, label } ) => (
				// Add transition:slide|local to the div below
				<div className="panel" key={ key }>
					<CloseButton onClick={ dismissProviderByKey( key ) } />

					<h4>
						<InfoIcon />
						{ label }
					</h4>

					{ /* <div className="problem">
						<CriticalCssErrorDescription errorSet={groupErrorsByFrequency( provider )[ 0 ]} />
					</div> */ }
				</div>
			) ) }
		</div>
	);
};

export default AdvancedCriticalCss;
