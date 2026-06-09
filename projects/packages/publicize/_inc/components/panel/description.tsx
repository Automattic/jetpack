/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { PanelRow, __experimentalText as Text } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

/**
 * Description component for the Publicize panel.
 *
 * @return The description component.
 */
export function Description() {
	const { hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const { isPublicizeEnabled } = usePublicizeConfig();

	return (
		<PanelRow>
			<Text className={ styles.description }>
				{ ( () => {
					if ( isPostPublished ) {
						return __(
							'Enable the social media accounts where you want to re-share your post, then click on the "Preview and Share" button below.',
							'jetpack-publicize-pkg'
						);
					}

					return isPublicizeEnabled && hasEnabledConnections
						? __(
								'When the post is published, it will be shared automatically on:',
								'jetpack-publicize-pkg'
						  )
						: _x(
								'After the post is published, you can preview, and manually share or schedule it.',
								'',
								'jetpack-publicize-pkg'
						  );
				} )() }
			</Text>
		</PanelRow>
	);
}
