import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import clsx from 'clsx';
import { getRedirectUrl } from '../../index.ts';
import getSiteAdminUrl from '../../tools/get-site-admin-url/index.ts';
import AutomatticBylineLogo from '../automattic-byline-logo/index.tsx';
import './style.scss';
import JetpackLogo from '../jetpack-logo/index.tsx';
import useBreakpointMatch from '../layout/use-breakpoint-match/index.ts';
import type { JetpackFooterProps, JetpackFooterMenuItem } from './types.ts';
import type { FC, ReactNode } from 'react';

const JetpackIcon: FC = () => (
	<JetpackLogo logoColor="#000" showText={ false } height={ 16 } aria-hidden="true" />
);

const ExternalIcon: FC = () => (
	<>
		<Icon icon={ external } size={ 16 } />
		<span className="jp-dashboard-footer__accessible-external-link">
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
	const [ isSm ] = useBreakpointMatch( 'sm', '<=' );
	const [ isMd ] = useBreakpointMatch( 'md', '<=' );
	const [ isLg ] = useBreakpointMatch( 'lg', '>' );

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
			aria-label={ __( 'Jetpack', 'jetpack-components' ) }
			role="contentinfo"
			{ ...otherProps }
		>
			<ul>
				<li className="jp-dashboard-footer__jp-item">
					<JetpackIcon />
					{ 'Jetpack' /* "Jetpack" is a product name, do not translate. */ }
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
						href={ getRedirectUrl( 'a8c-about' ) }
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ __( 'An Automattic Airline', 'jetpack-components' ) }
					>
						<AutomatticBylineLogo aria-hidden="true" />
					</a>
				</li>
			</ul>
		</footer>
	);
};

export default JetpackFooter;
