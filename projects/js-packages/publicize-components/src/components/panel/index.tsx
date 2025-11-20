/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { PanelBody, PanelRow, __experimentalText as Text } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useRefreshConnections from '../../hooks/use-refresh-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { features } from '../../utils/constants';
import PublicizeForm from '../form';
import { ManualSharing } from '../manual-sharing';
import { ReSharingPanel } from '../resharing-panel';
import { AutoShareToggle } from './auto-share-toggle';
import styles from './styles.module.scss';
import './global.scss';
import { UpsellNotice } from './upsell';

type PublicizePanelProps = {
	prePublish?: boolean;
};

const PublicizePanel = ( { prePublish }: PublicizePanelProps ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const refreshConnections = useRefreshConnections();

	const { isPublicizeEnabled, hidePublicizeFeature } = usePublicizeConfig();

	// Refresh connections when the post is just published.
	usePostJustPublished(
		function () {
			if ( ! hasEnabledConnections ) {
				return;
			}

			refresh();
		},
		[ hasEnabledConnections, refresh ]
	);

	// Panel wrapper.
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish
		? {}
		: { title: __( 'Share this post', 'jetpack-publicize-components' ), className: styles.panel };

	refreshConnections();

	return (
		<PanelWrapper { ...wrapperProps }>
			<UpsellNotice />
			{ ! hidePublicizeFeature && (
				<Fragment>
					{ hasConnections ? (
						<>
							{ ! isPostPublished ? (
								<>
									<PanelRow>
										<Text className={ styles.description }>
											{ isPublicizeEnabled && hasEnabledConnections
												? __(
														'When the post is published, it will be shared automatically on:',
														'jetpack-publicize-components'
												  )
												: _x(
														'After the post is published, you can preview, and manually share or schedule it.',
														'',
														'jetpack-publicize-components'
												  ) }
										</Text>
									</PanelRow>
								</>
							) : (
								<PanelRow>
									<Text className={ styles.description }>
										{ __(
											'Enable the social media accounts where you want to re-share your post, then click on the "Preview and Share" button below.',
											'jetpack-publicize-components'
										) }
									</Text>
								</PanelRow>
							) }
							<AutoShareToggle />
						</>
					) : null }
					<PublicizeForm />
				</Fragment>
			) }
			{ isPostPublished && (
				<>
					{ siteHasFeature( features.SHARE_STATUS ) ? <ReSharingPanel /> : null }
					<ManualSharing />
				</>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
