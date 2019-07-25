/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import SingleFeature from './single-feature';

/**
 * Style dependencies
 */
import './style.scss';

const JetpackDisconnectDialogFeatures = ( { siteBenefits, children } ) => {
	return (
		<Card>
			<h2>{ __( 'Log Out of Jetpack (and deactivate)?' ) }</h2>
			<p>
				{ __(
					'Before you log out of Jetpack we wanted to let you d know that there are a few features you are using that rely on the connection to the WordPress.com Cloud. Once the connection is broken these features will no longer be available.'
				) }
			</p>
			<div>
				{ siteBenefits.map( ( { title, description, value } ) => (
					<SingleFeature
						title={ title }
						description={ value + ': ' + description }
						// iconPath={ iconPath }
						// iconAlt={ iconAlt }
					/>
				) ) }
			</div>
			<p>{ __( 'Are you sure you want to log out (and deactivate)?' ) }</p>
			{ children }
		</Card>
	);
};

JetpackDisconnectDialogFeatures.propTypes = {
	siteBenefits: PropTypes.array,
};

export default JetpackDisconnectDialogFeatures;
