/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} JetpackFooter component.
 */
const JetpackFooter = props => {
	const { a8cLogoHref, moduleName, className, ...otherProps } = props;
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
};

JetpackFooter.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
	className: '',
};

JetpackFooter.propTypes = {
	/** Link for 'An Automattic Airline'. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search'. */
	moduleName: PropTypes.string,
	/** additional className of the wrapper, `jp-dashboard-footer` always included. */
	className: PropTypes.string,
};

export default JetpackFooter;
