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
import JetpackFooter from '../jetpack-footer';
import Row from '../layout/row';
import Wrap from '../layout/wrap';
import Grid from '../layout/grid';

/**
 * Footer for the AdminPage component
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminPage component.
 */
const AdminPageFooter = props => {
	const { moduleName, a8cLogoHref } = props;

	return (
		<div className="jp-admin-page-section">
			<Wrap>
				<Row>
					<Grid lg="12" md="8" sm="4">
						<JetpackFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } />
					</Grid>
				</Row>
			</Wrap>
		</div>
	);
};

AdminPageFooter.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
};

AdminPageFooter.propTypes = {
	/** Link for 'An Automattic Airline' in the footer. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer. */
	moduleName: PropTypes.string,
};

export default AdminPageFooter;
