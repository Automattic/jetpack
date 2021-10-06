/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const JetpackLoadingIcon = ( { altText } ) => {
	return (
		<div className="jp-loading-icon">
			<img src={ imagePath + '/jetpack-logomark-blue.svg' } alt={ altText } />
		</div>
	);
};

JetpackLoadingIcon.propTypes = {
	altText: PropTypes.string,
};

JetpackLoadingIcon.defaultProps = {
	altText: __( 'Loading…', 'jetpack' ),
};

export { JetpackLoadingIcon };
