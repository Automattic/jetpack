/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSectionHero component.
 */
const AdminSectionHero = props => {
	const { children } = props;
	return (
		<div className="jp-admin-section-hero">
			<div className="jp-wrap">{ children }</div>
		</div>
	);
};

export default AdminSectionHero;
