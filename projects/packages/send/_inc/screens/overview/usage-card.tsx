import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Spinner, Stack, Text } from '@wordpress/ui';
import { errorMessage, fetchUsage } from '../../data/api';
import type { Usage } from '../../data/types';

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
							new Date( usage.period_end ).toLocaleDateString()
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
