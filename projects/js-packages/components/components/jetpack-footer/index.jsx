/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import A8cSvgTitle from '../a8c-svg-title';
import './style.scss';

/**
 * JetpackFooter component definition.
 *
 * @param {object} props - Component properties.
 * @param {object} props.aboutPageUrl - URL for 'An Automattic Airline'.
 * @param {object} props.moduelName - Name of the moduel, e.g. 'Jetpack Search'.
 * @param {object} props.className - default: jp-dashboard-footer.
 *
 * @returns {React.Component} JetpackFooter component.
 */
export default function JetpackFooter( {
	aboutPageUrl,
	moduelName = 'Jetpack',
	className = 'jp-dashboard-footer',
	...otherProps
} ) {
	return (
		<div className={ className } { ...otherProps }>
			<div className="jp-dashboard-footer__footer-left">
				<span className="jp-dashboard-footer__logo"></span>
				<span>{ moduelName }</span>
			</div>
			<div className="jp-dashboard-footer__footer-right">
				<A8cSvgTitle href={ aboutPageUrl } title={ __( 'An Automattic Airline', 'jetpack' ) } />
			</div>
		</div>
	);
}
