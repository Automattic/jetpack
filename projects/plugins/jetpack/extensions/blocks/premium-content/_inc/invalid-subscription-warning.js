/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Icon, warning } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default () => (
	<Warning className="premium-content-block-nudge">
		<span className="premium-content-block-nudge__info">
			{ <Icon icon={ warning } /> }
			<span className="premium-content-block-nudge__text-container">
				<span className="premium-content-block-nudge__title">
					{ __( 'Invalid subscription configured for this block.', 'jetpack' ) }
				</span>
				<span className="premium-content-block-nudge__message">
					{ __(
						'The subscribe button will be hidden from your visitors until you select a valid subscription.',
						'jetpack'
					) }
				</span>
			</span>
		</span>
	</Warning>
);
