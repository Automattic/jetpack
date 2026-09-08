import { didScoresChange, getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { CardDivider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, info, mobile } from '@wordpress/icons';
import { Button, Card, Stack, Popover } from '@wordpress/ui';
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
	const noBoost = ! scores.isStale && didScoresChange( scores ) ? scores.noBoost : null;
	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title>{ __( 'Performance scores', 'jetpack-boost' ) }</Card.Title>
					{ headerAction }
				</Stack>
			</Card.Header>
			<CardDivider className="jetpack-boost-overview__scores-divider" />
			<div className="jetpack-boost-overview__score-row">
				<ScoreCard
					icon={ <Icon icon={ dashboard } size={ 20 } /> }
					label={ __( 'Overall grade', 'jetpack-boost' ) }
					help={
						<Popover.Root>
							<Popover.Trigger
								openOnHover
								delay={ 200 }
								aria-label={ __( 'How the overall grade is calculated', 'jetpack-boost' ) }
								render={ <Button variant="minimal" tone="neutral" size="small" /> }
							>
								<Icon icon={ info } size={ 16 } />
							</Popover.Trigger>
							<Popover.Popup className="jetpack-boost-overview__grade-tooltip">
								<Popover.Title>{ __( 'Overall grade', 'jetpack-boost' ) }</Popover.Title>
								<Popover.Description>
									{ __(
										"Your Overall Score is a summary of your first Cornerstone Page across both mobile and desktop devices. It gives a general idea of your site's overall performance.",
										'jetpack-boost'
									) }
								</Popover.Description>
							</Popover.Popup>
						</Popover.Root>
					}
					value={ getScoreLetter( current.mobile, current.desktop ) }
					isLoading={ isLoading }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ desktop } size={ 20 } /> }
					label={ __( 'Desktop', 'jetpack-boost' ) }
					value={ current.desktop }
					score={ current.desktop }
					noBoost={ noBoost?.desktop }
					isLoading={ isLoading }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ mobile } size={ 20 } /> }
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
