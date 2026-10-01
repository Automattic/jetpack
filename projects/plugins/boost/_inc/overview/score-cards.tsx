import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { CardDivider } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Icon, dashboard, desktop, info, mobile } from '@wordpress/icons';
import { Button, Card, Notice, Popover, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import IndeterminateProgress from '../../app/assets/src/js/features/ui/indeterminate-progress/indeterminate-progress';
import GradeExplanation from './grade-explanation';
import { getOverallScoreTier, getScoreDisplayState } from './lib/score-utils';
import ScoreCard from './score-card';
import type { SpeedScoresSet } from './lib/use-speed-scores';
import type { ReactNode } from 'react';
import './score-ready.scss';

type Props = {
	scores: SpeedScoresSet;
	isLoading?: boolean;
	isRunning?: boolean;
	hasScores?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	isVisible?: boolean;
};

export default function ScoreCards( {
	scores,
	isLoading,
	isRunning,
	hasScores = true,
	error,
	onRetry,
	isVisible = true,
}: Props ) {
	const titleRef = useRef< HTMLHeadingElement >( null );
	const hasFocus = useRef( false );
	const displayState = getScoreDisplayState( { isRunning, hasScores, error } );
	const showOverlay = displayState === 'generating';
	const [ announceCalculating, setAnnounceCalculating ] = useState( false );
	useEffect( () => {
		setAnnounceCalculating( Boolean( showOverlay ) );
	}, [ showOverlay ] );
	useLayoutEffect( () => {
		if ( showOverlay && hasFocus.current ) {
			titleRef.current?.focus();
		}
	}, [ showOverlay ] );
	const { current } = scores;
	const grade = getScoreLetter( current.mobile, current.desktop );
	const notice = error && (
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
	const calculating = (
		<Card.Content className="jetpack-boost-overview__scores-status" role="status">
			{ showOverlay && (
				<IndeterminateProgress label={ __( 'Testing site speed', 'jetpack-boost' ) }>
					{ announceCalculating && __( 'Calculating…', 'jetpack-boost' ) }
				</IndeterminateProgress>
			) }
		</Card.Content>
	);
	let body: ReactNode;
	if ( ! hasScores ) {
		body = (
			<>
				{ notice }
				{ calculating }
			</>
		);
	} else {
		body = (
			<>
				{ notice }
				<div className="jetpack-boost-overview__scores-area">
					<div
						className={ clsx( 'jetpack-boost-overview__score-row', {
							'jetpack-boost-overview__score-row--hidden': showOverlay,
							'jetpack-boost-score-ready': displayState === 'scores',
						} ) }
						aria-busy={ isLoading }
					>
						<ScoreCard
							icon={ <Icon icon={ dashboard } className="jetpack-boost-overview__score-icon" /> }
							label={ _x( 'Overall', 'combined speed score grade', 'jetpack-boost' ) }
							help={
								<Popover.Root key={ showOverlay ? 'running' : 'loaded' }>
									<Popover.Trigger
										openOnHover
										delay={ 200 }
										aria-label={ __( 'How the overall grade is calculated', 'jetpack-boost' ) }
										className="jetpack-boost-overview__info-trigger"
									>
										<Icon icon={ info } className="jetpack-boost-overview__score-icon" />
									</Popover.Trigger>
									<Popover.Popup
										className="jetpack-boost-overview__score-popover jetpack-boost-overview__grade-tooltip"
										positioner={
											<Popover.Positioner align="start" alignOffset={ -15 } sideOffset={ 5 } />
										}
									>
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
							tier={ getOverallScoreTier( scores ) }
						/>
						<ScoreCard
							icon={ <Icon icon={ desktop } className="jetpack-boost-overview__score-icon" /> }
							label={ __( 'Desktop', 'jetpack-boost' ) }
							value={ current.desktop }
							score={ current.desktop }
							noBoost={ scores.noBoost?.desktop }
							isStale={ scores.isStale }
							closePopover={ showOverlay }
						/>
						<ScoreCard
							icon={ <Icon icon={ mobile } className="jetpack-boost-overview__score-icon" /> }
							label={ __( 'Mobile', 'jetpack-boost' ) }
							value={ current.mobile }
							score={ current.mobile }
							noBoost={ scores.noBoost?.mobile }
							isStale={ scores.isStale }
							closePopover={ showOverlay }
						/>
					</div>
					<div className="jetpack-boost-overview__scores-overlay">{ calculating }</div>
				</div>
			</>
		);
	}
	return (
		<Card.Root
			className="jetpack-boost-overview__scores-card"
			onFocusCapture={ () => {
				hasFocus.current = true;
			} }
			onBlurCapture={ () => {
				hasFocus.current = false;
			} }
		>
			<Card.Header className="jetpack-boost-overview__scores-header">
				<Card.Title render={ <h2 ref={ titleRef } tabIndex={ -1 } /> }>
					{ __( 'Your site speed', 'jetpack-boost' ) }
				</Card.Title>
			</Card.Header>
			<CardDivider className="jetpack-boost-overview__scores-divider" />
			{ body }
		</Card.Root>
	);
}
