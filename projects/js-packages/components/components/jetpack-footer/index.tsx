import { isWpcomPlatformSite, getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Stack, Text, Link } from '@wordpress/ui';
import clsx from 'clsx';
import { getRedirectUrl } from '../../index.ts';
import AutomatticBylineLogo from '../automattic-byline-logo/index.tsx';
import './style.scss';
import JetpackLogo from '../jetpack-logo/index.tsx';
import type { JetpackFooterProps, JetpackFooterMenuItem } from './types.ts';
import type { FC } from 'react';

declare global {
	interface Window {
		JetpackNetworkAdminData?: {
			sitesUrl: string;
			settingsUrl: string;
		};
	}
}

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {JetpackFooterProps} props - Component properties.
 * @return {ReactNode} JetpackFooter component.
 */
const JetpackFooter: FC< JetpackFooterProps > = ( { className, menu, ...otherProps } ) => {
	let items: JetpackFooterMenuItem[] = [];

	if ( ! isWpcomPlatformSite() && ! window?.JetpackNetworkAdminData ) {
		items = [
			{
				label: __( 'Products', 'jetpack-components' ),
				href: getAdminUrl( 'admin.php?page=my-jetpack#/products' ),
			},
			{
				label: __( 'Help', 'jetpack-components' ),
				href: getAdminUrl( 'admin.php?page=my-jetpack#/help' ),
			},
			...items,
		];
	}

	if ( menu ) {
		items = [ ...items, ...menu ];
	}

	return (
		<Stack
			render={ <footer /> }
			className={ clsx( 'jetpack-footer', className ) }
			aria-label={ __( 'Jetpack', 'jetpack-components' ) }
			role="contentinfo"
			direction="row"
			justify="flex-start"
			align="center"
			wrap="wrap"
			gap="xl"
			{ ...otherProps }
		>
			<Stack className="jetpack-footer__logo" direction="row" gap="sm" align="center">
				<JetpackLogo showText={ false } height={ 16 } aria-hidden="true" />
				<Text variant="body-md">Jetpack</Text>
			</Stack>
			<Stack render={ <ul /> } direction="row" gap="lg" wrap="wrap">
				{ items.map( item => {
					return (
						<li key={ item.label }>
							<Text
								variant="body-md"
								className="jetpack-footer__menu-item"
								render={
									! item.href ? (
										<Link
											render={ <span /> }
											tabIndex={ 0 }
											title={ item.title || '' }
											onClick={ item.onClick || undefined }
											onKeyDown={ item.onKeyDown || undefined }
											role="button"
										/>
									) : (
										<Link
											href={ item.href }
											title={ item.title || '' }
											onClick={ item.onClick || undefined }
											onKeyDown={ item.onKeyDown || undefined }
										/>
									)
								}
							>
								{ item.label }
							</Text>
						</li>
					);
				} ) }
			</Stack>
			<a
				className="jetpack-footer__a8c"
				href={ getRedirectUrl( 'a8c-about' ) }
				rel="noopener noreferrer"
				target="_blank"
			>
				<AutomatticBylineLogo height={ 8 } />
			</a>
		</Stack>
	);
};

export default JetpackFooter;
