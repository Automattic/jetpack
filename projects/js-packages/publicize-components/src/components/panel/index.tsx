/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useRefreshConnections from '../../hooks/use-refresh-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { features } from '../../utils/constants';
import PublicizeForm from '../form';
import { ManualSharing } from '../manual-sharing';
import { ReSharingPanel } from '../resharing-panel';
import { AutoShareToggle } from './auto-share-toggle';
import { Description } from './description';
import styles from './styles.module.scss';
import { UpsellNotice } from './upsell';
import './global.scss';

type PublicizePanelProps = {
	prePublish?: boolean;
};

const PublicizePanel = ( { prePublish }: PublicizePanelProps ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const refreshConnections = useRefreshConnections();

	const { hidePublicizeFeature } = usePublicizeConfig();

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
							<AutoShareToggle />
							<Description />
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
