import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
import Gridicon from 'components/gridicon';
import './style.scss';

const RecommendedHeader = ( { className } ) => (
	<div className={ classNames( 'jp-recommendations-recommended-header', className ) }>
		<Gridicon size="18" icon="star" />
		{ __( 'Recommended premium product', 'jetpack' ) }
	</div>
);

export default RecommendedHeader;
