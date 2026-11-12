import { formatCurrency } from '@automattic/number-formatters';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Card, Link, Notice, Skeleton, Stack, Text } from '@wordpress/ui';
import { useMembershipsEarnings } from '../../data/memberships';
import { getOverviewState } from './state';

/**
 * The fee the plan takes from each payment, and where to lower it.
 *
 * @param props            - Component props.
 * @param props.commission - The fee as a fraction.
 * @return The note.
 */
export function CommissionFees( { commission }: { commission: number } ) {
	const { upgradeUrl } = getOverviewState();

	return (
		<Text variant="body-sm">
			{ createInterpolateElement(
				sprintf(
					/* translators: %d: the transaction fee, as a percentage. */
					__(
						'With your current plan, the transaction fee for payments is %d%% (+ <link>Stripe fees</link>).',
						'jetpack-monetize'
					),
					Math.round( commission * 100 )
				),
				{ link: <Link href="https://stripe.com/pricing" openInNewTab /> }
			) }
			{ commission > 0 && upgradeUrl && (
				<>
					{ ' ' }
					<Link href={ upgradeUrl }>{ __( 'Upgrade to lower it.', 'jetpack-monetize' ) }</Link>
				</>
			) }
		</Text>
	);
}

/**
 * What the site has earned from payments.
 *
 * @return The card.
 */
export default function EarningsCard() {
	const { data: earnings, isError, error } = useMembershipsEarnings();

	const figures = [
		{
			label: _x( 'Total earnings', 'Sum of earnings', 'jetpack-monetize' ),
			value: earnings?.total,
		},
		{
			label: _x( 'Last 30 days', 'Sum of earnings over last 30 days', 'jetpack-monetize' ),
			value: earnings?.lastMonth,
		},
		{
			label: _x(
				'Next month',
				'Forecast for the subscriptions due in the next 30 days',
				'jetpack-monetize'
			),
			value: earnings?.forecast,
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Earnings', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ isError ? (
					<Notice.Root intent="error">
						<Notice.Description>
							{ error.message ||
								__( 'Your earnings could not be loaded. Please try again.', 'jetpack-monetize' ) }
						</Notice.Description>
					</Notice.Root>
				) : (
					<Stack direction="column" gap="lg">
						<div className="jp-monetize-overview__figures">
							{ figures.map( ( { label, value } ) => (
								<Stack key={ label } direction="column" gap="xs">
									<Text variant="body-sm">{ label }</Text>
									{ earnings ? (
										<Text variant="heading-lg">
											{ formatCurrency( value ?? 0, earnings.currency ) }
										</Text>
									) : (
										<Skeleton className="jp-monetize-overview__figure-placeholder" />
									) }
								</Stack>
							) ) }
						</div>
						{ earnings && earnings.commission !== null && (
							<CommissionFees commission={ earnings.commission } />
						) }
					</Stack>
				) }
			</Card.Content>
		</Card.Root>
	);
}
