import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { IdentityCrisisLayoutProps } from './types';
import type { ReactNode } from 'react';

/**
 * Logo, "Safe Mode" label, content and the host's actions. The host supplies any frame around it.
 *
 * @param {IdentityCrisisLayoutProps} props - Component props.
 * @return {ReactNode} The layout.
 */
export default function IdentityCrisisLayout( {
	logoUrl,
	children,
	hostActions,
}: IdentityCrisisLayoutProps ): ReactNode {
	// Decorative: the label next to it names the screen.
	const logo = logoUrl ? (
		<img src={ logoUrl } alt="" className={ styles.logo } />
	) : (
		<JetpackLogo height={ 24 } />
	);

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" gap="sm" align="center">
				{ logo }
				<Text variant="heading-md">{ __( 'Safe Mode', 'jetpack-connection-js' ) }</Text>
			</Stack>
			{ children }
			{ hostActions && (
				<Stack direction="row" gap="sm" wrap="wrap" className={ styles[ 'host-actions' ] }>
					{ hostActions }
				</Stack>
			) }
		</Stack>
	);
}
