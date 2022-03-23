/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const RecommendedHeader = ( { className } ) => (
	<div className={ classNames( 'jp-recommendations-recommended-header', className ) }>
		<img src={ imagePath + '/star.svg' } alt="" />
		{ __( 'Recommended premium product', 'jetpack' ) }
	</div>
);

export default RecommendedHeader;
