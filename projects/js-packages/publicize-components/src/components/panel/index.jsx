/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */

import { PanelBody, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useRefreshConnections from '../../hooks/use-refresh-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { getSocialScriptData } from '../../utils/script-data';
import PublicizeForm from '../form';
import { ManualSharing } from '../manual-sharing';
import { ReSharingPanel } from '../resharing-panel';
import { SharePostRow } from '../share-post';
import styles from './styles.module.scss';
import './global.scss';

const PublicizePanel = ( { prePublish, children } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const { feature_flags } = getSocialScriptData();

	const refreshConnections = useRefreshConnections();

	const { isPublicizeEnabled, hidePublicizeFeature, togglePublicizeFeature } = usePublicizeConfig();

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
			{ children }
			{ ! hidePublicizeFeature && (
				<Fragment>
					{ ! isPostPublished && (
						<ToggleControl
							label={
								isPublicizeEnabled
									? __( 'Share when publishing', 'jetpack-publicize-components' )
									: __(
											'Sharing is disabled',
											'jetpack-publicize-components',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
							onChange={ togglePublicizeFeature }
							checked={ isPublicizeEnabled && hasConnections }
							disabled={ ! hasConnections }
							__nextHasNoMarginBottom={ true }
						/>
					) }

					<PublicizeForm />
					<SharePostRow />
				</Fragment>
			) }
			{ isPostPublished && (
				<>
					{ feature_flags.useShareStatus ? <ReSharingPanel /> : null }
					<ManualSharing />
				</>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
