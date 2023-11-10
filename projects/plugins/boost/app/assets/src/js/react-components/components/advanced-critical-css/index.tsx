import { __, _n, sprintf } from '@wordpress/i18n';
import { replaceCssState, updateProvider } from '../../../stores/critical-css-state';
import { groupErrorsByFrequency } from '../../../stores/critical-css-state-errors';
import { type Provider } from '../../../stores/critical-css-state-types';
import InfoIcon from '../../svg/info';
import BackButton from '../back-button';
import CloseButton from '../close-button';
import CriticalCssErrorDescription from '../critical-css-error-description';

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

	/**
	 * Automatically navigate back to main Settings page if generator isn't done.
	 */
	// @todo - implement
	// $: if ( issues.length === 0 ) {
	// 	navigate( -1 );
	// }

	function showDismissedIssues() {
		replaceCssState( {
			providers: issues.map( issue => {
				issue.error_status = 'active';
				return issue;
			} ),
		} );
	}

	function dismissProvider( { key }: Provider ) {
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

			{ activeIssues.map( ( provider: Provider ) => (
				// Add transition:slide|local to the div below
				<div className="panel" key={ provider.key }>
					<CloseButton onClick={ () => dismissProvider( provider ) } />

					<h4>
						<InfoIcon />
						{ provider.label }
					</h4>

					<div className="problem">
						<CriticalCssErrorDescription errorSet={ groupErrorsByFrequency( provider )[ 0 ] } />
					</div>
				</div>
			) ) }
		</div>
	);
};

export default AdvancedCriticalCss;
