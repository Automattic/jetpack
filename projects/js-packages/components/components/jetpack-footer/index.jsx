/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';

/**
 * JetpackFooter component definition.
 *
 * @param {object} props - Component properties.
 * @param {object} props.a8cLogoHref - Link for 'An Automattic Airline'.
 * @param {object} props.moduleName - Name of the module, e.g. 'Jetpack Search'.
 * @param {object} props.className - additional className of the wrapper, default only: `jp-dashboard-footer`.
 * @returns {React.Component} JetpackFooter component.
 */
export default function JetpackFooter( {
	a8cLogoHref = 'https://jetpack.com',
	moduleName = __( 'Jetpack', 'jetpack' ),
	className = '',
	...otherProps
} ) {
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
				<span className="jp-dashboard-footer__module-name">{ moduleName }</span>
			</div>
			<div className="jp-dashboard-footer__footer-right">
				<a href={ a8cLogoHref } aria-label={ __( 'An Automattic Airline', 'jetpack' ) }>
					<AutomatticBylineLogo />
				</a>
			</div>
		</div>
	);
}
