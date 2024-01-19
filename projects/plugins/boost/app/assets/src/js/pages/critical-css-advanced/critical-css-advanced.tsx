import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCriticalCssState,
	useSetProviderErrorDismissedAction,
} from '$features/critical-css/lib/stores/critical-css-state';
import { groupErrorsByFrequency } from '$features/critical-css/lib/critical-css-errors';
import { BackButton, CloseButton } from '$features/ui';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import InfoIcon from '$svg/info';
import styles from './critical-css-advanced.module.scss';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider } from '$features/critical-css';

/**
 * Page for displaying advanced critical CSS recommendations.
 */
export default function AdvancedCriticalCss() {
	const [ cssState ] = useCriticalCssState();
	const setDismissedAction = useSetProviderErrorDismissedAction();

	const issues = cssState.providers.filter( p => p.status === 'error' );
	const activeIssues = issues.filter( issue => issue.error_status !== 'dismissed' );
	const dismissedIssues = issues.filter( issue => issue.error_status === 'dismissed' );

	function setDismissed( data: { key: string; dismissed: boolean }[] ) {
		setDismissedAction.mutate( data );
	}

	// If there are no issues at all, redirect to the main page.
	const navigate = useNavigate();
	useEffect( () => {
		if ( issues.length === 0 ) {
			navigate( '/' );
		}
	}, [ issues, navigate ] );

	const heading =
		activeIssues.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	const showDismissedIssues = () => {
		setDismissed( dismissedIssues.map( issue => ( { key: issue.key, dismissed: false } ) ) );
	};

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
					<CloseButton
						onClick={ () => setDismissed( [ { key: provider.key, dismissed: true } ] ) }
					/>

					<h4>
						<InfoIcon />
						{ provider.label }
					</h4>

					<div className={ styles.problem }>
						<CriticalCssErrorDescription errorSet={ groupErrorsByFrequency( provider )[ 0 ] } />
					</div>
				</div>
			) ) }
		</div>
	);
}
