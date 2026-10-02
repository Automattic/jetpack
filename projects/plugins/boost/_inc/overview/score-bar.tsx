import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Spinner, ProgressBar } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Icon, dashboard, desktop, mobile } from '@wordpress/icons';
import { Badge, Text, VisuallyHidden } from '@wordpress/ui';
import {
	formatScoreDelta,
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
	return (
		<section
			className="jetpack-boost-score-bar"
			aria-label={ __( 'Site speed summary', 'jetpack-boost' ) }
			aria-hidden="true"
		>
			{ displayState === 'error' ? (
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
						<VisuallyHidden>
							{ _x( 'Overall', 'combined speed score grade', 'jetpack-boost' ) }
						</VisuallyHidden>
						<Text variant="heading-md">
							{ getScoreLetter( scores.current.mobile, scores.current.desktop ) }
						</Text>
						<Text
							className={ `jetpack-boost-score-bar__band jetpack-boost-overview__tier--${ overallTier }` }
						>
							{ getScoreTierLabel( overallTier ) }
						</Text>
					</div>
					{ ( [ 'desktop', 'mobile' ] as const ).map( device => {
						const score = scores.current[ device ];
						const tier = getScoreTier( score );
						const gain = getScoreGain( score, scores.noBoost?.[ device ], scores.isStale );
						const label =
							device === 'desktop'
								? __( 'Desktop', 'jetpack-boost' )
								: __( 'Mobile', 'jetpack-boost' );
						return (
							<div key={ device } className="jetpack-boost-score-bar__device">
								<Icon
									icon={ device === 'desktop' ? desktop : mobile }
									className="jetpack-boost-overview__score-icon"
								/>
								<VisuallyHidden>{ label }</VisuallyHidden>
								<Text variant="heading-md">{ score }</Text>
								<ProgressBar
									className={ `jetpack-boost-score-bar__meter jetpack-boost-overview__progress--${ tier }` }
									value={ score }
									aria-label={ label }
								/>
								<span
									className={ `jetpack-boost-score-bar__dot jetpack-boost-score-bar__dot--${ tier }` }
									aria-hidden="true"
								/>
								{ gain !== null && (
									<>
										<Badge
											className="jetpack-boost-score-bar__points"
											intent={ gain > 0 ? 'informational' : 'none' }
											aria-hidden="true"
										>
											{ gain > 0 ? `+${ gain }` : String( gain ) }
										</Badge>
										<VisuallyHidden>{ formatScoreDelta( gain ) }</VisuallyHidden>
									</>
								) }
							</div>
						);
					} ) }
				</>
			) }
		</section>
	);
}
