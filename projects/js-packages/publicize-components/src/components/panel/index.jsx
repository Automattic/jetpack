/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */

import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import PublicizeConnectionVerify from '../connection-verify';
import PublicizeForm from '../form';
import { SharePostRow } from '../share-post';
import PublicizeTwitterOptions from '../twitter';

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

	return (
		<PanelWrapper { ...wrapperProps }>
			{ children }
			{ ! hidePublicizeFeature && (
				<Fragment>
					{ ! isPostPublished && (
						<PanelRow>
							<ToggleControl
								className="jetpack-publicize-toggle"
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
						</PanelRow>
					) }

					<PublicizeConnectionVerify />
					<PublicizeForm
						isPublicizeEnabled={ isPublicizeEnabled }
						isPublicizeDisabledBySitePlan={ isPublicizeDisabledBySitePlan }
						numberOfSharesRemaining={
							isShareLimitEnabled && ! hasPaidPlan ? numberOfSharesRemaining : null
						}
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
