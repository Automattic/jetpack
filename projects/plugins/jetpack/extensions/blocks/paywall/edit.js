import './editor.scss';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { accessOptions, useAccessLevel } from '../../shared/memberships-edit';

function PaywallEdit( { className } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = useAccessLevel( postType );

	const getText = key => {
		switch ( key ) {
			case accessOptions.everybody.key:
				return __( 'Change visibility to enable paywall', 'jetpack' );
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
		<div className={ className }>
			<span style={ style }>{ text }</span>
		</div>
	);
}

export default PaywallEdit;
