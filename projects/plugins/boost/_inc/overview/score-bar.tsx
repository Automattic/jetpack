import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Spinner, ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, mobile } from '@wordpress/icons';
import { Badge, Text, VisuallyHidden } from '@wordpress/ui';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreTier,
	getScoreTierLabel,
} from './lib/score-utils';
import type { SpeedScoreState } from './lib/use-speed-scores';
import './score-bar.scss';

export default function ScoreBar( { state }: { state: SpeedScoreState } ) {
	const { scores, error, hasScores, isRunning, status } = state;
	const isGenerating = ! error && ( isRunning || status === 'loading' || ! hasScores );
	const overallTier = getScoreTier( ( scores.current.desktop + scores.current.mobile ) / 2 );
	return (
		<section
			className="jetpack-boost-score-bar"
			aria-label={ __( 'Site speed summary', 'jetpack-boost' ) }
		>
			{ error ? (
				<Text className="jetpack-boost-score-bar__error">
					{ __( 'Failed to load speed scores', 'jetpack-boost' ) }
				</Text>
			) : isGenerating ? (
				<div className="jetpack-boost-score-bar__message">
					<Spinner />
					<Text>{ __( 'Calculating score…', 'jetpack-boost' ) }</Text>
				</div>
			) : (
				<>
					<div className="jetpack-boost-score-bar__overall">
						<Icon icon={ dashboard } className="jetpack-boost-overview__score-icon" />
						<VisuallyHidden>{ __( 'Overall', 'jetpack-boost' ) }</VisuallyHidden>
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
						const delta = getScoreDelta(
							score,
							scores.isStale ? null : scores.noBoost?.[ device ]
						);
						const gain = delta === null ? null : Math.max( 0, delta );
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
