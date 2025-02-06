import { __ } from '@wordpress/i18n';
import styles from './url-components-example.module.scss';

const UrlComponentsExample = () => {
	const protocol = window.location.protocol.split( ':' )[ 0 ];
	const hostname = window.location.hostname;

	return (
		<div className={ styles.container }>
			<div className={ styles.segment }>
				<div className={ styles.label }>{ __( 'Protocol', 'jetpack-boost' ) }</div>

				<div className={ styles.arrows } />

				{ protocol }
			</div>
			<div className={ styles.segment }>://</div>
			<div className={ styles.segment }>
				<div className={ styles.label }>{ __( 'Host name', 'jetpack-boost' ) }</div>

				<div className={ styles.arrows } />

				{ hostname }
			</div>
		</div>
	);
};

export default UrlComponentsExample;
