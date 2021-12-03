/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import JetpackLogo from '../jetpack-logo';

/**
 * Header for the AdminPage component
 *
 * @returns {React.Component} AdminPage component.
 */
const AdminPageHeader = () => (
	<div className="jp-admin-page-section">
		<div className="jp-wrap">
			<div class="jp-row">
				<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">
					<JetpackLogo />
				</div>
			</div>
		</div>
	</div>
);

export default AdminPageHeader;
