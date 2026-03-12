import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { BlockControls, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { MenuGroup, MenuItem, PanelBody, ToolbarDropdownMenu } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon, people, check } from '@wordpress/icons';
import ConnectBanner from '../../shared/components/connect-banner';
import PlansSetupDialog from '../../shared/components/plans-setup-dialog';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { NewsletterAccessRadioButtons, useSetAccess } from '../../shared/memberships/settings';
import useIsUserConnected from '../../shared/use-is-user-connected';
import paywallBlockMetadata from './block.json';

function PaywallEdit() {
	const blockProps = useBlockProps();
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const isUserConnected = useIsUserConnected();
	const setAccess = useSetAccess();

	const { stripeConnectUrl, hasTierPlans } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
		};
	} );

	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );

	// Set default access.
	const hasSetDefaultAccess = useRef( false );
	const savedAccessLevel = useSelect( select => {
		const meta = select( editorStore ).getCurrentPostAttribute( 'meta' );
		return meta ? meta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] : undefined;
	} );
	useEffect( () => {
		// Only set default access level if data is loaded and not already set.
		if ( hasSetDefaultAccess.current === false && savedAccessLevel !== undefined ) {
			// Set to "subscribers" if access is "everybody" (paywall + everybody doesn't make sense)
			if ( savedAccessLevel === '' || savedAccessLevel === accessOptions.everybody.key ) {
				setAccess( accessOptions.subscribers.key );
			}

			hasSetDefaultAccess.current = true;
		}
	}, [ setAccess, savedAccessLevel ] );

	// Cleanup on unmount only.
	useEffect( () => {
		return () => {
			const { getBlocks } = window.wp.data.select( 'core/block-editor' );
			const hasPaywallBlock = getBlocks().some( block => block.name === paywallBlockMetadata.name );

			if ( ! hasPaywallBlock ) {
				setAccess( accessOptions.everybody.key );
				hasSetDefaultAccess.current = false;
			}
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

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
						isEditorPanel={ true }
						accessLevel={ _accessLevel }
						stripeConnectUrl={ stripeConnectUrl }
						hasTierPlans={ hasTierPlans }
						postHasPaywallBlock={ true }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default PaywallEdit;
