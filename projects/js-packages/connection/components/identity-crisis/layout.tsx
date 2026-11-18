import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useId } from 'react';
import styles from './styles.module.scss';
import type { IdentityCrisisLayoutProps } from './types';
import type { ReactNode } from 'react';

/**
 * Logo and heading, content and the host's actions. The host supplies any frame around it.
 *
 * @param {IdentityCrisisLayoutProps} props - Component props.
 * @return {ReactNode} The layout.
 */
export default function IdentityCrisisLayout( {
	logoUrl,
	showHeader = true,
	children,
	hostActions,
}: IdentityCrisisLayoutProps ): ReactNode {
	const headingId = useId();
	// Decorative: the heading next to it names the screen.
	const logo = logoUrl ? (
		<img src={ logoUrl } alt="" className={ styles.logo } />
	) : (
		<JetpackLogo height={ 24 } />
	);

	return (
		<section
			{ ...( showHeader
				? { 'aria-labelledby': headingId }
				: { 'aria-label': __( 'Jetpack Connection Safe Mode', 'jetpack-connection-js' ) } ) }
		>
			<Stack direction="column" gap="lg">
				{ showHeader && (
					<Stack direction="row" gap="sm" align="center">
						{ logo }
						<Text variant="heading-lg" render={ <h2 id={ headingId } /> }>
							{ __( 'Jetpack Connection is in Safe Mode', 'jetpack-connection-js' ) }
						</Text>
					</Stack>
				) }
				{ children }
				{ hostActions && (
					<Stack direction="row" gap="sm" wrap="wrap" className={ styles[ 'host-actions' ] }>
						{ hostActions }
					</Stack>
				) }
			</Stack>
		</section>
	);
}
