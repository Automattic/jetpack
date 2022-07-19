import { ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import JetpackFooter from '../jetpack-footer';
import JetpackLogo from '../jetpack-logo';
import Col from '../layout/col';
import Container from '../layout/container';
import styles from './style.module.scss';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminPage component.
 */
const AdminPage = props => {
	const {
		children,
		moduleName,
		moduleNameHref,
		a8cLogoHref,
		showHeader,
		showFooter,
		showBackground,
		header,
	} = props;
	const rootClassName = classNames( styles[ 'admin-page' ], {
		[ styles.background ]: showBackground,
	} );

	return (
		<ThemeProvider>
			<div className={ rootClassName }>
				{ showHeader && (
					<Container horizontalSpacing={ 5 }>
						<Col>{ header ? header : <JetpackLogo /> }</Col>
					</Container>
				) }
				<Container fluid horizontalSpacing={ 0 }>
					<Col>{ children }</Col>
				</Container>
				{ showFooter && (
					<Container horizontalSpacing={ 5 }>
						<Col>
							<JetpackFooter
								moduleName={ moduleName }
								a8cLogoHref={ a8cLogoHref }
								moduleNameHref={ moduleNameHref }
							/>
						</Col>
					</Container>
				) }
			</div>
		</ThemeProvider>
	);
};

AdminPage.defaultProps = {
	moduleName: __( 'Jetpack', 'jetpack' ),
	showHeader: true,
	header: null,
	showFooter: true,
	showBackground: true,
};

AdminPage.propTypes = {
	/** Link for 'An Automattic Airline' in the footer. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer. */
	moduleName: PropTypes.string,
	/** Whether or not to display the Header */
	showHeader: PropTypes.bool,
	/** Custom header. Optional */
	header: PropTypes.node,
	/** Whether or not to display the Footer */
	showFooter: PropTypes.bool,
	/** Link that the Footer Module name will link to (optional). */
	moduleNameHref: PropTypes.string,
	/** Whether or not to display the Background Color */
	showBackground: PropTypes.bool,
};

export default AdminPage;
