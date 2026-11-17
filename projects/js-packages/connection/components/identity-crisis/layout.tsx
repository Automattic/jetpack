import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { renderCustomContent } from './custom-content';
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
	logo,
	customContent = {},
	children,
	hostActions,
}: IdentityCrisisLayoutProps ): ReactNode {
	let logoElement: ReactNode = logo;
	if ( typeof logo === 'string' ) {
		logoElement = (
			<img src={ logo } alt={ customContent.logoAlt || '' } className={ styles.logo } />
		);
	} else if ( ! logo ) {
		logoElement = <JetpackLogo height={ 24 } />;
	}

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" gap="sm" align="center">
				{ logoElement }
				<Text variant="heading-md">
					{ renderCustomContent(
						customContent.headerText,
						__( 'Safe Mode', 'jetpack-connection-js' ),
						customContent
					) }
				</Text>
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
