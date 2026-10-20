import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Card, Meter, Skeleton, Stack, Text } from '@wordpress/ui';
import { errorMessage, fetchUsage } from '../../data/api';
import { dayLabel, formatCount } from '../../data/dates';
import { useLogVersion } from '../../data/store';
import type { Usage } from '../../data/types';

/**
 * Placeholders in the card's final shape: the count, the meter when there's a limit, the reset date.
 *
 * @param props          - Component props.
 * @param props.hasLimit - Whether a meter will show.
 * @return The skeleton.
 */
const UsageSkeleton = ( { hasLimit }: { hasLimit: boolean } ) => (
	<Stack direction="column" gap="sm" aria-hidden="true">
		<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--count" />
		{ hasLimit && <Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--meter" /> }
		<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--body-md" />
	</Stack>
);

/**
 * The muted line under the count: the limit, if there's none, and when the count starts again.
 *
 * @param usage   - This month's usage.
 * @param limited - The plan has a monthly limit.
 * @return The line.
 */
function resetLine( usage: Usage, limited: boolean ): string {
	const resets = dayLabel( usage.resets_on );
	const when = resets
		? sprintf(
				/* translators: %s: a date, like "Nov 1". */
				__( 'Resets %s', 'jetpack-send-pkg' ),
				resets
			)
		: '';
	if ( limited ) {
		return when;
	}
	return when
		? sprintf(
				/* translators: %s: "Resets Nov 1". */
				__( 'No monthly limit · %s', 'jetpack-send-pkg' ),
				when
			)
		: __( 'No monthly limit', 'jetpack-send-pkg' );
}

type Props = {
	/** Whether the account has a monthly limit, so the loading placeholder matches. */
	hasLimit?: boolean;
};

/**
 * "This month": every email handed to the mail service this month, tests included (they use the
 * plan's sends too), counted from the log; the limit meter when the plan has one.
 *
 * @param props          - Component props.
 * @param props.hasLimit - Whether the account has a monthly limit.
 * @return The card.
 */
const UsageCard = ( { hasLimit = false }: Props ) => {
	const logVersion = useLogVersion();
	const [ usage, setUsage ] = useState< Usage | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		let cancelled = false;
		fetchUsage()
			.then( result => {
				if ( ! cancelled ) {
					setUsage( result );
					setError( null );
				}
			} )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [ logVersion ] );

	let body = <UsageSkeleton hasLimit={ hasLimit } />;
	if ( error ) {
		body = (
			<Text variant="body-lg" render={ <p /> } className="jetpack-send-card__text">
				{ error }
			</Text>
		);
	} else if ( usage ) {
		const count = usage.emails ?? 0;
		const tests = usage.tests ?? 0;
		const limited = usage.monthly_limit > 0;
		const reset = resetLine( usage, limited );
		body = (
			<Stack direction="column" gap="sm">
				<Stack direction="column" gap="xs">
					<Text variant="body-lg" render={ <p /> } className="jetpack-send-card__text">
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: number of emails, shown large. */
								_n(
									'<count>%s</count> email',
									'<count>%s</count> emails',
									count,
									'jetpack-send-pkg'
								),
								formatCount( count )
							),
							{ count: <Text variant="heading-2xl" className="jetpack-send-usage__count" /> }
						) }
					</Text>
					{ tests > 0 && (
						<Text
							variant="body-md"
							render={ <p /> }
							className="jetpack-send-card__text jetpack-send-muted"
						>
							{ sprintf(
								/* translators: %s: number of test emails. */
								_n( 'including %s test', 'including %s tests', tests, 'jetpack-send-pkg' ),
								formatCount( tests )
							) }
						</Text>
					) }
				</Stack>
				{ limited && (
					<Meter.Root
						className="jetpack-send-usage"
						value={ Math.min( count, usage.monthly_limit ) }
						min={ 0 }
						max={ usage.monthly_limit }
					>
						<Meter.Label>
							<Text variant="body-md" className="jetpack-send-muted">
								{ sprintf(
									/* translators: 1: emails this month, 2: monthly limit. */
									_n(
										'%1$s of %2$s email',
										'%1$s of %2$s emails',
										usage.monthly_limit,
										'jetpack-send-pkg'
									),
									formatCount( count ),
									formatCount( usage.monthly_limit )
								) }
							</Text>
						</Meter.Label>
						<Meter.Track>
							<Meter.Indicator tone="brand" />
						</Meter.Track>
					</Meter.Root>
				) }
				{ reset && (
					<Text
						variant="body-md"
						render={ <p /> }
						className="jetpack-send-card__text jetpack-send-muted"
					>
						{ reset }
					</Text>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" align="center" className="jetpack-send-card__heading">
					<Card.Title render={ <h2 /> }>{ __( 'This month', 'jetpack-send-pkg' ) }</Card.Title>
				</Stack>
			</Card.Header>
			<Card.Content>{ body }</Card.Content>
		</Card.Root>
	);
};

export default UsageCard;
