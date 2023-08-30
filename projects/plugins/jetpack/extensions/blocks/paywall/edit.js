import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { MenuGroup, MenuItem, PanelBody, ToolbarDropdownMenu } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon, update, check } from '@wordpress/icons';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { Link, PaywallBlockSettings } from '../../shared/memberships/settings';
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
										switchToPaidSubscribers();
									} }
									isSelected={ accessLevel === accessOptions.paid_subscribers.key }
									icon={ accessLevel === accessOptions.paid_subscribers.key && check }
									iconPosition="right"
								>
									{ getLabel( accessOptions.paid_subscribers.key ) }
								</MenuItem>
							</MenuGroup>
							{ accessLevel === accessOptions.paid_subscribers.key &&
								( stripeConnectUrl || ! hasNewsletterPlans ) && (
									<MenuGroup>
										<MenuItem info={ __( 'Enable paid subscribers', 'jetpack' ) }></MenuItem>
										{ stripeConnectUrl && (
											<Link href={ stripeConnectUrl }>
												<MenuItem>{ __( 'Connect to Stripe', 'jetpack' ) }</MenuItem>
											</Link>
										) }
										{ ! hasNewsletterPlans && (
											<Link href={ paidLink }>
												<MenuItem>{ __( 'Add a paid plan', 'jetpack' ) }</MenuItem>
											</Link>
										) }
									</MenuGroup>
								) }
						</>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
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
