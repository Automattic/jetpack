/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { Button } from '@automattic/jetpack-components';
import { Disabled, ExternalLink, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useDismissNotice from '../../hooks/use-dismiss-notice';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions, { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions';
import useRefreshAutoConversionSettings from '../../hooks/use-refresh-auto-conversion-settings';
import useRefreshConnections from '../../hooks/use-refresh-connections';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { AdvancedPlanNudge } from './advanced-plan-nudge';
import { AutoConversionNotice } from './auto-conversion-notice';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { ConnectionsList } from './connections-list';
import { EnabledConnectionsNotice } from './enabled-connections-notice';
import { InstagramNoMediaNotice } from './instagram-no-media-notice';
import { ShareCountInfo } from './share-count-info';
import { SharePostForm } from './share-post-form';
import styles from './styles.module.scss';
import { UnsupportedConnectionsNotice } from './unsupported-connections-notice';
import { ValidationNotice } from './validation-notice';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @returns {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { connections, hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const refreshConnections = useRefreshConnections();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();
	const { shouldShowNotice, NOTICES } = useDismissNotice();
	const {
		isPublicizeEnabled,
		isPublicizeDisabledBySitePlan,
		connectionsAdminUrl,
		needsUserConnection,
		userConnectionUrl,
	} = usePublicizeConfig();

	const { numberOfSharesRemaining, useAdminUiV1 } = useSelect( select => {
		const store = select( socialStore );
		return {
			numberOfSharesRemaining: store.numberOfSharesRemaining(),
			useAdminUiV1: store.useAdminUiV1(),
		};
	}, [] );

	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	const isAutoConversionEnabled = useSelect(
		select => select( socialStore ).isAutoConversionEnabled(),
		[]
	);

	const { attachedMedia, shouldUploadAttachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;

	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ],
		{
			isSocialImageGeneratorEnabledForPost,
			shouldUploadAttachedMedia,
		}
	);
	const shouldAutoConvert = isAutoConversionEnabled && isConvertible;

	const invalidIds = useMemo( () => Object.keys( validationErrors ), [ validationErrors ] );

	const showValidationNotice = numberOfSharesRemaining !== 0 && invalidIds.length > 0;

	const { refreshAutoConversionSettings } = useRefreshAutoConversionSettings();

	if (
		shouldAutoConvert &&
		showValidationNotice &&
		mediaId &&
		shouldShowNotice( NOTICES.autoConversion )
	) {
		refreshAutoConversionSettings();
	}

	refreshConnections();

	const { openConnectionsModal } = useDispatch( socialStore );

	return (
		<Wrapper>
			{
				// Render modal only once
				useAdminUiV1 ? <ManageConnectionsModal /> : null
			}
			{ hasConnections ? (
				<>
					<PanelRow>
						<ConnectionsList />
					</PanelRow>
					<EnabledConnectionsNotice />
					<ShareCountInfo />
					<BrokenConnectionsNotice />
					<UnsupportedConnectionsNotice />
					{ shouldAutoConvert && showValidationNotice && mediaId && <AutoConversionNotice /> }
					{ showValidationNotice &&
						( Object.values( validationErrors ).includes( NO_MEDIA_ERROR ) ? (
							<InstagramNoMediaNotice />
						) : (
							<ValidationNotice
								connectionsCount={ connections.length }
								invalidConnectionIdsCount={ invalidIds.length }
								shouldAutoConvert={ shouldAutoConvert }
							/>
						) ) }
				</>
			) : null }
			<PanelRow>
				{
					// Use IIFE make it more readable and avoid nested ternary operators.
					( () => {
						if ( needsUserConnection ) {
							return (
								<p>
									{ __(
										'You must connect your WordPress.com account to be able to add social media connections.',
										'jetpack'
									) }
									&nbsp;
									<a href={ userConnectionUrl }>{ __( 'Connect now', 'jetpack' ) }</a>
								</p>
							);
						}

						if ( ! hasConnections ) {
							return (
								<p>
									<span className={ styles[ 'no-connections-text' ] }>
										{ __(
											'Sharing is disabled because there are no social media accounts connected.',
											'jetpack'
										) }
									</span>
									{ useAdminUiV1 ? (
										<Button variant="secondary" size="small" onClick={ openConnectionsModal }>
											{ __( 'Connect an account', 'jetpack' ) }
										</Button>
									) : (
										<ExternalLink href={ connectionsAdminUrl }>
											{ __( 'Connect an account', 'jetpack' ) }
										</ExternalLink>
									) }
								</p>
							);
						}

						return null;
					} )()
				}
			</PanelRow>

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ isPublicizeEnabled && hasEnabledConnections && <SharePostForm /> }
					<AdvancedPlanNudge />
				</Fragment>
			) }
		</Wrapper>
	);
}
