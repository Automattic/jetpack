import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import CopyLogButton from '$features/page-cache/copy-log-button/copy-log-button';
import { useDebugLog } from '$features/page-cache/lib/stores';
import styles from './cache-debug-log-card.module.scss';

/**
 * The cache log on the modern dashboard.
 */
const CacheDebugLogCard = () => {
	const [ { data: debugLog } ] = useDebugLog();

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title render={ <h2 /> }>{ __( 'Cache log', 'jetpack-boost' ) }</Card.Title>
					<CopyLogButton text={ debugLog || '' } variant="secondary" />
				</Stack>
			</Card.Header>
			<Card.Content>
				{ debugLog ? (
					<pre className={ styles.log }>{ debugLog }</pre>
				) : (
					<Text variant="body-md" render={ <p /> }>
						{ __( 'Nothing has been logged yet.', 'jetpack-boost' ) }
					</Text>
				) }
			</Card.Content>
		</Card.Root>
	);
};

export default CacheDebugLogCard;
