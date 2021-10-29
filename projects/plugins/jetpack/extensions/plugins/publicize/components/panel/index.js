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
import PublicizeTwitterOptions from '../twitter/options';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import usePublicizeConfig from '../../hooks/use-publicize-config';

import { SharePostRow } from '../../components/share-post';
import UpsellNotice from '../upsell';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * Check whether the Republicize feature is enabled.
	 * it can be defined via the `jetpack_block_editor_republicize_feature` backend filter.
	 */
	const {
		isRePublicizeFeatureEnabled, // <- defined by the server-side feature flag check
		isPublicizeEnabled: isPublicizeEnabledFromConfig, // <- usually handled by the UI
		isRePublicizeUpgradableViaUpsell, // <- defined by the `republicize` feature availability check
		togglePublicizeFeature,
		isRePublicizeFeatureAvailable,
	} = usePublicizeConfig();

	/*
	 * Publicize is enabled by toggling the control,
	 * but also disabled when the post is already published,
	 * and the feature is upgradable.
	 */
	const isPublicizeDisabledBySitePlan =
		isPostPublished && isRePublicizeUpgradableViaUpsell && isRePublicizeFeatureEnabled;

	/*
	 * When the site doesn't have the feature available
	 * because of the lack of site plan and/or product feature,
	 * when it is not upgradable via an upsell,
	 * and when the post is already published,
	 * it needs to hide part of the Publicize feature.
	 */
	const hideRePublicizeFeature =
		isPostPublished &&
		! isRePublicizeFeatureAvailable &&
		! isRePublicizeUpgradableViaUpsell &&
		isRePublicizeFeatureEnabled;

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
										: __( 'Sharing is disabled', 'jetpack' )
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
