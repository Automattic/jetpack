/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */

import {
	ConnectionVerify as PublicizeConnectionVerify,
	Form as PublicizeForm,
	useSocialMediaConnections as useSelectSocialMediaConnections,
	usePostJustPublished,
	usePublicizeConfig,
} from '@automattic/jetpack-publicize-components';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Description from './description';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const isPublicizeEnabled = useSelect(
		select => select( 'jetpack/publicize' ).getFeatureEnableState(),
		[]
	);
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );

	const { hasPaidPlan, isShareLimitEnabled, numberOfSharesRemaining } = usePublicizeConfig();

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
	const wrapperProps = prePublish ? {} : { title: __( 'Share this post', 'jetpack-social' ) };

	return (
		<PanelWrapper { ...wrapperProps }>
			<Description
				{ ...{ isPublicizeEnabled, isPostPublished, hasConnections, hasEnabledConnections } }
			/>
			<Fragment>
				{ ! isPostPublished && (
					<PanelRow>
						<ToggleControl
							className="jetpack-publicize-toggle"
							label={
								isPublicizeEnabled
									? __( 'Share when publishing', 'jetpack-social' )
									: __(
											'Sharing is disabled',
											'jetpack-social',
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
					isRePublicizeFeatureEnabled={ ! isPostPublished }
					numberOfSharesRemaining={
						isShareLimitEnabled && ! hasPaidPlan ? numberOfSharesRemaining : null
					}
				/>
			</Fragment>
		</PanelWrapper>
	);
};

export default PublicizePanel;
