import { __ } from '@wordpress/i18n';
import './editor.scss';

function PaywallEdit( { className } ) {
	const text = __( 'Paywall', 'jetpack' );
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
