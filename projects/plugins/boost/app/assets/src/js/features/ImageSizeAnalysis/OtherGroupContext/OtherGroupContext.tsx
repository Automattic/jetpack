import { IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './OtherGroupContext.module.scss';

const OtherGroupContext = () => {
	return (
		<IconTooltip
			title=""
			placement={ 'bottom-end' }
			className={ styles.tooltip }
			iconSize={ 18 }
			offset={ 8 }
		>
			<p>
				{ __(
					'In addition to the Homepage, Pages and Posts, Boost will also analyze the following custom post types found on your site:',
					'jetpack-boost'
				) }
			</p>
			<ul>
				{ Object.entries( Jetpack_Boost.site.postTypes ).map( ( [ key, value ] ) => (
					<li key={ key }>{ value }</li>
				) ) }
			</ul>
		</IconTooltip>
	);
};

export default OtherGroupContext;
