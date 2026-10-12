import { formatCurrency } from '@automattic/number-formatters';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Card, Link, Skeleton, Stack, Text } from '@wordpress/ui';
import { useMembershipsEarnings } from '../data/memberships.ts';
import { getInitialState } from '../state.ts';
import { getPlansUrl } from '../upsell.ts';

/**
 * The transaction fee the plan charges on payments, and how to lower it.
 *
 * @param props            - Component props.
 * @param props.commission - The fee as a fraction.
 * @return The rendered note.
 */
function CommissionFees( { commission }: { commission: number } ) {
	return (
		<Text variant="body-sm">
			{ createInterpolateElement(
				sprintf(
					/* translators: %d: the transaction fee, as a percentage. */
					__(
						'With your current plan, the transaction fee for payments is %d%% (+ <link>Stripe fees</link>).',
						'jetpack-mu-wpcom'
					),
					Math.round( commission * 100 )
				),
				{ link: <Link href="https://stripe.com/pricing" openInNewTab /> }
			) }
			{ commission > 0 && (
				<>
					{ ' ' }
					<Link href={ getPlansUrl( getInitialState().domain ) }>
						{ __( 'Upgrade to lower it.', 'jetpack-mu-wpcom' ) }
					</Link>
				</>
			) }
		</Text>
	);
}

/**
 * What the site has earned from payments.
 *
 * @return The rendered card.
 */
export function EarningsCard() {
	const { data: earnings, isLoading } = useMembershipsEarnings();

	const figures = [
		{
			label: _x( 'Total earnings', 'Sum of earnings', 'jetpack-mu-wpcom' ),
			value: earnings?.total,
		},
		{
			label: _x( 'Last 30 days', 'Sum of earnings over last 30 days', 'jetpack-mu-wpcom' ),
			value: earnings?.lastMonth,
		},
		{
			label: _x(
				'Next month',
				'Forecast for the subscriptions due in the next 30 days',
				'jetpack-mu-wpcom'
			),
			value: earnings?.forecast,
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Text variant="heading-md" render={ <h2 /> }>
					{ __( 'Earnings', 'jetpack-mu-wpcom' ) }
				</Text>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<div className="wpcom-earn-home__figures">
						{ figures.map( ( { label, value } ) => (
							<Stack key={ label } direction="column" gap="xs">
								<Text variant="body-sm">{ label }</Text>
								{ isLoading || ! earnings ? (
									<Skeleton className="wpcom-earn-home__figure-placeholder" />
								) : (
									<Text variant="heading-lg">
										{ formatCurrency( value ?? 0, earnings.currency ) }
									</Text>
								) }
							</Stack>
						) ) }
					</div>
					{ earnings && earnings.commission !== null && (
						<CommissionFees commission={ earnings.commission } />
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
