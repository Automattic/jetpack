/**
 * Publicize sharing panel component.
 *
 * Displays Publicize notifications if no
 * services are connected or displays form if
 * services are connected.
 */

/**
 * WordPress dependencies
 */
import { TwitterOptions as PublicizeTwitterOptions } from '@automattic/jetpack-publicize-components';
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, ToggleControl, Disabled } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import usePublicizeConfig from '../../hooks/use-publicize-config';

import { SharePostRow } from '../../components/share-post';
import UpsellNotice from '../upsell';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const {
		isRePublicizeFeatureEnabled,
		isPublicizeEnabled: isPublicizeEnabledFromConfig, // <- usually handled by the UI
		togglePublicizeFeature,
		isPublicizeDisabledBySitePlan,
		hideRePublicizeFeature,
	} = usePublicizeConfig();

	const isPublicizeEnabled = isPublicizeEnabledFromConfig && ! isPublicizeDisabledBySitePlan;

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

	// Disable the panel when no proper site plan is available.
	const PanelRowWithDisabled = isPublicizeDisabledBySitePlan ? Disabled : PanelRow;

	// Panel wrapper.
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish
		? {}
		: {
				title: __( 'Share this post', 'jetpack' ),
				className: isPublicizeDisabledBySitePlan ? 'jetpack-publicize-disabled' : '',
		  };

	return (
		<PanelWrapper { ...wrapperProps }>
			<UpsellNotice isPostPublished={ isPostPublished } />

			{ ! hideRePublicizeFeature && (
				<Fragment>
					{ isRePublicizeFeatureEnabled && ! isPostPublished && (
						<PanelRowWithDisabled>
							<ToggleControl
								className="jetpack-publicize-toggle"
								label={
									isPublicizeEnabled && ! isPublicizeDisabledBySitePlan
										? __( 'Share when publishing', 'jetpack' )
										: __(
												'Sharing is disabled',
												'jetpack',
												/* dummy arg to avoid bad minification */ 0
										  )
								}
								onChange={ togglePublicizeFeature }
								checked={ isPublicizeEnabled }
								disabled={ ! hasConnections }
							/>
						</PanelRowWithDisabled>
					) }

					<PublicizeConnectionVerify />
					<PublicizeForm
						isPublicizeEnabled={ isPublicizeEnabled }
						isRePublicizeFeatureEnabled={ isRePublicizeFeatureEnabled }
						isPublicizeDisabledBySitePlan={ isPublicizeDisabledBySitePlan }
					/>
					{ ! isPublicizeDisabledBySitePlan && (
						<PublicizeTwitterOptions prePublish={ prePublish } />
					) }

					<SharePostRow />
				</Fragment>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
