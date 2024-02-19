import {
	BoostScoreGraph,
	Button,
	Gridicon,
	Popover,
	Spinner,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './graph-component.module.scss';
import { PerformanceHistoryData } from '../lib/types';

const DummyGraph = ( { children } ) => {
	return (
		<div className={ styles.dummy }>
			{ children }

			<BoostScoreGraph isPlaceholder={ true } />
		</div>
	);
};

type GraphComponentProps = PerformanceHistoryData & {
	needsUpgrade: boolean;
	handleUpgrade: () => void;
	isFreshStart: boolean;
	handleDismissFreshStart: () => void;
	isLoading: boolean;
};

const GraphComponent = ( {
	periods = [],
	annotations = [],
	startDate = 0,
	endDate = 0,
	needsUpgrade,
	handleUpgrade,
	isFreshStart,
	handleDismissFreshStart,
	isLoading,
}: GraphComponentProps ) => {
	if ( isLoading ) {
		return (
			<div className={ styles.dummy }>
				<Spinner color="#000000" />
			</div>
		);
	}

	if ( needsUpgrade ) {
		return (
			<DummyGraph>
				<Popover
					icon={ <Gridicon icon="lock" /> }
					action={
						<Button onClick={ handleUpgrade }>{ __( 'Upgrade now!', 'jetpack-boost' ) }</Button>
					}
				>
					<p>
						{ __(
							'Upgrade and learn more about your site performance over time.',
							'jetpack-boost'
						) }
					</p>
				</Popover>
			</DummyGraph>
		);
	}

	if ( isFreshStart ) {
		return (
			<DummyGraph>
				<Popover
					icon={ <Gridicon icon="checkmark" /> }
					action={
						<Button onClick={ handleDismissFreshStart }>
							{ __( 'Okay, got it!', 'jetpack-boost' ) }
						</Button>
					}
				>
					<p>
						{ __( 'Hello there! Jetpack Boost premium has been activated.', 'jetpack-boost' ) }
						<br />
						{ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
					</p>
				</Popover>
			</DummyGraph>
		);
	}

	return (
		<BoostScoreGraph
			periods={ periods }
			annotations={ annotations }
			startDate={ startDate }
			endDate={ endDate }
		/>
	);
};

export default GraphComponent;
