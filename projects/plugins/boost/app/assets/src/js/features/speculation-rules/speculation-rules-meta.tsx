import { __, _n, sprintf } from '@wordpress/i18n';
import { useDataSyncSubset } from '@automattic/jetpack-react-data-sync-client';
import { useSpeculationRules } from '$lib/stores/speculation-rules';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { recordBoostEvent } from '$lib/utils/analytics';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import { BypassPatterns } from '$features/ui/bypass-patterns/bypass-pattern';
import styles from './speculation-rules-meta.module.scss';

const Meta = () => {
	const speculationRules = useSpeculationRules();
	const [ patterns, mutateBypassPatterns ] = useDataSyncSubset(
		speculationRules,
		'bypass_patterns'
	);
	const totalBypassPatterns = patterns?.length || 0;

	const getSummary = () => {
		return totalBypassPatterns > 0
			? sprintf(
					/* translators: %d is the number of bypass patterns. */
					_n( '%d exception.', '%d exceptions.', totalBypassPatterns, 'jetpack-boost' ),
					totalBypassPatterns
			  )
			: __( 'No exceptions.', 'jetpack-boost' );
	};

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line !== '' );

		recordBoostEvent( 'speculation_rules_bypass_patterns', {
			total: newPatterns.length,
		} );
		mutateBypassPatterns.mutate( newPatterns );
	};

	const content = (
		<div className={ styles.body }>
			<BypassPatterns
				patterns={ patterns.join( '\n' ) }
				setPatterns={ updatePatterns }
				showErrorNotice={ mutateBypassPatterns.isError }
				label={ __(
					'URLs of pages and posts that will not have speculation rules applied:',
					'jetpack-boost'
				) }
				description={ __(
					'Enter one URL per line. These pages will not have speculation rules applied to them.',
					'jetpack-boost'
				) }
				errorMessage={ __( 'Error: Invalid format', 'jetpack-boost' ) }
				source="speculation_rules"
			/>
		</div>
	);

	return (
		speculationRules && (
			<div className={ styles.wrapper } data-testid="speculation-rules-meta">
				<CollapsibleMeta
					headerText={ getSummary() }
					toggleText={ __( 'Show Options', 'jetpack-boost' ) }
					tracksEvent={ 'speculation_rules_exceptions_panel_toggle' }
				>
					{ content }
				</CollapsibleMeta>
			</div>
		)
	);
};

export default () => {
	return (
		<ErrorBoundary
			fallback={
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Speculation Rules settings.', 'jetpack-boost' ) ) }
				/>
			}
		>
			<Meta />
		</ErrorBoundary>
	);
};
