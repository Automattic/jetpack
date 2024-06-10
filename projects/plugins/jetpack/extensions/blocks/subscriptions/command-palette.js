import { JetpackLogo } from '@automattic/jetpack-components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useCommandLoader } from '@wordpress/commands';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PlansSetupDialog from '../../shared/components/plans-setup-dialog';
import { accessOptions } from '../../shared/memberships/constants';
import { useSetAccess } from '../../shared/memberships/settings';
import paywallMeta from '../paywall/block.json';

function CommandPalette() {
	const icon = <JetpackLogo height={ 16 } logoColor="#1E1E1E" showText={ false } />;
	const { createInfoNotice } = useDispatch( 'core/notices' );
	const [ showDialog, setShowDialog ] = useState( false );
	const closeDialog = () => setShowDialog( false );
	const setAccess = useSetAccess();
	const { removeBlock, insertBlocks } = useDispatch( blockEditorStore );
	const { getBlocksByName, canRemoveBlock, canInsertBlockType, getBlockCount } =
		useSelect( blockEditorStore );
	const paywallBlockName = paywallMeta.name;

	const { stripeConnectUrl, hasTierPlans } = useSelect( select => {
		const { getNewsletterTierProducts, getConnectUrl } = select( 'jetpack/membership-products' );
		return {
			stripeConnectUrl: getConnectUrl(),
			hasTierPlans: getNewsletterTierProducts()?.length !== 0,
		};
	} );

	function selectAccess( value ) {
		if ( accessOptions.paid_subscribers.key === value && ( stripeConnectUrl || ! hasTierPlans ) ) {
			setShowDialog( true );
			return;
		}
		setAccess( value );
	}

	function removePaywallBlock() {
		const blocks = getBlocksByName( paywallBlockName );

		if ( blocks.length ) {
			const paywall = blocks[ 0 ];
			if ( canRemoveBlock( paywall ) ) {
				removeBlock( paywall );
			}
		}
	}

	function addPaywallBlock() {
		// Check that paywall isn't already placed
		const hasPaywallBlocks = getBlocksByName( paywallBlockName );
		if ( hasPaywallBlocks.length ) {
			return;
		}

		// Check that paywall can be inserted
		if ( ! canInsertBlockType( paywallBlockName ) ) {
			return;
		}

		const paywallBlock = createBlock( paywallBlockName );
		const blocksCount = getBlockCount();

		// When only one block, insert empty paragraph after paywall for easier editing
		const blocks = [ paywallBlock ];
		if ( blocksCount === 1 ) {
			blocks.push( createBlock( 'core/paragraph' ) );
		}

		insertBlocks( blocks, 1 );
	}

	function useSubscriptionsCommandLoader() {
		// Check for editor context
		const { postType, isLoading } = useSelect( select => {
			const { getCurrentPostType } = select( editorStore );

			return {
				postType: getCurrentPostType(),
				isLoading: ! select( editorStore ).hasFinishedResolution( 'getCurrentPostType' ),
			};
		}, [] );

		// Create the commands.
		const commands = useMemo( () => {
			// If postType is defined and not 'post', unregister the block.
			if ( postType !== 'post' ) {
				return [];
			}

			return [
				{
					name: 'jetpack/subscriptions-access-paid',
					label: __( 'Limit post access to paid subscribers', 'jetpack' ),
					icon,
					callback: ( { close } ) => {
						addPaywallBlock();
						selectAccess( accessOptions.paid_subscribers.key );

						createInfoNotice( __( 'Post limited to paid subscribers only.', 'jetpack' ), {
							id: 'jetpack/subscriptions-access-paid/notice',
							type: 'snackbar',
						} );

						close();
					},
				},
				{
					name: 'jetpack/subscriptions-access-subscribers',
					label: __( 'Limit post access to free subscribers', 'jetpack' ),
					icon,
					callback: ( { close } ) => {
						addPaywallBlock();
						selectAccess( accessOptions.subscribers.key );

						createInfoNotice( __( 'Post limited to subscribers only.', 'jetpack' ), {
							id: 'jetpack/subscriptions-access-subscribers/notice',
							type: 'snackbar',
						} );

						close();
					},
				},
				{
					name: 'jetpack/subscriptions-access-everyone',
					label: __( 'Make post accessible to everyone', 'jetpack' ),
					searchLabel: __(
						'Make post accessible to everyone, free and paid subscribers',
						'jetpack'
					),
					icon,
					callback: ( { close } ) => {
						removePaywallBlock();
						selectAccess( accessOptions.everybody.key );

						createInfoNotice( __( 'Post made accesible to everyone.', 'jetpack' ), {
							id: 'jetpack/subscriptions-access-everyone/notice',
							type: 'snackbar',
						} );

						close();
					},
				},
			];
		}, [ postType ] );

		return {
			commands,
			isLoading,
		};
	}

	useCommandLoader( {
		name: 'jetpack/subscriptions-access',
		hook: useSubscriptionsCommandLoader,
	} );

	return <PlansSetupDialog closeDialog={ closeDialog } showDialog={ showDialog } />;
}

export default CommandPalette;
