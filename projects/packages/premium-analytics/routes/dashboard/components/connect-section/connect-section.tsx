/**
 * External dependencies
 */
import { Button, Icon, Stack, Text } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import styles from './connect-section.module.scss';

/**
 * The prompt that replaces a section needing the connection, on a disconnected site. It opens the
 * plan choice on `/connect`.
 *
 * @return The prompt.
 */
export function ConnectSection() {
	const navigate = useNavigate();
	const openConnect = useCallback( () => {
		void navigate( { to: '/connect' } as unknown as never );
	}, [ navigate ] );

	return (
		<Stack direction="column" align="start" gap="lg" className={ styles.root }>
			<Icon icon={ jetpack } size={ 32 } />
			<Stack direction="column" gap="sm">
				<Text variant="heading-xl" render={ <h3 /> }>
					{ __( 'Connect Jetpack to see these stats', 'jetpack-premium-analytics-pkg' ) }
				</Text>
				<Text variant="body-lg" className={ styles.description }>
					{ __(
						'These stats need a Jetpack connection to load.',
						'jetpack-premium-analytics-pkg'
					) }
				</Text>
			</Stack>
			<Button onClick={ openConnect }>
				{ __( 'Connect Jetpack', 'jetpack-premium-analytics-pkg' ) }
			</Button>
		</Stack>
	);
}
