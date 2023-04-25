import { getRedirectUrl } from '@automattic/jetpack-components';
// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { Flex, FlexBlock, Button, PanelRow, Dropdown, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PostVisibilityCheck } from '@wordpress/editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import InspectorNotice from '../../shared/components/inspector-notice';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';

import './settings.scss';

export const accessOptions = {
	everybody: {
		string: 'everybody',
		label: __( 'Everybody', 'jetpack' ),
		info: __( 'Visible to everyone.', 'jetpack' ),
	},
	subscribers: {
		string: 'subscribers',
		label: __( 'All subscribers', 'jetpack' ),
		info: __( 'Visible to everyone that subscribes to your site.', 'jetpack' ),
	},
	paid_subscribers: {
		string: 'paid_subscribers',
		label: __( 'Paid subscribers', 'jetpack' ),
		info: __( 'Visible to everyone that purchases a paid plan on your site.', 'jetpack' ),
	},
};

function getReachForAccessLevel( key, emailSubscribers, paidSubscribers, socialFollowers ) {
	if ( emailSubscribers === null || paidSubscribers === null || socialFollowers === null ) {
		return '';
	}

	switch ( accessOptions[ key ] ) {
		case accessOptions.everybody:
			return '(' + ( emailSubscribers + socialFollowers ) + '+)';
		case accessOptions.subscribers:
			return '(' + emailSubscribers + ')';
		case accessOptions.paid_subscribers:
			return '(' + paidSubscribers + ')';
		default:
	}
}

export function MisconfigurationWarning( { accessLevel } ) {
	return (
		<div className="jetpack-subscribe-notice-misconfiguration warning">
			{ sprintf(
				/* translators: %1$s: visibility label for the newsletter, %2$s: label for setting "everybody". this is a warning in the newsletter when posts have a private or password-protected visibility */
				__(
					'Private or password-protected posts cannot be assigned a newsletter setting of "%1$s". Please update the setting to "%2$s", or update the post visibility setting.',
					'jetpack'
				),
				accessOptions[ accessLevel ].label,
				accessOptions.everybody.label
			) }
		</div>
	);
}

function NewsletterAccessChoices( {
	accessLevel,
	onChange,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
} ) {
	const instanceId = useInstanceId( NewsletterAccessChoices );
	return (
		<fieldset className="editor-post-visibility__fieldset">
			<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
			{ Object.keys( accessOptions ).map( key => (
				<div className="editor-post-visibility__choice" key={ key }>
					<input
						type="radio"
						checked={ key === accessLevel }
						name={ `editor-post-visibility__setting-${ instanceId }` }
						value={ key }
						id={ `editor-post-${ key }-${ instanceId }` }
						aria-describedby={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__radio"
						onChange={ event => {
							const obj = {};
							obj[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] = event?.target?.value;
							return onChange && onChange( obj );
						} }
					/>
					<label
						htmlFor={ `editor-post-${ key }-${ instanceId }` }
						className="editor-post-visibility__label"
					>
						{ accessOptions[ key ].label }{ ' ' }
						{ getReachForAccessLevel( key, emailSubscribers, paidSubscribers, socialFollowers ) }
					</label>
					<p
						id={ `editor-post-${ key }-${ instanceId }-description` }
						className="editor-post-visibility__info"
					>
						{ accessOptions[ key ].info }
					</p>
				</div>
			) ) }
		</fieldset>
	);
}

export function NewsletterAccess( {
	accessLevel,
	setPostMeta,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	withModal = true,
} ) {
	if ( ! accessLevel || ! Object.keys( accessOptions ).includes( accessLevel ) ) {
		accessLevel = Object.keys( accessOptions )[ 0 ];
	}
	const accessLabel = accessOptions[ accessLevel ]?.label;

	// Can be “private”, “password”, or “public”.
	const postVisibility = useSelect( select => select( 'core/editor' ).getEditedPostVisibility() );
	const postVisibilityIsPublic = postVisibility === 'public';

	const showVisibilityRestrictedMessage =
		! postVisibilityIsPublic && accessLevel === accessOptions.everybody.string;
	const showMisconfigurationMessage =
		! postVisibilityIsPublic && accessLevel !== accessOptions.everybody.string;

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction={ 'column' }>
						{ canEdit && withModal && showVisibilityRestrictedMessage && (
							<FlexBlock>
								<InspectorNotice spanClass={ 'jetpack-subscribe-notice-visibility' }>
									{
										/* translators: this is a warning in the newsletter when posts have a private or password-protected visibility */
										__(
											'Private or password-protected posts cannot be assigned as Subscribers-only.',
											'jetpack'
										)
									}
								</InspectorNotice>
							</FlexBlock>
						) }

						{ canEdit &&
							withModal /* to prevent displaying in pre-publish panel */ &&
							showMisconfigurationMessage && (
								<FlexBlock>
									<MisconfigurationWarning accessLevel={ accessLevel } />
								</FlexBlock>
							) }

						<Flex direction={ withModal ? 'row' : 'column' }>
							<FlexBlock>
								<span>{ __( 'Access', 'jetpack' ) }</span>
							</FlexBlock>
							{ ( ! canEdit || showVisibilityRestrictedMessage ) && <span>{ accessLabel }</span> }
							{ ! showVisibilityRestrictedMessage && withModal && canEdit && (
								<FlexBlock>
									<Dropdown
										placement="bottom-end"
										contentClassName="edit-post-post-visibility__dialog"
										focusOnMount
										renderToggle={ ( { isOpen, onToggle } ) => (
											<Button
												variant="tertiary"
												onClick={ onToggle }
												aria-expanded={ isOpen }
												aria-label={ sprintf(
													// translators: %s: Current newsletter post access.
													__( 'Select audience: %s', 'jetpack' ),
													accessLabel
												) }
											>
												{ accessLabel }
											</Button>
										) }
										renderContent={ ( { onClose } ) => (
											<div className="editor-post-visibility">
												<InspectorPopoverHeader
													title={ __( 'Audience', 'jetpack' ) }
													help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
													onClose={ onClose }
												/>
												<NewsletterAccessChoices
													accessLevel={ accessLevel }
													socialFollowers={ socialFollowers }
													emailSubscribers={ emailSubscribers }
													paidSubscribers={ paidSubscribers }
													onChange={ setPostMeta }
												/>
											</div>
										) }
									/>
								</FlexBlock>
							) }

							{ ! showVisibilityRestrictedMessage && ! withModal && canEdit && (
								<FlexBlock>
									<NewsletterAccessChoices
										accessLevel={ accessLevel }
										socialFollowers={ socialFollowers }
										emailSubscribers={ emailSubscribers }
										paidSubscribers={ paidSubscribers }
										onChange={ setPostMeta }
									/>
								</FlexBlock>
							) }
						</Flex>
						{ withModal && (
							<FlexBlock>
								<small spanClass={ 'jetpack-subscribe-info' }>
									{ createInterpolateElement(
										/* translators: basic information about the newsletter visibility */
										__( 'Restrict your post to subscribers. <a>Learn more</a>.', 'jetpack' ),
										{
											a: (
												<a
													href={ getRedirectUrl( 'paid-newsletter-info', {
														anchor: 'memberships-and-subscriptions',
													} ) }
													rel="noopener noreferrer"
													target="_blank"
												/>
											),
										}
									) }
								</small>
							</FlexBlock>
						) }
					</Flex>
				</PanelRow>
			) }
		/>
	);
}
