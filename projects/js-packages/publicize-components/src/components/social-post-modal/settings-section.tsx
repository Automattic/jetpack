import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

/**
 * Settings section of the social post modal.
 *
 * @returns {import('react').ReactNode} - Settings section of the social post modal.
 */
export function SettingsSection() {
	return (
		<div>
			<div className={ styles[ 'settings-header' ] }>
				<h2>{ __( 'Social Preview', 'jetpack' ) }</h2>
			</div>
			<div className={ styles[ 'settings-content' ] }>
				<textarea />
			</div>
		</div>
	);
}
