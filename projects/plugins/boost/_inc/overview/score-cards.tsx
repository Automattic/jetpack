import { didScoresChange, getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { CardDivider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, info, mobile } from '@wordpress/icons';
import { Card, Stack, Popover } from '@wordpress/ui';
import GradeExplanation from '../../app/assets/src/js/features/speed-score/context-tooltip/grade-explanation';
import { getGradeTier } from './lib/score-utils';
import ScoreCard from './score-card';
import type { SpeedScoresSet } from './lib/use-speed-scores';
import type { ReactNode } from 'react';

type Props = {
	scores: SpeedScoresSet;
	isLoading?: boolean;
	showPlaceholder?: boolean;
	headerAction?: ReactNode;
};

export default function ScoreCards( { scores, isLoading, showPlaceholder, headerAction }: Props ) {
	const { current } = scores;
	const grade = getScoreLetter( current.mobile, current.desktop );
	const noBoost = ! scores.isStale && didScoresChange( scores ) ? scores.noBoost : null;
	return (
		<Card.Root className="jetpack-boost-overview__scores-card">
			<Card.Header className="jetpack-boost-overview__scores-header">
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title>{ __( 'Performance scores', 'jetpack-boost' ) }</Card.Title>
					{ headerAction }
				</Stack>
			</Card.Header>
			<CardDivider className="jetpack-boost-overview__scores-divider" />
			<div className="jetpack-boost-overview__score-row">
				<ScoreCard
					icon={ <Icon icon={ dashboard } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Overall grade', 'jetpack-boost' ) }
					help={
						<Popover.Root>
							<Popover.Trigger
								openOnHover
								delay={ 200 }
								aria-label={ __( 'How the overall grade is calculated', 'jetpack-boost' ) }
								className="jetpack-boost-overview__info-trigger"
							>
								<Icon icon={ info } className="jetpack-boost-overview__score-icon" />
							</Popover.Trigger>
							<Popover.Popup className="jetpack-boost-overview__grade-tooltip">
								<Popover.Title>{ __( 'Overall grade', 'jetpack-boost' ) }</Popover.Title>
								<GradeExplanation
									descriptionComponent={ Popover.Description }
									tableClassName="jetpack-boost-overview__grade-ranges"
								/>
							</Popover.Popup>
						</Popover.Root>
					}
					value={ grade }
					tier={ getGradeTier( grade ) }
					showProgress={ false }
					isLoading={ isLoading }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ desktop } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Desktop', 'jetpack-boost' ) }
					value={ current.desktop }
					score={ current.desktop }
					noBoost={ noBoost?.desktop }
					isLoading={ isLoading }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ mobile } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Mobile', 'jetpack-boost' ) }
					value={ current.mobile }
					score={ current.mobile }
					noBoost={ noBoost?.mobile }
					isLoading={ isLoading }
					showPlaceholder={ showPlaceholder }
				/>
			</div>
		</Card.Root>
	);
}
