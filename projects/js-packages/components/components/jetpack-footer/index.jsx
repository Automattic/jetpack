/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import A8cSvgTitle from '../a8c-svg-title';
import './style.scss';

/**
 * JetpackFooter component definition.
 *
 * @param {object} props - Component properties.
 * @param {object} props.aboutPageUrl - Link for 'An Automattic Airline'.
 * @param {object} props.moduelName - Name of the moduel, e.g. 'Jetpack Search'.
 * @param {object} props.className - className of the wrapper, default: `jp-dashboard-footer`.
 *
 * @returns {React.Component} JetpackFooter component.
 */
export default function JetpackFooter( {
	aboutPageUrl,
	moduelName = 'Jetpack',
	className = '',
	...otherProps
} ) {
	return (
		<div className={ classnames( 'jp-dashboard-footer', className ) } { ...otherProps }>
			<div className="jp-dashboard-footer__footer-left">
				<span className="jp-dashboard-footer__logo"></span>
				<span>{ moduelName }</span>
			</div>
			<div className="jp-dashboard-footer__footer-right">
				<a href={ aboutPageUrl }>
					<A8cSvgTitle title={ __( 'An Automattic Airline', 'jetpack' ) } />
				</a>
			</div>
		</div>
	);
}
