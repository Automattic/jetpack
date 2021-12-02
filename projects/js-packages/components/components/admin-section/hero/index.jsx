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
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSectionHero component.
 */
const AdminSectionHero = props => {
	const { children } = props;
	return (
		<div className={ styles[ 'jp-admin-section-hero' ] }>
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

export default AdminSectionHero;
