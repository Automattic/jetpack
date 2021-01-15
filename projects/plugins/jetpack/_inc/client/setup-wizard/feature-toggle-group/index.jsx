/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { FeatureToggle } from '../feature-toggle';

import './style.scss';

const FeatureToggleGroup = props => {
	const { title, details, features } = props;

	return (
		<div className="jp-setup-wizard-feature-toggle-group">
			<h2>{ title }</h2>
			<p className="jp-setup-wizard-feature-toggle-group-details">{ details }</p>
			<div className="jp-setup-wizard-feature-toggle-group-toggles-area-container">
				{ features.map( feature => {
					return (
						<div className="jp-setup-wizard-feature-toggle-group-toggle-container">
							<FeatureToggle feature={ feature } />
						</div>
					);
				} ) }
			</div>
		</div>
	);
};

FeatureToggleGroup.propTypes = {
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
	features: PropTypes.array.isRequired,
};

export { FeatureToggleGroup };
