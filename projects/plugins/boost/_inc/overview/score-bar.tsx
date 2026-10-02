import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Spinner, ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, error, mobile } from '@wordpress/icons';
import { Badge, Text } from '@wordpress/ui';
import {
	getOverallScoreTier,
	getScoreDisplayState,
	getScoreGain,
	getScoreTier,
	getScoreTierLabel,
} from './lib/score-utils';
import type { SpeedScoreState } from './lib/use-speed-scores';
import './score-bar.scss';

export default function ScoreBar( { state }: { state: SpeedScoreState } ) {
	const { scores } = state;
	const displayState = getScoreDisplayState( state );
	const overallTier = getOverallScoreTier( scores );
	const failed = displayState === 'error';
	return (
		<div className="jetpack-boost-score-bar" data-testid="score-bar" aria-hidden="true">
			{ failed && ! state.hasScores ? (
				<Text className="jetpack-boost-score-bar__error">
					{ __( 'Failed to load speed scores', 'jetpack-boost' ) }
				</Text>
			) : displayState === 'generating' ? (
				<div className="jetpack-boost-score-bar__message">
					<Spinner />
					<Text>{ __( 'Calculating score…', 'jetpack-boost' ) }</Text>
				</div>
			) : (
				<>
					<div className="jetpack-boost-score-bar__overall">
						<Icon icon={ dashboard } className="jetpack-boost-overview__score-icon" />
						<Text variant="heading-md">
							{ getScoreLetter( scores.current.mobile, scores.current.desktop ) }
						</Text>
						<Text
							className={ `jetpack-boost-score-bar__band jetpack-boost-overview__tier--${ overallTier }` }
						>
							{ getScoreTierLabel( overallTier ) }
						</Text>
						{ failed && (
							<span className="jetpack-boost-score-bar__failed">
								<Icon icon={ error } className="jetpack-boost-overview__score-icon" />
								<Text className="jetpack-boost-score-bar__failed-label">
									{ __( 'Failed to load speed scores', 'jetpack-boost' ) }
								</Text>
							</span>
						) }
					</div>
					{ ( [ 'desktop', 'mobile' ] as const ).map( device => {
						const score = scores.current[ device ];
						const tier = getScoreTier( score );
						const gain = getScoreGain( score, scores.noBoost?.[ device ], scores.isStale );
						return (
							<div key={ device } className="jetpack-boost-score-bar__device">
								<Icon
									icon={ device === 'desktop' ? desktop : mobile }
									className="jetpack-boost-overview__score-icon"
								/>
								<Text variant="heading-md">{ score }</Text>
								<ProgressBar
									className={ `jetpack-boost-score-bar__meter jetpack-boost-overview__progress--${ tier }` }
									value={ score }
								/>
								<span
									className={ `jetpack-boost-score-bar__dot jetpack-boost-score-bar__dot--${ tier }` }
								/>
								{ gain !== null && (
									<Badge
										className="jetpack-boost-score-bar__points"
										intent={ gain > 0 ? 'informational' : 'none' }
									>
										{ gain > 0 ? `+${ gain }` : String( gain ) }
									</Badge>
								) }
							</div>
						);
					} ) }
				</>
			) }
		</div>
	);
}
