import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
import { getRedirectUrl } from '../..';
import { STORE_ID as CONNECTION_STORE_ID } from '../../../../js-packages/connection/state/store';
import getSiteAdminUrl from '../../tools/get-site-admin-url';
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import type { JetpackFooterProps, JetpackFooterMenuItem } from './types';

const JetpackIcon: React.FC = () => (
	<JetpackLogo logoColor="#000" showText={ false } height={ 16 } aria-hidden="true" />
);

const ExternalIcon: React.FC = () => (
	<>
		<Icon icon={ external } size={ 16 } />
		<span className="jp-dashboard-footer__accessible-external-link">
			{
				/* translators: accessibility text */
				__( '(opens in a new tab)', 'jetpack' )
			}
		</span>
	</>
);

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {JetpackFooterProps} props - Component properties.
 * @returns {React.ReactNode} JetpackFooter component.
 */
const JetpackFooter: React.FC< JetpackFooterProps > = ( {
	moduleName = __( 'Jetpack', 'jetpack' ),
	className,
	moduleNameHref = 'https://jetpack.com',
	menu,
	onAboutClick,
	onPrivacyClick,
	onTermsClick,
	...otherProps
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm', '<=' );
	const [ isMd ] = useBreakpointMatch( 'md', '<=' );
	const [ isLg ] = useBreakpointMatch( 'lg', '>' );

	const { isActive, connectedPlugins } = useSelect(
		select => {
			const connectionStatus = select( CONNECTION_STORE_ID ) as {
				getConnectedPlugins: () => { slug: string }[];
				getConnectionStatus: () => { isActive: boolean };
			};

			return {
				connectedPlugins: connectionStatus?.getConnectedPlugins(),
				...connectionStatus.getConnectionStatus(),
			};
		},
		[ CONNECTION_STORE_ID ]
	);
	const siteAdminUrl = getSiteAdminUrl();
	const areAdminLinksEnabled =
		siteAdminUrl &&
		// Some admin pages require the site to be connected (e.g., Privacy)
		isActive &&
		// Admin pages are part of the Jetpack plugin and required it to be installed
		connectedPlugins?.some( ( { slug } ) => 'jetpack' === slug );

	let items: JetpackFooterMenuItem[] = [
		{
			label: _x( 'About', 'Link to learn more about Jetpack.', 'jetpack' ),
			title: __( 'About Jetpack', 'jetpack' ),
			href: areAdminLinksEnabled
				? new URL( 'admin.php?page=jetpack_about', siteAdminUrl ).href
				: getRedirectUrl( 'jetpack-about' ),
			target: areAdminLinksEnabled ? '_self' : '_blank',
			onClick: onAboutClick,
		},
		{
			label: _x( 'Privacy', 'Shorthand for Privacy Policy.', 'jetpack' ),
			title: __( "Automattic's Privacy Policy", 'jetpack' ),
			href: areAdminLinksEnabled
				? new URL( 'admin.php?page=jetpack#/privacy', siteAdminUrl ).href
				: getRedirectUrl( 'a8c-privacy' ),
			target: areAdminLinksEnabled ? '_self' : '_blank',
			onClick: onPrivacyClick,
		},
		{
			label: _x( 'Terms', 'Shorthand for Terms of Service.', 'jetpack' ),
			title: __( 'WordPress.com Terms of Service', 'jetpack' ),
			href: getRedirectUrl( 'wpcom-tos' ),
			target: '_blank',
			onClick: onTermsClick,
		},
	];

	if ( menu ) {
		items = [ ...items, ...menu ];
	}

	const jetpackItemContent = (
		<>
			<JetpackIcon />
			{ moduleName }
		</>
	);

	return (
		<footer
			className={ clsx(
				'jp-dashboard-footer',
				{
					'is-sm': isSm,
					'is-md': isMd,
					'is-lg': isLg,
				},
				className
			) }
			aria-label={ __( 'Jetpack', 'jetpack' ) }
			{ ...otherProps }
		>
			<ul>
				<li className="jp-dashboard-footer__jp-item">
					{ moduleNameHref ? (
						<a href={ moduleNameHref }>{ jetpackItemContent }</a>
					) : (
						jetpackItemContent
					) }
				</li>
				{ items.map( item => {
					const isButton = item.role === 'button';
					const isExternalLink = ! isButton && item.target === '_blank';

					return (
						<li key={ item.label }>
							<a
								href={ item.href }
								title={ item.title }
								target={ item.target }
								onClick={ item.onClick }
								onKeyDown={ item.onKeyDown }
								className={ clsx( 'jp-dashboard-footer__menu-item', {
									'is-external': isExternalLink,
								} ) }
								role={ item.role }
								rel={ isExternalLink ? 'noopener noreferrer' : undefined }
								tabIndex={ isButton ? 0 : undefined }
							>
								{ item.label }
								{ isExternalLink && <ExternalIcon /> }
							</a>
						</li>
					);
				} ) }
				<li className="jp-dashboard-footer__a8c-item">
					<a
						href={
							areAdminLinksEnabled
								? new URL( 'admin.php?page=jetpack_about', siteAdminUrl ).href
								: getRedirectUrl( 'a8c-about' )
						}
						aria-label={ __( 'An Automattic Airline', 'jetpack' ) }
					>
						<AutomatticBylineLogo aria-hidden="true" />
					</a>
				</li>
			</ul>
		</footer>
	);
};

export default JetpackFooter;
