import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { InspectorControls } from '@wordpress/block-editor';
import { Flex, FlexBlock, PanelBody, PanelRow, Spinner } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PostVisibilityCheck, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon } from '@wordpress/icons';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { NewsletterAccessRadioButtons } from '../../shared/memberships/settings';
import {
	getShowMisconfigurationWarning,
	MisconfigurationWarning,
} from '../../shared/memberships/utils';

function PaywallEdit( { className } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	if ( ! accessLevel || accessLevel === accessOptions.everybody.key ) {
		setPostMeta( { [ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.subscribers.key } );
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
			<InspectorControls>
				<PanelBody
					className="jetpack-subscribe-newsletters-panel"
					title={ __( 'Content visibility', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
					initialOpen={ true }
				>
					<p>
						{ __(
							'Choose who will be able to read the content below the paywall block.',
							'jetpack'
						) }
					</p>
					<PaywallBlockSettings accessLevel={ accessLevel } setPostMeta={ setPostMeta } />
				</PanelBody>
			</InspectorControls>
		</>
	);
}

function PaywallBlockSettings( { accessLevel, setPostMeta } ) {
	const { hasNewsletterPlans, stripeConnectUrl, isLoading } = useSelect( select => {
		const { getNewsletterProducts, getConnectUrl, isApiStateLoading } = select(
			'jetpack/membership-products'
		);
		return {
			isLoading: isApiStateLoading(),
			stripeConnectUrl: getConnectUrl(),
			hasNewsletterPlans: getNewsletterProducts()?.length !== 0,
		};
	} );

	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );

	if ( isLoading ) {
		return (
			<Flex direction="column" align="center">
				<Spinner />
			</Flex>
		);
	}

	let _accessLevel = accessLevel ?? accessOptions.subscribers.key;
	if ( _accessLevel === accessOptions.everybody.key ) {
		_accessLevel = accessOptions.subscribers.key;
	}

	const accessLabel = accessOptions[ _accessLevel ]?.label;

	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<Flex direction="column">
						{ showMisconfigurationWarning && <MisconfigurationWarning /> }
						<FlexBlock direction="row" justify="flex-start">
							{ canEdit && (
								<div className="editor-post-visibility">
									<NewsletterAccessRadioButtons
										isEditorPanel={ true }
										onChange={ setPostMeta }
										accessLevel={ _accessLevel }
										stripeConnectUrl={ stripeConnectUrl }
										hasNewsletterPlans={ hasNewsletterPlans }
										paywallBlockSettings={ true }
									/>
								</div>
							) }

							{ /* Display the uneditable access level when the user doesn't have edit privileges*/ }
							{ ! canEdit && <span>{ accessLabel }</span> }
						</FlexBlock>
					</Flex>
				</PanelRow>
			) }
		/>
	);
}

export default PaywallEdit;
