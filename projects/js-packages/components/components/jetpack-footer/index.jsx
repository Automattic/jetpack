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

/**
 * JetpackFooter component definition.
 *
 * @param {object} props - Component properties.
 * @param {object} props.a8cLogoHref - Link for 'An Automattic Airline'.
 * @param {object} props.moduleName - Name of the module, e.g. 'Jetpack Search'.
 * @param {object} props.className - additional className of the wrapper, default only: `jp-dashboard-footer`.
 *
 * @returns {React.Component} JetpackFooter component.
 */
export default function JetpackFooter( {
	a8cLogoHref,
	moduleName = __( 'Jetpack', 'jetpack' ),
	className = '',
	...otherProps
} ) {
	return (
		<div className={ classnames( 'jp-dashboard-footer', className ) } { ...otherProps }>
			<div className="jp-dashboard-footer__footer-left">
				<span className="jp-dashboard-footer__logo"></span>
				<span>{ moduleName }</span>
			</div>
			<div className="jp-dashboard-footer__footer-right">
				<a href={ a8cLogoHref }>
					<AutomatticBylineLogo />
				</a>
			</div>
		</div>
	);
}
