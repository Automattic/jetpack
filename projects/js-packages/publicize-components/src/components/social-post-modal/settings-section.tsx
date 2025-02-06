import { __ } from '@wordpress/i18n';
import { SharePostForm } from '../form/share-post-form';
import styles from './styles.module.scss';

/**
 * Settings section of the social post modal.
 *
 * @return {import('react').ReactNode} - Settings section of the social post modal.
 */
export function SettingsSection() {
	return (
		<div className={ styles[ 'settings-section' ] }>
			<div className={ styles[ 'settings-header' ] }>
				<h2>{ __( 'Social Preview', 'jetpack-publicize-components' ) }</h2>
			</div>
			<div className={ styles[ 'settings-content' ] }>
				<p className={ styles[ 'modal-description' ] }>
					{ __(
						'Edit and preview your social post before sharing.',
						'jetpack-publicize-components'
					) }
				</p>
				<SharePostForm analyticsData={ { location: 'preview-modal' } } />
			</div>
		</div>
	);
}
