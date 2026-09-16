import { didScoresChange, getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { CardDivider, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, info, mobile } from '@wordpress/icons';
import { Button, Card, Notice, Stack, Popover, Text, VisuallyHidden } from '@wordpress/ui';
import GradeExplanation from './grade-explanation';
import { getScoreTier } from './lib/score-utils';
import ScoreCard from './score-card';
import type { SpeedScoresSet } from './lib/use-speed-scores';
import type { ReactNode } from 'react';

type Props = {
	scores: SpeedScoresSet;
	isLoading?: boolean;
	showPlaceholder?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	isVisible?: boolean;
};

export default function ScoreCards( {
	scores,
	isLoading,
	showPlaceholder,
	error,
	onRetry,
	isVisible = true,
}: Props ) {
	const { current } = scores;
	const grade = getScoreLetter( current.mobile, current.desktop );
	const noBoost = ! scores.isStale && didScoresChange( scores ) ? scores.noBoost : null;
	let body: ReactNode;
	if ( isLoading ) {
		body = (
			<Card.Content className="jetpack-boost-overview__scores-status" aria-busy>
				<Stack direction="row" justify="center" align="center" gap="sm">
					<Spinner />
					<Text>{ __( 'Calculating…', 'jetpack-boost' ) }</Text>
				</Stack>
			</Card.Content>
		);
	} else if ( error ) {
		body = (
			<Card.Content className="jetpack-boost-overview__scores-error">
				<Notice.Root
					intent="error"
					spokenMessage={ isVisible ? __( 'Failed to load speed scores', 'jetpack-boost' ) : '' }
				>
					<Notice.Title>{ __( 'Failed to load speed scores', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>{ error.message }</Notice.Description>
					<Notice.Actions>
						<Button variant="solid" tone="brand" size="compact" onClick={ onRetry }>
							{ __( 'Try again', 'jetpack-boost' ) }
						</Button>
					</Notice.Actions>
				</Notice.Root>
			</Card.Content>
		);
	} else {
		body = (
			<div className="jetpack-boost-overview__score-row">
				<ScoreCard
					icon={ <Icon icon={ dashboard } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Overall', 'jetpack-boost' ) }
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
								<VisuallyHidden render={ <Popover.Title /> }>
									{ __( 'Overall grade', 'jetpack-boost' ) }
								</VisuallyHidden>
								<GradeExplanation
									description={ __(
										'Your overall score is a summary of your first Cornerstone Page across both mobile and desktop devices.',
										'jetpack-boost'
									) }
									descriptionComponent={ Popover.Description }
									tableClassName="jetpack-boost-overview__grade-ranges"
								/>
							</Popover.Popup>
						</Popover.Root>
					}
					value={ grade }
					tier={ getScoreTier( ( current.mobile + current.desktop ) / 2 ) }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ desktop } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Desktop', 'jetpack-boost' ) }
					value={ current.desktop }
					score={ current.desktop }
					noBoost={ noBoost?.desktop }
					showPlaceholder={ showPlaceholder }
				/>
				<ScoreCard
					icon={ <Icon icon={ mobile } className="jetpack-boost-overview__score-icon" /> }
					label={ __( 'Mobile', 'jetpack-boost' ) }
					value={ current.mobile }
					score={ current.mobile }
					noBoost={ noBoost?.mobile }
					showPlaceholder={ showPlaceholder }
				/>
			</div>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__scores-card">
			<Card.Header className="jetpack-boost-overview__scores-header">
				<Card.Title render={ <h2 /> }>{ __( 'Your site speed', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<CardDivider className="jetpack-boost-overview__scores-divider" />
			{ body }
		</Card.Root>
	);
}
