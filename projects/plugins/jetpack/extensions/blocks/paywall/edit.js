import './editor.scss';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowDown, Icon } from '@wordpress/icons';
import {
	accessOptions,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
} from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { PaywallBlockSettings } from '../../shared/memberships/settings';

function PaywallEdit( { className } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );
	const [ , setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	useEffect( () => {
		if ( ! accessLevel || accessLevel === accessOptions.everybody.key ) {
			setPostMeta( {
				[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: accessOptions.subscribers.key,
			} );
		}
	}, [ accessLevel, setPostMeta ] );

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

export default PaywallEdit;
