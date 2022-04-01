/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';

export default function InvalidProductWarning() {
	return (
		<Warning className="product-management-control-nudge">
			<span className="product-management-control-nudge__info">
				{ <Icon icon={ warning } /> }
				<span className="product-management-control-nudge__text-container">
					<span className="product-management-control-nudge__title">
						{ __( 'Invalid subscription configured for this block.', 'jetpack' ) }
					</span>
					<span className="product-management-control-nudge__message">
						{ __(
							'The subscribe button will be hidden from your visitors until you select a valid subscription.',
							'jetpack'
						) }
					</span>
				</span>
			</span>
		</Warning>
	);
}
