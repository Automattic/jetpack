import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon, update, check } from '@wordpress/icons';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { PaywallBlockSettings } from '../../shared/memberships/settings';
import { getPaidPlanLink } from '../../shared/memberships/utils';

function PaywallEdit( { className } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	const { stripeConnectUrl, hasNewsletterPlans } = useSelect( select => {
		const { getNewsletterProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
		};
	} );
	const paidLink = getPaidPlanLink( hasNewsletterPlans );
	const [ showModal, setShowModal ] = useState( false );
	const closeModal = () => setShowModal( false );
	const { savePost } = useDispatch( 'core/editor' );

	useEffect( () => {
		if ( ! accessLevel || accessLevel === accessOptions.everybody.key ) {
			setPostMeta( {
				[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.subscribers.key,
			} );
		}
	}, [ accessLevel, setPostMeta ] );

	function switchToAnyoneSubscribed() {
		setPostMeta( {
			[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.subscribers.key,
		} );
	}

	function switchToPaidSubscribers() {
		setPostMeta( {
			[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.paid_subscribers.key,
		} );
	}

	const getText = key => {
		switch ( key ) {
			case accessOptions.subscribers.key:
				return __( 'Subscriber-only content below', 'jetpack' );
			case accessOptions.paid_subscribers.key:
				return __( 'Paid content below this line', 'jetpack' );
			default:
				return __( 'Paywall', 'jetpack' );
		}
	};

	const getLabel = key => {
		switch ( key ) {
			case accessOptions.paid_subscribers.key:
				return accessOptions.paid_subscribers.label;
			default:
				return accessOptions.subscribers.label;
		}
	};

	const text = getText( accessLevel );

	const style = {
		width: `${ text.length + 1.2 }em`,
	};

	return (
		<>
			<div className={ className }>
				<span style={ style }>
					{ text }
					<Icon icon={ arrowDown } size={ 16 } />
				</span>
			</div>
			<BlockControls __experimentalShareWithChildBlocks group="block">
				<ToolbarDropdownMenu
					className="product-management-control-toolbar__dropdown-button"
					icon={ update }
					text={ getLabel( accessLevel ) }
				>
					{ ( { onClose: closeDropdown } ) => (
						<>
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										switchToAnyoneSubscribed();
										closeDropdown();
									} }
									isSelected={ accessLevel === accessOptions.subscribers.key }
									icon={ accessLevel === accessOptions.subscribers.key && check }
									iconPosition="right"
								>
									{ getLabel( accessOptions.subscribers.key ) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										if ( ! stripeConnectUrl && hasNewsletterPlans ) {
											switchToPaidSubscribers();
										} else {
											setShowModal( true );
											closeDropdown();
										}
									} }
									isSelected={ accessLevel === accessOptions.paid_subscribers.key }
									icon={ accessLevel === accessOptions.paid_subscribers.key && check }
									iconPosition="right"
								>
									{ getLabel( accessOptions.paid_subscribers.key ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
			<ConfirmDialog
				onRequestClose={ closeModal }
				cancelButtonText={ __( 'I am not ready', 'jetpack' ) }
				confirmButtonText={ __( 'Get started', 'jetpack' ) }
				isOpen={ showModal }
				onCancel={ closeModal }
				onConfirm={ () => {
					savePost();
					window.location.href = paidLink;
				} }
			>
				<h2>{ __( 'Enable payment collection', 'jetpack' ) }</h2>
				<p>{ __( "You'll need to take the following steps:", 'jetpack' ) }</p>
				<ul>
					{ ! hasNewsletterPlans && (
						<li>
							{ __(
								'Add a paid plan – Set up how much your user will have to pay in order to access your paid content.',
								'jetpack'
							) }
						</li>
					) }
					{ stripeConnectUrl && (
						<li>
							{ __(
								'Connect to Stripe – Set up a Stripe account to securely handle payments.',
								'jetpack'
							) }
						</li>
					) }
				</ul>
			</ConfirmDialog>
			<InspectorControls>
				<PanelBody
					className="jetpack-subscribe-newsletters-panel"
					title={ __( 'Content access', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
					initialOpen={ true }
				>
					<p>
						{ __(
							'Choose who will be able to read the content below the paywall block.',
							'jetpack'
						) }
					</p>
					<PaywallBlockSettings
						accessLevel={ accessLevel }
						setPostMeta={ setPostMeta }
						stripeConnectUrl={ stripeConnectUrl }
						hasNewsletterPlans={ hasNewsletterPlans }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default PaywallEdit;
