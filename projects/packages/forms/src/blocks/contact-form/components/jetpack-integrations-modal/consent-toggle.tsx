import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

type ConsentToggleProps = {
	className?: string;
};

const ConsentToggle = ( { className }: ConsentToggleProps ) => {
	const selectedBlock = useSelect( select => select( blockEditorStore ).getSelectedBlock(), [] );
	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );
	const hasEmailBlock = selectedBlock?.innerBlocks?.some(
		( { name }: { name: string } ) => name === 'jetpack/field-email'
	);
	const consentBlock = selectedBlock?.innerBlocks?.find(
		( { name }: { name: string } ) => name === 'jetpack/field-consent'
	);

	const toggleConsent = async () => {
		if ( ! selectedBlock ) {
			return;
		}
		if ( consentBlock ) {
			await removeBlock( consentBlock.clientId, false );
			return;
		}
		const buttonBlockIndex = selectedBlock.innerBlocks.findIndex(
			( { name }: { name: string } ) => name === 'jetpack/button'
		);
		const newConsentBlock = await createBlock( 'jetpack/field-consent' );
		await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
	};

	if ( ! hasEmailBlock ) {
		return null;
	}

	return (
		<div className={ className ?? 'integration-card__section' }>
			<ToggleControl
				label={ __( 'Add email permission request before submit button', 'jetpack-forms' ) }
				checked={ !! consentBlock }
				onChange={ toggleConsent }
				__nextHasNoMarginBottom
			/>
		</div>
	);
};

export default ConsentToggle;
