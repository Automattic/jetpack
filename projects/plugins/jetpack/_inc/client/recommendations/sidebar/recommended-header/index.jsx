import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React from 'react';
import Gridicon from 'components/gridicon';

import './style.scss';

const RecommendedHeader = ( { className } ) => (
	<div className={ clsx( 'jp-recommendations-recommended-header', className ) }>
		<Gridicon size={ 18 } icon="star" />
		{ __( 'Recommended premium product', 'jetpack' ) }
	</div>
);

export default RecommendedHeader;
