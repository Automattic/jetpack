/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */

import { PanelBody, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useReducer } from 'react';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import OneClickSharingDropdown from '../one-click-sharing-dropdown';
import OneClickSharingModal from '../one-click-sharing-modal';
import { SharePostRow } from '../share-post';
import PublicizeTwitterOptions from '../twitter/options';
import styles from './styles.module.scss';

const PublicizePanel = ( { prePublish, enableTweetStorm, children } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const {
		isPublicizeEnabled,
		hidePublicizeFeature,
		isPublicizeDisabledBySitePlan,
		togglePublicizeFeature,
		isShareLimitEnabled,
		numberOfSharesRemaining,
		hasPaidPlan,
		connectionsAdminUrl,
		adminUrl,
		isEnhancedPublishingEnabled,
		isSocialImageGeneratorAvailable,
		shouldShowAdvancedPlanNudge,
		jetpackSharingSettingsUrl,
	} = usePublicizeConfig();

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
	const wrapperProps = prePublish ? {} : { title: __( 'Share this post', 'jetpack' ) };

	const [ isModalOpen, toggleModal ] = useReducer( isOpen => ! isOpen, false );

	return (
		<PanelWrapper className={ styles.panel } { ...wrapperProps }>
			{ isPostPublished && (
				<OneClickSharingDropdown
					onClickLearnMore={ toggleModal }
					className={ styles[ 'one-click-share-dropdown' ] }
				/>
			) }
			{ isModalOpen && <OneClickSharingModal onClose={ toggleModal } /> }
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
							checked={ isPublicizeEnabled }
							disabled={ ! hasConnections }
						/>
					) }

					<PublicizeConnectionVerify />
					<PublicizeForm
						isPublicizeEnabled={ isPublicizeEnabled }
						isPublicizeDisabledBySitePlan={ isPublicizeDisabledBySitePlan }
						connectionsAdminUrl={ connectionsAdminUrl }
						numberOfSharesRemaining={
							isShareLimitEnabled && ! hasPaidPlan ? numberOfSharesRemaining : null
						}
						isEnhancedPublishingEnabled={ isEnhancedPublishingEnabled }
						isSocialImageGeneratorAvailable={ isSocialImageGeneratorAvailable }
						adminUrl={ adminUrl }
						shouldShowAdvancedPlanNudge={ shouldShowAdvancedPlanNudge }
						jetpackSharingSettingsUrl={ jetpackSharingSettingsUrl }
					/>
					{ enableTweetStorm && isPublicizeEnabled && (
						<PublicizeTwitterOptions prePublish={ prePublish } />
					) }
					<SharePostRow />
				</Fragment>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
