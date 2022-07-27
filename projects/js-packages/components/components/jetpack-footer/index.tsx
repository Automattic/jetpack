import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import React from 'react';
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';
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
	...otherProps
} ) => {
	return (
		<div className={ classnames( 'jp-dashboard-footer', className ) } { ...otherProps }>
			<div className="jp-dashboard-footer__footer-left">
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
			<div className="jp-dashboard-footer__footer-right">
				<a href={ a8cLogoHref } aria-label={ __( 'An Automattic Airline', 'jetpack' ) }>
					<AutomatticBylineLogo />
				</a>
			</div>
		</div>
	);
};

export default JetpackFooter;
