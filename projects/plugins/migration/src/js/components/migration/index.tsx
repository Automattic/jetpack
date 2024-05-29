import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreenLayout, useConnection } from '@automattic/jetpack-connection';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { WordPressLogo, ExternalLink } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import type React from 'react';
import './styles.module.scss';

export * from './error';
export * from './loading';
export * from './progress';

export const ToS = createInterpolateElement(
	__(
		'By clicking "Get started", you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site‘s data</shareDetailsLink> with us.',
		'wpcom-migration'
	),
	{
		tosLink: <a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />,
		shareDetailsLink: (
			<a
				href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
				rel="noopener noreferrer"
				target="_blank"
			/>
		),
	}
);

interface Props {
	apiRoot: string;
	apiNonce: string;
	registrationNonce: string;
	sourceSiteSlug: string;
}
/**
 * Migration screen - Get start migration
 *
 * @param {object} props - Props
 * @returns {React.ReactElement} - JSX Element
 */
export function Migration( props: Props ) {
	const pluginName = 'wpcom-migration';
	const { apiRoot, apiNonce, registrationNonce, sourceSiteSlug } = props;
	const redirectUri = 'admin.php?page=wpcom-migration';
	const autoTrigger = false;
	const skipUserConnection = false;

	const {
		handleRegisterSite,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
		isRegistered,
		isUserConnected,
	} = useConnection( {
		registrationNonce,
		redirectUri,
		apiRoot,
		apiNonce,
		autoTrigger,
		from: pluginName,
		skipUserConnection,
	} );

	const buttonIsLoading = siteIsRegistering || userIsConnecting;
	const isFullyConnected = isRegistered && isUserConnected;
	const { tracks } = useAnalytics();

	const onGetStartedClick = useCallback(
		( e: Event ) => {
			tracks.recordEvent( `jetpack_migration_get_started_click`, {
				source_site_slug: sourceSiteSlug,
			} );
			// If it's fully connected, href attribute is the final destination
			if ( ! isFullyConnected ) {
				handleRegisterSite( e );
			}
		},
		[ isFullyConnected, handleRegisterSite, tracks, sourceSiteSlug ]
	);

	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( "Let's start moving your site over", 'wpcom-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p>
				{ __(
					"You're a few steps away from upgrading your site to the speed and power of WordPress.com. " +
						"Here's how it works: ",
					'wpcom-migration'
				) }
			</p>
			<ol className={ 'migration-listing' }>
				<li>{ __( 'Click Get started.', 'wpcom-migration' ) }</li>
				<li>
					{ __(
						"Choose what you'd like to move over from your old site - whether that's just the basics, or all of your content, plugins, and settings.",
						'wpcom-migration'
					) }
				</li>
				<li>
					{ __(
						"Sit back, and let the plugin do the work. We'll email you when your migration's ready.",
						'wpcom-migration'
					) }
				</li>
				<li>{ __( 'Welcome to WordPress.com!', 'wpcom-migration' ) }</li>
			</ol>
			<div className={ 'action-buttons' }>
				<div className={ 'tos' }>{ ToS }</div>
				<Button
					isPrimary={ true }
					isBusy={ buttonIsLoading }
					disabled={ buttonIsLoading }
					href={ getRedirectUrl( 'wpcom-migration-handler-route', {
						query: `from=${ sourceSiteSlug }`,
					} ) }
					onClick={ onGetStartedClick }
				>
					{ __( 'Get started', 'wpcom-migration' ) }
				</Button>
				<Button
					isSecondary={ true }
					target={ '_blank' }
					href={ getRedirectUrl( 'wpcom-migration-doc-link' ) }
				>
					{ createInterpolateElement( __( 'Learn more <ExternalLink />', 'wpcom-migration' ), {
						ExternalLink: <ExternalLink size={ 20 } />,
					} ) }
				</Button>
				{ registrationError && (
					<Notice status="warning" isDismissible={ false }>
						{ __( 'An error occurred. Please try again.', 'wpcom-migration' ) }
					</Notice>
				) }
			</div>
			<p className={ 'get-started-help' }>
				{ createInterpolateElement(
					__( 'Do you need help? <Button>Contact us.</Button>', 'wpcom-migration' ),
					{
						Button: (
							<Button href={ getRedirectUrl( 'wpcom-migration-contact-us' ) } target={ '_blank' } />
						),
					}
				) }
			</p>
		</ConnectScreenLayout>
	);
}
