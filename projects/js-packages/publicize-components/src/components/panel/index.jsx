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
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import { ManualSharing } from '../manual-sharing';
import { SharePostRow } from '../share-post';
import styles from './styles.module.scss';
import './global.scss';

const PublicizePanel = ( { prePublish, children } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

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
		: { title: __( 'Share this post', 'jetpack' ), className: styles.panel };

	return (
		<PanelWrapper { ...wrapperProps }>
			{ children }
			{ ! hidePublicizeFeature && (
				<Fragment>
					{ ! isPostPublished && (
						<ToggleControl
							label={
								isPublicizeEnabled
									? __( 'Share when publishing', 'jetpack' )
									: __(
											'Sharing is disabled',
											'jetpack',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
							onChange={ togglePublicizeFeature }
							checked={ isPublicizeEnabled && hasConnections }
							disabled={ ! hasConnections }
						/>
					) }

					<PublicizeConnectionVerify />
					<PublicizeForm />
					<SharePostRow />
				</Fragment>
			) }
			{ isPostPublished && <ManualSharing /> }
		</PanelWrapper>
	);
};

export default PublicizePanel;
