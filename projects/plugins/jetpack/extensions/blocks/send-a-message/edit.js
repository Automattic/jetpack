/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';

export default function SendAMessageEdit( { className, setAttributes, context } ) {
	// Default template is single WhatsApp block until we offer
	// more services
	const DEFAULT_TEMPLATE = [ [ 'jetpack/whatsapp-button', {} ] ];
	const ALLOWED_BLOCKS = [ 'jetpack/whatsapp-button' ];

	// This needs to get refactored out somewhere so that it is automatically applied to
	// all paid blocks, and does not run on every render.
	const availability = getJetpackExtensionAvailability( 'send-a-message' );
	const hasOwnUpgradeNudge =
		! availability.available && availability.unavailableReason === 'missing_plan';

	const isUpgradeNudgeDisplayed = context[ 'jetpack/isUpgradeNudgeDisplayed' ];

	setAttributes( { shouldDisplayUpgradeNudge: ! isUpgradeNudgeDisplayed && hasOwnUpgradeNudge } );
	setAttributes( { isUpgradeNudgeDisplayed: isUpgradeNudgeDisplayed || hasOwnUpgradeNudge } );

	return (
		<div className={ className }>
			<InnerBlocks template={ DEFAULT_TEMPLATE } allowedBlocks={ ALLOWED_BLOCKS } />
		</div>
	);
}
