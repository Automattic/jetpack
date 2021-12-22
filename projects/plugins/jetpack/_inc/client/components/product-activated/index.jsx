/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

/**
 * Style dependencies
 */
import './style.scss';

const ProductActivated = ( { active } ) => {
	// Don't display the label if product isn't active.
	if ( active !== '1' ) {
		return null;
	}

	return (
		<div className="jp-product-activated-label">
			<Gridicon icon="checkmark" size={ 20 } />

			<span className="jp-product-activated-label__text">{ __( 'Activated', 'jetpack' ) }</span>
		</div>
	);
};

ProductActivated.propTypes = {
	active: PropTypes.string,
};

ProductActivated.defaultProps = {
	active: '',
};

export { ProductActivated };
