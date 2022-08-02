import {
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function PaymentsIntroPatternPicker( { onBlockPatternSelect, patternFilter } ) {
	const [ isPatternSelectionModalOpen, setIsPatternSelectionModalOpen ] = useState( false );

	if ( ! BlockPatternSetup ) {
		return null;
	}
	return (
		<>
			<Button
				variant="primary"
				onClick={ () => setIsPatternSelectionModalOpen( true ) }
				className="wp-payments-intro-pattern-picker__opener"
			>
				{ __( 'Choose a pattern', 'jetpack' ) }
			</Button>
			{ isPatternSelectionModalOpen && (
				<Modal
					className="wp-block-jetpack-payments-intro__pattern-picker__selection-modal"
					title={ __( 'Choose a pattern', 'jetpack' ) }
					closeLabel={ __( 'Cancel', 'jetpack' ) }
					onRequestClose={ () => setIsPatternSelectionModalOpen( false ) }
				>
					<BlockPatternSetup
						onBlockPatternSelect={ onBlockPatternSelect }
						filterPatternsFn={ patternFilter }
					/>
				</Modal>
			) }
		</>
	);
}
