import { imagePath } from 'constants/urls';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';

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
