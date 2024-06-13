import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Gridicon from 'components/gridicon';
import React from 'react';

import './style.scss';

const RecommendedHeader = ( { className } ) => (
	<div className={ clsx( 'jp-recommendations-recommended-header', className ) }>
		<Gridicon size={ 18 } icon="star" />
		{ __( 'Recommended premium product', 'jetpack' ) }
	</div>
);

export default RecommendedHeader;
