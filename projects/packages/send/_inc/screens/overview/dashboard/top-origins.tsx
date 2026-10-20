import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Skeleton, Stack, Text } from '@wordpress/ui';
import { formatCount } from '../../../data/dates';
import { periodLabel } from '../../../data/period';
import { OriginIcon } from './list-icons';
import type { Period, StatsOrigin } from '../../../data/types';

/** Top five plus "Everything else", so the placeholder takes the same space. */
const ROWS = 6;

/**
 * "What sends the most": the busiest plugins, themes and kinds of WordPress email in the period
 * picked in Email activity, each with its icon.
 *
 * @param props         - Component props.
 * @param props.origins - Top five, then the rest; null while the stats load.
 * @param props.period  - The period they were counted in.
 * @return The card.
 */
const TopOrigins = ( { origins, period }: { origins: StatsOrigin[] | null; period: Period } ) => {
	const titleId = useId();
	return (
		<Card.Root className="jetpack-send-dashboard__card">
			<Card.Header>
				<Stack direction="row" justify="space-between" align="baseline" gap="sm" wrap="wrap">
					<Card.Title id={ titleId } render={ <h2 /> }>
						{ __( 'What sends the most', 'jetpack-send-pkg' ) }
					</Card.Title>
					<Text variant="body-md" className="jetpack-send-muted">
						{ periodLabel( period ) }
					</Text>
				</Stack>
			</Card.Header>
			<Card.Content>
				{ origins ? (
					<ul
						className="jetpack-send-list jetpack-send-list--origins"
						role="list"
						aria-labelledby={ titleId }
					>
						{ origins.map( origin => (
							<li key={ origin.key } className="jetpack-send-list__row">
								<OriginIcon
									originKey={ origin.key }
									label={ origin.label }
									url={ origin.icon_url }
								/>
								<Text
									variant="body-lg"
									className="jetpack-send-list__truncate"
									title={ origin.label }
								>
									{ origin.label }
								</Text>
								<Text variant="body-lg" className="jetpack-send-list__count">
									{ formatCount( origin.count ) }
								</Text>
							</li>
						) ) }
					</ul>
				) : (
					<div aria-hidden="true" className="jetpack-send-list jetpack-send-list--origins">
						{ Array.from( { length: ROWS }, ( _, index ) => (
							<div key={ index } className="jetpack-send-list__row">
								<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--icon" />
								<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--line" />
							</div>
						) ) }
					</div>
				) }
			</Card.Content>
		</Card.Root>
	);
};

export default TopOrigins;
