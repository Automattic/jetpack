import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Spinner, Stack, Text } from '@wordpress/ui';
import { errorMessage, fetchUsage } from '../../data/api';
import type { Usage } from '../../data/types';

/**
 * A reset date in the viewer's locale.
 *
 * @param value - An API date or datetime.
 * @return The formatted date, or the raw value when it can't be parsed.
 */
function formatResetDate( value: string ): string {
	// A date-only string would parse as UTC midnight and show the previous day west of UTC.
	const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec( value );
	const date = dateOnly
		? new Date( Number( dateOnly[ 1 ] ), Number( dateOnly[ 2 ] ) - 1, Number( dateOnly[ 3 ] ) )
		: new Date( value );
	return isNaN( date.getTime() ) ? value : date.toLocaleDateString();
}

const UsageCard = () => {
	const [ usage, setUsage ] = useState< Usage | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		let cancelled = false;
		fetchUsage()
			.then( result => ! cancelled && setUsage( result ) )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [] );

	let body = <Spinner />;
	if ( error ) {
		body = (
			<Text variant="body-md" render={ <p /> }>
				{ error }
			</Text>
		);
	} else if ( usage ) {
		const sent = usage.total_usage.toLocaleString();
		const hasLimit = usage.monthly_limit > 0;
		body = (
			<Stack direction="column" gap="sm">
				<Text variant="body-md" render={ <p /> }>
					{ hasLimit
						? sprintf(
								/* translators: 1: emails sent, 2: monthly limit. */
								__( '%1$s of %2$s emails this period', 'jetpack-send-pkg' ),
								sent,
								usage.monthly_limit.toLocaleString()
							)
						: sprintf(
								/* translators: %s: emails sent. */
								__( '%s emails this period · No limit set', 'jetpack-send-pkg' ),
								sent
							) }
				</Text>
				{ hasLimit && (
					<div className="jetpack-send-usage__bar">
						<div
							className="jetpack-send-usage__fill"
							style={ {
								inlineSize: `${ Math.min( 100, ( usage.total_usage / usage.monthly_limit ) * 100 ) }%`,
							} }
						/>
					</div>
				) }
				{ usage.period_end && (
					<Text variant="body-sm" render={ <p /> }>
						{ sprintf(
							/* translators: %s: date. */
							__( 'Resets %s', 'jetpack-send-pkg' ),
							formatResetDate( usage.period_end )
						) }
					</Text>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Usage', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ body }</Card.Content>
		</Card.Root>
	);
};

export default UsageCard;
