import { __ } from '@wordpress/i18n';
import styles from './upgraded.module.scss';

const Upgraded = () => (
	<span className={ styles.badge }>{ __( 'Upgraded', 'jetpack-boost' ) }</span>
);

export default Upgraded;
