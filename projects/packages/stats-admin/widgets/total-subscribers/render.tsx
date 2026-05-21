import { formatNumber } from '@automattic/number-formatters';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import SubscriberTrendBackground from './components/subscriber-trend-background';
import { useSubscriberCount } from './hooks/use-subscriber-count';
import styles from './style.module.css';
import type { CSSProperties } from 'react';

const queryClient = new QueryClient();

/**
 * Widget body: one large subscriber total.
 *
 * @return Widget content.
 */
function TotalSubscribersContent(): JSX.Element {
	const { data, isLoading, isError, error } = useSubscriberCount();
	const formattedCount =
		data === null || data === undefined ? null : formatNumber( Math.max( 0, data ) );
	const displayText = isLoading ? '—' : formattedCount ?? '0';
	const counterChars = Math.max( displayText.length, 1 );

	return (
		<Card.FullBleed className={ styles.container }>
			<SubscriberTrendBackground />
			<Stack className={ styles.stack } direction="column" align="center" justify="center">
				{ isError ? (
					<Text variant="body" className={ styles.error }>
						{ error instanceof Error
							? error.message
							: __( 'Unable to load subscriber count.', 'jetpack-stats-admin' ) }
					</Text>
				) : (
					<Text
						className={ clsx( styles.counter, {
							[ styles.counterLoading ]: isLoading,
						} ) }
						style={
							{
								'--counter-chars': counterChars,
							} as CSSProperties
						}
						aria-busy={ isLoading }
						aria-live="polite"
						aria-label={
							isLoading
								? __( 'Loading subscriber count…', 'jetpack-stats-admin' )
								: __( 'Subscriber count', 'jetpack-stats-admin' )
						}
					>
						{ ! isLoading && formattedCount }
					</Text>
				) }
			</Stack>
		</Card.FullBleed>
	);
}

/**
 * Newsletter subscribers dashboard widget.
 *
 * @return Widget root with query client.
 */
export default function TotalSubscribersWidget(): JSX.Element {
	return (
		<QueryClientProvider client={ queryClient }>
			<TotalSubscribersContent />
		</QueryClientProvider>
	);
}
