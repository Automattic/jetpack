/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AiDisabledPlaceholder from '../../../../shared/components/ai-disabled-placeholder';

/**
 * Stands in for the AI Chat block while Jetpack AI is switched off for the
 * site. The block only follows the master switch, so there is one message.
 *
 * @return {JSX.Element} The placeholder.
 */
export default function DisabledEdit() {
	return (
		<AiDisabledPlaceholder
			label={ __( 'Jetpack AI Search', 'jetpack' ) }
			instructions={ __(
				'Jetpack AI is turned off for this site, so visitors won’t see this block. Turn Jetpack AI on to let visitors ask questions about your content.',
				'jetpack'
			) }
		/>
	);
}
