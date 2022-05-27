/**
 * Publicize sharing panel based on the
 * Jetpack plugin implementation.
 */

/**
 * External dependencies
 */
import {
	ConnectionVerify as PublicizeConnectionVerify,
	Form as PublicizeForm,
	useSocialMediaConnections as useSelectSocialMediaConnections,
	usePostJustPublished,
} from '@automattic/jetpack-publicize-components';
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Description from './description';

const PublicizePanel = ( { prePublish } ) => {
	const { refresh, hasConnections, hasEnabledConnections } = useSelectSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const isPublicizeEnabled = useSelect(
		select => select( 'jetpack/publicize' ).getFeatureEnableState(),
		[]
	);
	const { togglePublicizeFeature } = useDispatch( 'jetpack/publicize' );

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
				/>
			</Fragment>
		</PanelWrapper>
	);
};

export default PublicizePanel;
