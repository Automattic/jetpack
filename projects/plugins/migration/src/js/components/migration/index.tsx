import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreenLayout, useConnection } from '@automattic/jetpack-connection';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { MIGRATION_HANDLER_ROUTE } from '../constants';
import { WordPressLogo, ExternalLink } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import type React from 'react';
import './styles.module.scss';

export * from './error';
export * from './loading';
export * from './progress';

export const ToS = createInterpolateElement(
	__(
		'By clicking "Get started", you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
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
			title={ __( 'Move to WordPress.com', 'wpcom-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p>
				{ __(
					'Whether the result of poor performance, lack of support or limited bandwidth, ' +
						"migrating your site to WordPress.com shouldn't be hard. That's our job! " +
						'Migrate your site now and get managed by experienced, dedicated and specailists on ' +
						'WordPress professionals.',
					'wpcom-migration'
				) }
			</p>
			<ul>
				<li className={ 'bullet-1' }>
					{ __(
						'No need to worry about budget - this is a free migration service offically provided by WordPress.com.',
						'wpcom-migration'
					) }
				</li>
				<li className={ 'bullet-2' }>
					{ __(
						'This is seamless and automated process. It takes one click to back-up and migrate your entire site to WordPress.com',
						'wpcom-migration'
					) }
				</li>
				<li className={ 'bullet-3' }>
					{ __( 'Move to WordPress.com provides low to zero downtime.', 'wpcom-migration' ) }
				</li>
			</ul>
			<div className={ 'action-buttons' }>
				<div className={ 'tos' }>{ ToS }</div>
				<Button
					isPrimary={ true }
					isBusy={ buttonIsLoading }
					disabled={ buttonIsLoading }
					href={ `${ MIGRATION_HANDLER_ROUTE }?from=${ sourceSiteSlug }` }
					onClick={ onGetStartedClick }
				>
					{ __( 'Get started', 'wpcom-migration' ) }
				</Button>
				<Button
					isSecondary={ true }
					target={ '_blank' }
					href={ getRedirectUrl(
						'https://wordpress.com/support/import/import-an-entire-wordpress-site/'
					) }
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
							<Button
								href={ getRedirectUrl( 'https://wordpress.com/support/help-support-options/' ) }
								target={ '_blank' }
							/>
						),
					}
				) }
			</p>
		</ConnectScreenLayout>
	);
}
