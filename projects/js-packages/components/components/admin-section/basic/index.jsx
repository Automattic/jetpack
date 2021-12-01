/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSection component.
 */
const AdminSection = props => {
	const { children } = props;
	return (
		<div className="jp-admin-section">
			<div className="jp-wrap">
				<div class="jp-row">
					<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">{ children }</div>
				</div>
			</div>
		</div>
	);
};

export default AdminSection;
