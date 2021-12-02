/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import JetpackLogo from '../jetpack-logo';
import Row from '../layout/row';
import Wrap from '../layout/wrap';
import Grid from '../layout/grid';

/**
 * Header for the AdminPage component
 *
 * @returns {React.Component} AdminPage component.
 */
const AdminPageHeader = () => (
	<div className="jp-admin-page-section">
		<Wrap>
			<Row>
				<Grid lg="12" md="8" sm="4">
					<JetpackLogo />
				</Grid>
			</Row>
		</Wrap>
	</div>
);

export default AdminPageHeader;
