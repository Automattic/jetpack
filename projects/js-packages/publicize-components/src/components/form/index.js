/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow, Disabled, ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Fragment, createInterpolateElement, useMemo, useCallback } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import useAttachedMedia from '../../hooks/use-attached-media';
import useDismissNotice from '../../hooks/use-dismiss-notice';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions, { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import PublicizeConnection from '../connection';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';
import Notice from '../notice';
import PublicizeSettingsButton from '../settings-button';
import styles from './styles.module.scss';

const PUBLICIZE_STORE_ID = 'jetpack/publicize';
const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

const checkConnectionCode = ( connection, code ) =>
	false === connection.is_healthy && code === ( connection.error_code ?? 'broken' );

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @param {object} props                                  - The component props.
 * @param {boolean} props.isPublicizeEnabled              - Whether Publicize is enabled for this post.
 * @param {boolean} props.isPublicizeDisabledBySitePlan   - A combination of the republicize feature being enabled and/or the post not being published.
 * @param {number} props.numberOfSharesRemaining          - The number of shares remaining for the current period. Optional.
 * @param {boolean} props.isEnhancedPublishingEnabled     - Whether enhanced publishing options are available. Optional.
 * @param {boolean} props.isSocialImageGeneratorAvailable - Whether the Social Image Generator feature is available. Optional.
 * @param {string} props.connectionsAdminUrl              - URL to the Admin connections page
 * @param {string} props.adminUrl                         - URL af the plugin's admin page to redirect to after a plan upgrade
 * @param {boolean} props.hasBasicPlan                    - Whether the site has a basic plan
 * @returns {object}                                      - Publicize form component.
 */
export default function PublicizeForm( {
	isPublicizeEnabled,
	isPublicizeDisabledBySitePlan,
	numberOfSharesRemaining = null,
	isEnhancedPublishingEnabled = false,
	hasBasicPlan = false,
	isSocialImageGeneratorAvailable = false,
	connectionsAdminUrl,
	adminUrl,
} ) {
	const { connections, toggleById, hasConnections, enabledConnections } =
		useSocialMediaConnections();
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();
	const { dismissNotice, shouldShowNotice, NOTICES } = useDismissNotice();

	const { isInstagramConnectionSupported } = useSelect( select => ( {
		isInstagramConnectionSupported: select( PUBLICIZE_STORE_ID ).isInstagramConnectionSupported(),
	} ) );

	const hasInstagramConnection = connections.some(
		connection => connection.service_name === 'instagram-business'
	);

	const shouldShowInstagramNotice =
		! hasInstagramConnection &&
		isInstagramConnectionSupported &&
		shouldShowNotice( NOTICES.instagram );

	const onDismissInstagramNotice = useCallback( () => {
		dismissNotice( NOTICES.instagram );
	}, [ NOTICES, dismissNotice ] );
	const shouldDisableMediaPicker =
		isSocialImageGeneratorAvailable && isSocialImageGeneratorEnabledForPost;
	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	const brokenConnections = connections.filter( connection =>
		checkConnectionCode( connection, 'broken' )
	);
	const unsupportedConnections = connections.filter( connection =>
		checkConnectionCode( connection, 'unsupported' )
	);

	const outOfConnections =
		numberOfSharesRemaining !== null && numberOfSharesRemaining <= enabledConnections.length;

	const { isEditedPostDirty } = useSelect( 'core/editor' );
	const { autosave } = useDispatch( 'core/editor' );
	const autosaveAndRedirect = useCallback(
		async ev => {
			const target = ev.target.getAttribute( 'target' );
			if ( isEditedPostDirty() && ! target ) {
				ev.preventDefault();
				await autosave();
				window.location.href = ev.target.href;
			}
			if ( target ) {
				ev.preventDefault();
				window.open( ev.target.href, target, 'noreferrer' );
			}
		},
		[ autosave, isEditedPostDirty ]
	);

	const onAdvancedNudgeDismiss = useCallback(
		() => dismissNotice( NOTICES.advancedUpgrade, 3 * MONTH_IN_SECONDS ),
		[ dismissNotice, NOTICES ]
	);

	const renderNotices = () => (
		<>
			{ brokenConnections.length > 0 && (
				<Notice type={ 'error' }>
					{ createInterpolateElement(
						_n(
							'One of your social connections is broken. Reconnect them on the <fixLink>connection management</fixLink> page.',
							'Some of your social connections are broken. Reconnect them on the <fixLink>connection management</fixLink> page.',
							brokenConnections.length,
							'jetpack'
						),
						{
							fixLink: <ExternalLink href={ connectionsAdminUrl } />,
						}
					) }
				</Notice>
			) }
			{ unsupportedConnections.length > 0 && (
				<Notice type={ 'error' }>
					{ createInterpolateElement(
						__(
							'Twitter is not supported anymore. <moreInfo>Learn more here</moreInfo>.',
							'jetpack'
						),
						{
							moreInfo: <ExternalLink href={ connectionsAdminUrl } />,
						}
					) }
				</Notice>
			) }
		</>
	);

	const { attachedMedia, shouldUploadAttachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;

	const validationErrors = useMediaRestrictions( connections, useMediaDetails( mediaId )[ 0 ], {
		isSocialImageGeneratorEnabledForPost,
		shouldUploadAttachedMedia,
	} );

	const invalidIds = useMemo( () => Object.keys( validationErrors ), [ validationErrors ] );

	const showValidationNotice = numberOfSharesRemaining !== 0 && invalidIds.length > 0;

	const isConnectionEnabled = useCallback(
		( { enabled, is_healthy = true, connection_id } ) =>
			enabled &&
			! isPublicizeDisabledBySitePlan &&
			false !== is_healthy &&
			! validationErrors[ connection_id ],
		[ isPublicizeDisabledBySitePlan, validationErrors ]
	);

	const renderInstagramNotice = () => {
		return isEnhancedPublishingEnabled ? (
			<Notice type={ 'warning' }>
				{ __(
					'To share to Instagram, add an image/video, or enable Social Image Generator.',
					'jetpack'
				) }
				<br />
				<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
					{ __( 'Learn more', 'jetpack' ) }
				</ExternalLink>
			</Notice>
		) : (
			<Notice type={ 'warning' }>
				{ __( 'You need a featured image to share to Instagram.', 'jetpack' ) }
				<br />
				<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
					{ __( 'Learn more', 'jetpack' ) }
				</ExternalLink>
			</Notice>
		);
	};

	return (
		<Wrapper>
			{ hasConnections && (
				<>
					{ numberOfSharesRemaining !== null && (
						<PanelRow>
							<Notice type={ numberOfSharesRemaining < connections.length ? 'warning' : 'default' }>
								<Fragment>
									{ createInterpolateElement(
										sprintf(
											/* translators: %d is the number of shares remaining, upgradeLink is the link to upgrade to a different plan */
											_n(
												'You have %d share remaining in the next 30 days. <upgradeLink>Upgrade now</upgradeLink> to share more.',
												'You have %d shares remaining in the next 30 days. <upgradeLink>Upgrade now</upgradeLink> to share more.',
												numberOfSharesRemaining,
												'jetpack'
											),
											numberOfSharesRemaining
										),
										{
											upgradeLink: (
												<a
													className={ styles[ 'upgrade-link' ] }
													href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
														site: getSiteFragment(),
														query: 'redirect_to=' + encodeURIComponent( window.location.href ),
													} ) }
													onClick={ autosaveAndRedirect }
												/>
											),
										}
									) }
									<br />
									<a
										className={ styles[ 'more-link' ] }
										href={ getRedirectUrl( 'jetpack-social-block-editor-more-info', {
											site: getSiteFragment(),
											...( adminUrl
												? { query: 'redirect_to=' + encodeURIComponent( adminUrl ) }
												: {} ),
										} ) }
										target="_blank"
										rel="noopener noreferrer"
										onClick={ autosaveAndRedirect }
									>
										{ __( 'More about Jetpack Social.', 'jetpack' ) }
									</a>
								</Fragment>
							</Notice>
						</PanelRow>
					) }
					{ renderNotices() }
					<PanelRow>
						<ul className={ styles[ 'connections-list' ] }>
							{ connections.map( conn => {
								const {
									display_name,
									enabled,
									id,
									service_name,
									toggleable,
									profile_picture,
									is_healthy,
									connection_id,
								} = conn;
								return (
									<PublicizeConnection
										disabled={
											! isPublicizeEnabled ||
											( ! enabled && toggleable && outOfConnections ) ||
											false === is_healthy ||
											validationErrors[ connection_id ? connection_id : id ] !== undefined
										}
										enabled={ isConnectionEnabled( conn ) }
										key={ connection_id ? connection_id : id }
										id={ connection_id ? connection_id : id }
										label={ display_name }
										name={ service_name }
										toggleConnection={ toggleById }
										profilePicture={ profile_picture }
									/>
								);
							} ) }
						</ul>
					</PanelRow>
					{ showValidationNotice &&
						( Object.values( validationErrors ).includes( NO_MEDIA_ERROR ) ? (
							renderInstagramNotice()
						) : (
							<Notice type={ 'warning' }>
								<p>
									{ invalidIds.length === connections.length
										? _n(
												'The selected media cannot be shared to this platform.',
												'The selected media cannot be shared to any of these platforms.',
												connections.length,
												'jetpack'
										  )
										: _n(
												'The selected media cannot be shared to one of these platforms.',
												'The selected media cannot be shared to some of these platforms.',
												invalidIds.length,
												'jetpack'
										  ) }
								</p>
								<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
									{ __( 'Troubleshooting tips', 'jetpack' ) }
								</ExternalLink>
							</Notice>
						) ) }
				</>
			) }
			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ shouldShowInstagramNotice && (
						<Notice
							onDismiss={ onDismissInstagramNotice }
							type={ 'highlight' }
							actions={ [
								<Button
									key="connect"
									href={ connectionsAdminUrl }
									target="_blank"
									rel="noreferrer noopener"
									variant="primary"
								>
									{ __( 'Connect now', 'jetpack' ) }
								</Button>,
								<Button
									key="learn-more"
									href={ getRedirectUrl( 'jetpack-social-connecting-to-social-networks' ) }
									target="_blank"
									rel="noreferrer noopener"
								>
									{ __( 'Learn more', 'jetpack' ) }
								</Button>,
							] }
						>
							{ __( 'You can now share directly to your Instagram account!', 'jetpack' ) }
						</Notice>
					) }
					<PublicizeSettingsButton />

					{ isPublicizeEnabled && connections.some( connection => connection.enabled ) && (
						<>
							<MessageBoxControl
								maxLength={ maxLength }
								onChange={ updateMessage }
								message={ message }
							/>
						</>
					) }
					{ hasBasicPlan && shouldShowNotice( NOTICES.advancedUpgrade ) && (
						<Notice onDismiss={ onAdvancedNudgeDismiss } type={ 'highlight' }>
							{ createInterpolateElement(
								__(
									'Need more reach? Unlock custom media sharing with the <upgradeLink>Advanced Plan</upgradeLink>',
									'jetpack'
								),
								{
									upgradeLink: (
										<ExternalLink href={ getRedirectUrl( 'jetpack-social-pricing-modal' ) } />
									),
								}
							) }
						</Notice>
					) }
					{ isEnhancedPublishingEnabled && (
						<MediaSection
							disabled={ shouldDisableMediaPicker }
							connections={ connections }
							notice={
								shouldDisableMediaPicker
									? __(
											'It is not possible to add an image or video when Social Image Generator is enabled.',
											'jetpack'
									  )
									: null
							}
						/>
					) }
				</Fragment>
			) }
		</Wrapper>
	);
}
