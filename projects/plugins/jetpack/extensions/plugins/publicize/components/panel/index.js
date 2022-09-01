/**
 * Publicize sharing panel component.
 *
 * Displays Publicize notifications if no
 * services are connected or displays form if
 * services are connected.
 */

import {
	TwitterOptions as PublicizeTwitterOptions,
	ConnectionVerify as PublicizeConnectionVerify,
	Form as PublicizeForm,
	useSocialMediaConnections as useSelectSocialMediaConnections,
	usePostJustPublished,
	usePublicizeConfig,
	SharePostRow,
} from '@automattic/jetpack-publicize-components';
import { PanelBody, PanelRow, ToggleControl, Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import UpsellNotice from '../upsell';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const {
		isPublicizeEnabled: isPublicizeEnabledFromConfig, // <- usually handled by the UI
		hidePublicizeFeature,
		togglePublicizeFeature,
		isPublicizeDisabledBySitePlan,
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

			{ ! hidePublicizeFeature && (
				<Fragment>
					{ ! isPostPublished && (
						<PanelRowWithDisabled>
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
						</PanelRowWithDisabled>
					) }

					<PublicizeConnectionVerify />
					<PublicizeForm
						isPublicizeEnabled={ isPublicizeEnabled }
						isPublicizeDisabledBySitePlan={ isPublicizeDisabledBySitePlan }
					/>
					{ isPublicizeEnabled && <PublicizeTwitterOptions prePublish={ prePublish } /> }

					<SharePostRow />
				</Fragment>
			) }
		</PanelWrapper>
	);
};

export default PublicizePanel;
