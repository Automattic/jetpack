import { IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './other-group-context.module.scss';

const OtherGroupContext = () => {
	const { postTypes } = Jetpack_Boost;
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
				{ Object.entries( postTypes ).map( ( [ key, value ] ) => (
					<li key={ key }>{ value }</li>
				) ) }
			</ul>
		</IconTooltip>
	);
};

export default OtherGroupContext;
