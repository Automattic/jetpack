import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { SpinningCounter } from './components/spinning-counter';
import { useSubscriberCount } from './hooks/use-subscriber-count';
import styles from './style.module.css';

const queryClient = new QueryClient();

/**
 * Widget body: one large subscriber total with a spinning counter on load.
 *
 * @return Widget content.
 */
function TotalSubscribersContent(): JSX.Element {
	const { data, isLoading, isError, error } = useSubscriberCount();

	return (
		<Stack
			direction="column"
			align="center"
			justify="center"
			gap="md"
			style={ {
				blockSize: '100%',
				padding: 'var(--wpds-dimension-padding-2xl)',
				textAlign: 'center',
			} }
		>
			<Text variant="body" className={ styles.label }>
				{ __( 'Newsletter subscribers', 'jetpack-stats-admin' ) }
			</Text>
			{ isError ? (
				<Text variant="body" className={ styles.error }>
					{ error instanceof Error
						? error.message
						: __( 'Unable to load subscriber count.', 'jetpack-stats-admin' ) }
				</Text>
			) : (
				<SpinningCounter value={ data ?? null } isLoading={ isLoading } />
			) }
		</Stack>
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
