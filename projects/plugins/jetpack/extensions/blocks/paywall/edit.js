import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';

function PaywallEdit( { className } ) {
	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Paywall', 'jetpack' ) }
				instructions={ __( 'Instructions go here.', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
			>
				{ __( 'User input goes here?', 'jetpack' ) }
			</Placeholder>
		</div>
	);
}

export default PaywallEdit;
