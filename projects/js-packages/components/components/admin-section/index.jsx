/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * asd
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} JetpackAdminSection component.
 */
const JetpackAdminSection = props => {
	const { children, jpHero, padding } = props;
	let mainClassName = 'jp-admin-section';
	if ( jpHero ) {
		mainClassName += ' jp-hero';
	}
	if ( padding === 'header' || padding === 'footer' ) {
		mainClassName += ' jp-admin-section--padding-small';
	}
	return (
		<div className={ mainClassName }>
			<div className="jp-wrap">
				<div class="jp-row">
					<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">{ children }</div>
				</div>
			</div>
		</div>
	);
};

JetpackAdminSection.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
	className: '',
};

JetpackAdminSection.propTypes = {
	/** Link for 'An Automattic Airline'. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search'. */
	moduleName: PropTypes.string,
	/** additional className of the wrapper, `jp-dashboard-footer` always included. */
	className: PropTypes.string,
};

export default JetpackAdminSection;
