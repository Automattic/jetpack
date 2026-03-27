import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { getRedirectUrl } from '../../index.ts';
import getSiteAdminUrl from '../../tools/get-site-admin-url/index.ts';
import AutomatticBylineLogo from '../automattic-byline-logo/index.tsx';
import './style.scss';
import JetpackLogo from '../jetpack-logo/index.tsx';
import type { JetpackFooterProps, JetpackFooterMenuItem } from './types.ts';
import type { FC, ReactNode } from 'react';
import '@wordpress/admin-ui/build-style/style.css';

const ExternalIcon: FC = () => (
	<>
		{ ' ' }
		<span aria-hidden="true">↗</span>
		<span className="jetpack-footer__accessible-external-link">
			{
				/* translators: accessibility text */
				__( '(opens in a new tab)', 'jetpack-components' )
			}
		</span>
	</>
);

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {JetpackFooterProps} props - Component properties.
 * @return {ReactNode} JetpackFooter component.
 */
const JetpackFooter: FC< JetpackFooterProps > = ( { className, menu, ...otherProps } ) => {
	const siteAdminUrl = getSiteAdminUrl();

	let items: JetpackFooterMenuItem[] = [];

	if ( isWpcomPlatformSite() ) {
		items = [
			{
				label: __( 'Products', 'jetpack-components' ),
				title: __( 'Jetpack products', 'jetpack-components' ),
				href: new URL( 'admin.php?page=my-jetpack#/products', siteAdminUrl ).href,
			},
			{
				label: __( 'Help', 'jetpack-components' ),
				title: '',
				href: new URL( 'admin.php?page=my-jetpack#/help', siteAdminUrl ).href,
			},
			...items,
		];
	}

	if ( menu ) {
		items = [ ...items, ...menu ];
	}

	return (
		<HStack
			as="footer"
			className={ clsx( 'jetpack-footer', className ) }
			aria-label={ __( 'Jetpack', 'jetpack-components' ) }
			role="contentinfo"
			justify="start"
			direction="row"
			{ ...otherProps }
		>
			<HStack className="jetpack-footer-footer__logo">
				<JetpackLogo logoColor="#000" showText={ false } height={ 16 } aria-hidden="true" />
				Jetpack
			</HStack>
			<HStack as="ul" direction="row" spacing={ 2 }>
				{ items.map( item => {
					const isButton = item.role === 'button';
					const isExternalLink = ! isButton && item.target === '_blank';

					return (
						<li key={ item.label }>
							<Text
								as={ isButton ? 'span' : 'a' }
								href={ item.href || '' }
								title={ item.title || '' }
								target={ item.target || '' }
								onClick={ item.onClick || undefined }
								onKeyDown={ item.onKeyDown || undefined }
								className={ clsx( 'jetpack-footer__menu-item', {
									'is-external': isExternalLink,
								} ) }
								role={ item.role }
								rel={ isExternalLink ? 'noopener noreferrer' : undefined }
								tabIndex={ isButton ? 0 : undefined }
								variant="muted"
							>
								{ item.label }
							</Text>
							{ isExternalLink && <ExternalIcon /> }
						</li>
					);
				} ) }
			</HStack>
			<a
				aria-label={ __( 'An Automattic Airline', 'jetpack-components' ) }
				className="jetpack-footer__a8c"
				href={ getRedirectUrl( 'a8c-about' ) }
				rel="noopener noreferrer"
				target="_blank"
			>
				<AutomatticBylineLogo aria-hidden="true" />
			</a>
		</HStack>
	);
};

export default JetpackFooter;
