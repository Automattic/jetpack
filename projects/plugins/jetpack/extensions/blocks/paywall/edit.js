import './editor.scss';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { accessOptions } from '../subscriptions/constants';
import { GetAccessLevel } from '../subscriptions/utils';

function PaywallEdit( { className } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const accessLevel = GetAccessLevel( postType );
	const text =
		accessLevel === accessOptions.subscribers.key
			? __( 'Subscribers Only', 'jetpack' )
			: __( 'Paywall', 'jetpack' );
	const style = {
		width: `${ text.length + 1.2 }em`,
	};

	const disabled = accessLevel === accessOptions.everybody.key && (
		<span>{ __( '[Disabled]', 'jetpack' ) }</span>
	);

	return (
		<div className={ className }>
			<span style={ style }>
				{ text } { disabled }
			</span>
		</div>
	);
}

export default PaywallEdit;
