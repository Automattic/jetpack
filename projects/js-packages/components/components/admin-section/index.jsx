/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} JetpackAdminSection component.
 */
const JetpackAdminSection = props => {
	const { children, bgColor } = props;
	const mainClassName = classnames( 'jp-admin-section', {
		'jp-admin-section--bg-grey': bgColor === 'grey',
	} );
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
	bgColor: 'white',
};

JetpackAdminSection.propTypes = {
	/** The background color of the section */
	bgColor: PropTypes.oneOf( [ 'white', 'grey' ] ),
};

export default JetpackAdminSection;
