import { getRedirectUrl, JetpackLogo } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Icon, Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { START_INTENT, startBenefits } from '../lib';
import styles from '../styles.module.scss';

type StartStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
	// Called with the route the user took, which is recorded and then followed.
	onStart: ( intent: string ) => void;
};

/**
 * The start screen: what Jetpack does for the site, and the two ways in.
 *
 * Both routes lead into setup; they differ only in which connection intent is
 * recorded, which stage 2 turns into an account.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The screen's heading.
 * @param props.description - The line under the heading.
 * @param props.onStart     - Called with the chosen connection intent.
 * @return The rendered step.
 */
export function StartStep( { titleId, title, description, onStart }: StartStepProps ) {
	const handleCreate = useCallback( () => onStart( START_INTENT.create ), [ onStart ] );
	const handleSignIn = useCallback( () => onStart( START_INTENT.signIn ), [ onStart ] );

	return (
		<div className={ styles.start }>
			<div className={ clsx( styles.wave, styles[ 'start-logo' ] ) }>
				<JetpackLogo />
			</div>

			<div className={ clsx( styles.wave, styles[ 'start-intro' ] ) }>
				<Text
					variant="heading-2xl"
					id={ titleId }
					render={ <h1 /> }
					className={ styles[ 'start-title' ] }
				>
					{ title }
				</Text>
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'start-body' ] }>
					{ description }
				</Text>
			</div>

			<ul className={ clsx( styles.wave, styles[ 'start-benefits' ] ) }>
				{ startBenefits().map( benefit => (
					<li key={ benefit.id } className={ styles[ 'start-benefit' ] }>
						<span className={ styles[ 'start-benefit__glyph' ] } aria-hidden="true">
							<Icon icon={ benefit.icon } />
						</span>
						<Text variant="body-lg" className={ styles[ 'start-benefit__text' ] }>
							{ benefit.text }
						</Text>
					</li>
				) ) }
			</ul>

			<div className={ clsx( styles.wave, styles[ 'start-actions' ] ) }>
				{ /* Square corners from the theme's own radius scale, not a hardcoded zero. */ }
				<ThemeProvider cornerRadius="none">
					<Button
						variant="solid"
						className={ clsx( styles[ 'primary-green' ], styles[ 'start-primary' ] ) }
						onClick={ handleCreate }
					>
						{ __( 'Get started', 'jetpack-my-jetpack' ) }
					</Button>
				</ThemeProvider>

				{ /* A link in appearance only: it moves the wizard on, so it is a button. */ }
				<Button
					variant="unstyled"
					className={ styles[ 'start-secondary' ] }
					onClick={ handleSignIn }
				>
					{ __( 'I already have an account', 'jetpack-my-jetpack' ) }
				</Button>

				<Text variant="body-md" render={ <p /> } className={ styles[ 'start-terms' ] }>
					{ createInterpolateElement(
						__(
							'By continuing, you agree to our <tosLink>Terms of Service</tosLink> and to <syncLink>sync your site’s data</syncLink> with us.',
							'jetpack-my-jetpack'
						),
						{
							tosLink: <Link openInNewTab tone="neutral" href={ getRedirectUrl( 'wpcom-tos' ) } />,
							syncLink: (
								<Link
									openInNewTab
									tone="neutral"
									href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
								/>
							),
						}
					) }
				</Text>
			</div>
		</div>
	);
}
