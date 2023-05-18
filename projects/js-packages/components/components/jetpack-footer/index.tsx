import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import classnames from 'classnames';
import React from 'react';
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import type { JetpackFooterProps } from './types';

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {JetpackFooterProps} props - Component properties.
 * @returns {React.ReactNode} JetpackFooter component.
 */
const JetpackFooter: React.FC< JetpackFooterProps > = ( {
	a8cLogoHref = 'https://automattic.com',
	moduleName = __( 'Jetpack', 'jetpack' ),
	className,
	moduleNameHref = 'https://jetpack.com',
	menu,
	...otherProps
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm', '<=' );
	const [ isMd ] = useBreakpointMatch( 'md', '<=' );

	return (
		<div
			className={ classnames(
				'jp-dashboard-footer',
				{
					'is-sm': isSm,
					'is-md': isMd,
				},
				className
			) }
			{ ...otherProps }
		>
			<div className="jp-dashboard-footer__logo">
				<JetpackLogo
					logoColor="#000"
					showText={ false }
					height={ 16 }
					className="jp-dashboard-footer__jetpack-symbol"
					aria-label={ __( 'Jetpack logo', 'jetpack' ) }
				/>
				<span className="jp-dashboard-footer__module-name">
					{ moduleNameHref ? (
						<a href={ moduleNameHref } aria-label={ moduleName }>
							{ moduleName }
						</a>
					) : (
						moduleName
					) }
				</span>
			</div>
			{ menu && (
				<div className="jp-dashboard-footer__menu">
					{ menu.map( item => (
						<a
							key={ item.label }
							href={ item.href }
							title={ item.title }
							target={ item.target }
							onClick={ item.onClick }
							onKeyDown={ item.onKeyDown }
							className={ classnames( 'jp-dashboard-footer__menu-item', {
								'is-external': item.target === '_blank',
							} ) }
							role={ item.role }
							rel="noopener noreferrer"
							tabIndex={ item.role === 'button' ? 0 : undefined }
						>
							{ item.label }
							{ item.target === '_blank' && (
								<Icon className="jp-dashboard-footer__menu-item__icon" icon={ external } />
							) }
						</a>
					) ) }
				</div>
			) }
			<a
				className="jp-dashboard-footer__a8c-logo"
				href={ a8cLogoHref }
				aria-label={ __( 'An Automattic Airline', 'jetpack' ) }
			>
				<AutomatticBylineLogo />
			</a>
		</div>
	);
};

export default JetpackFooter;
