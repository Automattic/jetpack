import { didScoresChange, getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, mobile } from '@wordpress/icons';
import { Card, Stack } from '@wordpress/ui';
import ScoreCard from './score-card';
import type { SpeedScoresSet } from './lib/use-speed-scores';
import type { ReactNode } from 'react';

type Props = { scores: SpeedScoresSet; isLoading?: boolean; headerAction?: ReactNode };

export default function ScoreCards( { scores, isLoading, headerAction }: Props ) {
	const { current } = scores;
	const noBoost = ! scores.isStale && didScoresChange( scores ) ? scores.noBoost : null;
	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title>{ __( 'Performance scores', 'jetpack-boost' ) }</Card.Title>
					{ headerAction }
				</Stack>
			</Card.Header>
			<div className="jetpack-boost-overview__score-row">
				<ScoreCard
					icon={ <Icon icon={ dashboard } size={ 20 } /> }
					label={ __( 'Overall grade', 'jetpack-boost' ) }
					value={ getScoreLetter( current.mobile, current.desktop ) }
					isLoading={ isLoading }
				/>
				<ScoreCard
					icon={ <Icon icon={ desktop } size={ 20 } /> }
					label={ __( 'Desktop', 'jetpack-boost' ) }
					value={ current.desktop }
					score={ current.desktop }
					noBoost={ noBoost?.desktop }
					isLoading={ isLoading }
				/>
				<ScoreCard
					icon={ <Icon icon={ mobile } size={ 20 } /> }
					label={ __( 'Mobile', 'jetpack-boost' ) }
					value={ current.mobile }
					score={ current.mobile }
					noBoost={ noBoost?.mobile }
					isLoading={ isLoading }
				/>
			</div>
		</Card.Root>
	);
}
