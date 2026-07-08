/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
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
		: {
				title: __( 'Share to social media', 'jetpack-publicize-pkg' ),
				className: styles.panel,
		  };

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
					<ReSharingPanel />
					<ManualSharing />
				</>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
