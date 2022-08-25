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
} from '@automattic/jetpack-publicize-components';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SharePostRow } from '../../components/share-post';
import usePublicizeConfig from '../../hooks/use-publicize-config';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const {
		isPublicizeEnabled: isPublicizeEnabledFromConfig, // <- usually handled by the UI
		togglePublicizeFeature,
	} = usePublicizeConfig();

	const isPublicizeEnabled = isPublicizeEnabledFromConfig;

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
				title: __( 'Share this post', 'jetpack' ),
		  };

	return (
		<PanelWrapper { ...wrapperProps }>
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
					isRePublicizeFeatureEnabled={ true }
					isPublicizeDisabledBySitePlan={ false }
				/>
				{ isPublicizeEnabled && <PublicizeTwitterOptions prePublish={ prePublish } /> }

				<SharePostRow />
			</Fragment>
		</PanelWrapper>
	);
};

export default PublicizePanel;
