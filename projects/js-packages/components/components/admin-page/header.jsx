/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import JetpackLogo from '../jetpack-logo';
import Row from '../layout/row';
import Container from '../layout/container';
import Grid from '../layout/grid';

/**
 * Header for the AdminPage component
 *
 * @returns {React.Component} AdminPage component.
 */
const AdminPageHeader = () => (
	<div className={ styles[ 'jp-admin-page-section' ] }>
		<Container>
			<Row>
				<Grid lg={ 12 } md={ 8 } sm={ 4 }>
					<JetpackLogo />
				</Grid>
			</Row>
		</Container>
	</div>
);

export default AdminPageHeader;
