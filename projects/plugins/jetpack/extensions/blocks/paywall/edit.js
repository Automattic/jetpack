import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
	MenuGroup,
	MenuItem,
	PanelBody,
	RadioControl,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon, people, check } from '@wordpress/icons';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { getReachForAccessLevelKey } from '../../shared/memberships/settings';
import { getPaidPlanLink } from '../../shared/memberships/utils';
import { store as membershipProductsStore } from '../../store/membership-products';

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
	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );
	const { savePost } = useDispatch( 'core/editor' );

	useEffect( () => {
		if ( ! accessLevel || accessLevel === accessOptions.everybody.key ) {
			setPostMeta( {
				[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.subscribers.key,
			} );
		}
	}, [ accessLevel, setPostMeta ] );

	function selectAccess( value ) {
		if (
			accessOptions.paid_subscribers.key === value &&
			( stripeConnectUrl || ! hasNewsletterPlans )
		) {
			setShowDialog( true );
			return;
		}
		setPostMeta( {
			[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: value,
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
		userSelect: 'none',
	};

	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);
	let _accessLevel = accessLevel ?? accessOptions.subscribers.key;
	if ( _accessLevel === accessOptions.everybody.key ) {
		_accessLevel = accessOptions.subscribers.key;
	}

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
					icon={ people }
					text={ getLabel( accessLevel ) }
				>
					{ ( { onClose: closeDropdown } ) => (
						<>
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										selectAccess( accessOptions.subscribers.key );
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
										selectAccess( accessOptions.paid_subscribers.key );
										closeDropdown();
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
				onRequestClose={ closeDialog }
				cancelButtonText={ __( 'Not now', 'jetpack' ) }
				confirmButtonText={ __( 'Get started', 'jetpack' ) }
				isOpen={ showDialog }
				onCancel={ closeDialog }
				onConfirm={ () => {
					savePost();
					window.location.href = paidLink;
				} }
			>
				<h2>{ __( 'Enable payments', 'jetpack' ) }</h2>
				<p style={ { maxWidth: 340 } }>
					{ __(
						'To choose this option, you need to create a payment plan, setting up how much your subscribers should pay to access your paid content, and then connect your Stripe account, which is our payments processor.',
						'jetpack'
					) }
				</p>
			</ConfirmDialog>
			<InspectorControls>
				<PanelBody
					className="jetpack-subscribe-newsletters-panel"
					title={ __( 'Content access', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
					initialOpen={ true }
				>
					<RadioControl
						onChange={ selectAccess }
						options={ [
							{
								label: `${ accessOptions.subscribers.label } (${ getReachForAccessLevelKey(
									accessOptions.subscribers.key,
									emailSubscribers,
									paidSubscribers
								) })`,
								value: accessOptions.subscribers.key,
							},
							{
								label: `${ accessOptions.paid_subscribers.label } (${ getReachForAccessLevelKey(
									accessOptions.paid_subscribers.key,
									emailSubscribers,
									paidSubscribers
								) })`,
								value: accessOptions.paid_subscribers.key,
							},
						] }
						selected={ _accessLevel }
						help={ __(
							'Choose who will be able to read the content below the paywall block.',
							'jetpack'
						) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default PaywallEdit;
