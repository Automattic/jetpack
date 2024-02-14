import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';

const Meta = () => {
	return (
		<div className={ styles.wrapper }>
			<div className={ styles.summary }>{ __( 'No exceptions or logging.', 'jetpack-boost' ) }</div>
			<div className={ styles.actions }>
				<Button variant="link" size="small" weight="regular" iconSize={ 16 } icon={ <Lightning /> }>
					{ __( 'Clear Cache', 'jetpack-boost' ) }
				</Button>{ ' ' }
				<Button
					variant="link"
					size="small"
					weight="regular"
					iconSize={ 16 }
					icon={ <ChevronDown /> }
				>
					{ __( 'Show Options', 'jetpack-boost' ) }
				</Button>
			</div>
		</div>
	);
};

export default Meta;
