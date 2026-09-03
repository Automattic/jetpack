import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { MenuGroup, MenuItem, PanelBody, ToolbarDropdownMenu } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon, people, check } from '@wordpress/icons';
import ConnectBanner from '../../shared/components/connect-banner';
import PlansSetupDialog from '../../shared/components/plans-setup-dialog';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { NewsletterAccessRadioButtons, useSetAccess } from '../../shared/memberships/settings';
import useIsUserConnected from '../../shared/use-is-user-connected';

function PaywallEdit( { clientId } ) {
	const blockProps = useBlockProps();
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const isUserConnected = useIsUserConnected();
	const setAccess = useSetAccess();
	const { getBlock } = useSelect( blockEditorStore );

	// useSetAccess returns a new function every render; the ref keeps the cleanup on unmount only.
	const setAccessRef = useRef( setAccess );
	setAccessRef.current = setAccess;
	useEffect( () => {
		// Reset access level to "everybody" when the paywall block is removed.
		return () => {
			if ( ! getBlock( clientId ) ) {
				setAccessRef.current( accessOptions.everybody.key );
			}
		};
	}, [ clientId, getBlock ] );

	const { stripeConnectUrl, hasTierPlans } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
		};
	} );

	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );

	useEffect( () => {
		// Change the access level from "everybody" to "subscribers" if the user adds a paywall block to a post.
		if ( accessLevel === accessOptions.everybody.key ) {
			setAccess( accessOptions.subscribers.key );
		}
	}, [ accessLevel, setAccess ] );

	function selectAccess( value ) {
		if ( accessOptions.paid_subscribers.key === value && ( stripeConnectUrl || ! hasTierPlans ) ) {
			setShowDialog( true );
			return;
		}
		setAccess( value );
	}

	if ( ! isUserConnected ) {
		return (
			<div { ...blockProps }>
				<ConnectBanner
					block="Paywall"
					explanation={ __(
						'Connect your WordPress.com account to enable a paywall for your site.',
						'jetpack'
					) }
				/>
			</div>
		);
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

	let _accessLevel = accessLevel ?? accessOptions.subscribers.key;
	if ( _accessLevel === accessOptions.everybody.key ) {
		_accessLevel = accessOptions.subscribers.key;
	}

	return (
		<div { ...blockProps }>
			<div className="wp-block-jetpack-paywall-block">
				<span>
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
			<PlansSetupDialog closeDialog={ closeDialog } showDialog={ showDialog } />
			<InspectorControls>
				<PanelBody
					className="jetpack-subscribe-newsletters-panel"
					title={ __( 'Content access', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
					initialOpen={ true }
				>
					<NewsletterAccessRadioButtons
						accessLevel={ _accessLevel }
						stripeConnectUrl={ stripeConnectUrl }
						hasTierPlans={ hasTierPlans }
						postHasPaywallBlock={ true }
						// The block card above this panel already explains the paywall, so the
						// notice would only repeat the heading it sits under.
						explainPaywallConstraint={ false }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default PaywallEdit;
