/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import Row from '../../layout/row';
import Wrap from '../../layout/wrap';
import Grid from '../../layout/grid';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSection component.
 */
const AdminSection = props => {
	const { children } = props;
	return (
		<div className={ styles[ 'jp-admin-section' ] }>
			<Wrap>
				<Row>
					<Grid lg="12" md="8" sm="4">
						{ children }
					</Grid>
				</Row>
			</Wrap>
		</div>
	);
};

export default AdminSection;
