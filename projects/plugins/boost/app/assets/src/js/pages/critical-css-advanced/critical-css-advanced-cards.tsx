import { __, _n, sprintf } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Button, Card, IconButton, Stack, Text } from '@wordpress/ui';
import { useState } from 'react';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import {
	getErrorSets,
	useRecommendations,
} from '$features/critical-css/recommendations/use-recommendations';
import Collapse from '$features/ui/collapse/collapse';
import styles from './critical-css-advanced-cards.module.scss';
import type { ErrorSet } from '$features/critical-css/lib/critical-css-errors';
import type { ProviderRecommendation } from '$features/critical-css/lib/stores/recommendation-types';

/**
 * An intro card, then one card per failed provider.
 */
const CriticalCssAdvancedCards = () => {
	const { activeRecommendations, dismissedRecommendations, dismiss, showDismissed } =
		useRecommendations();

	const heading =
		activeRecommendations.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	return (
		<Stack direction="column" gap="xl">
			<Card.Root>
				<Card.Content>
					<Stack direction="column" gap="md">
						<Text variant="body-md" render={ <p /> }>
							{ heading }
						</Text>
						{ dismissedRecommendations.length > 0 && (
							<ShowDismissed count={ dismissedRecommendations.length } onShow={ showDismissed } />
						) }
					</Stack>
				</Card.Content>
			</Card.Root>

			{ activeRecommendations.flatMap( recommendation =>
				getErrorSets( recommendation ).map( errorSet => (
					<RecommendationCard
						key={ `${ recommendation.key }-${ errorSet.type }` }
						recommendation={ recommendation }
						errorSet={ errorSet }
						onDismiss={ () => dismiss( recommendation ) }
					/>
				) )
			) }
		</Stack>
	);
};

const ShowDismissed = ( { count, onShow }: { count: number; onShow: () => void } ) => {
	const [ showing, setShowing ] = useState( false );

	return (
		<Collapse open={ ! showing } onCollapsed={ onShow } className={ styles.collapse }>
			<Button variant="minimal" size="compact" onClick={ () => setShowing( true ) }>
				{ sprintf(
					/* translators: %d is a number of recommendations which were previously hidden by the user */
					_n(
						'Show %d hidden recommendation.',
						'Show %d hidden recommendations.',
						count,
						'jetpack-boost'
					),
					count
				) }
			</Button>
		</Collapse>
	);
};

type RecommendationCardProps = {
	recommendation: ProviderRecommendation;
	errorSet: ErrorSet;
	onDismiss: () => void;
};

const RecommendationCard = ( { recommendation, errorSet, onDismiss }: RecommendationCardProps ) => {
	const [ isDismissed, setIsDismissed ] = useState( false );

	return (
		<Collapse open={ ! isDismissed } onCollapsed={ onDismiss } className={ styles.collapse }>
			<Card.Root>
				<Card.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title render={ <h2 /> }>{ recommendation.label }</Card.Title>
						<IconButton
							icon={ close }
							label={ __( 'Dismiss', 'jetpack-boost' ) }
							onClick={ () => setIsDismissed( true ) }
							size="small"
							variant="minimal"
							tone="neutral"
						/>
					</Stack>
				</Card.Header>
				<Card.Content>
					<CriticalCssErrorDescription errorSet={ errorSet } />
				</Card.Content>
			</Card.Root>
		</Collapse>
	);
};

export default CriticalCssAdvancedCards;
