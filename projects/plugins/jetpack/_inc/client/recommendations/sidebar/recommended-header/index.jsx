import { Icon, starFilled } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

import './style.scss';

const RecommendedHeader = ( { className } ) => (
	<div className={ clsx( 'jp-recommendations-recommended-header', className ) }>
		<Icon icon={ starFilled } size={ 18 } />
		{ __( 'Recommended premium product', 'jetpack' ) }
	</div>
);

export default RecommendedHeader;
