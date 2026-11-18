import { __ } from '@wordpress/i18n';
import { Icon, starFilled } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import styles from './style.module.scss';

/**
 * The "Popular upgrade" bar on top of a bundle upsell card and its loading placeholder.
 *
 * @return {object} BundleCardHeader component.
 */
export default function BundleCardHeader() {
	return (
		<div className={ styles[ 'card-header' ] }>
			<Icon icon={ starFilled } className={ styles[ 'product-bundle-icon' ] } size={ 16 } />
			<Text
				variant="body-sm"
				style={ { margin: 0 } }
				render={ <p>{ __( 'Popular upgrade', 'jetpack-my-jetpack' ) }</p> }
			></Text>
		</div>
	);
}
