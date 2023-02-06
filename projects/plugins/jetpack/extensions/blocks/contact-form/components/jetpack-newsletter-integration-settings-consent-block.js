import { createBlock } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const useInsertConsentBlock = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );
	const { insertBlock } = useDispatch( 'core/block-editor' );

	const insertConsentBlock = useCallback( async () => {
		let buttonBlockIndex = ( selectedBlock.innerBlocks ?? [] ).findIndex(
			( { name } ) => name === 'jetpack/button'
		);
		if ( buttonBlockIndex === -1 ) {
			buttonBlockIndex = ( selectedBlock.innerBlocks ?? [] ).length;
		}

		const newConsentBlock = await createBlock( 'jetpack/field-consent' );
		await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
	}, [ insertBlock, selectedBlock.clientId, selectedBlock.innerBlocks ] );

	return { insertConsentBlock };
};

const NoConsentBlockSettings = () => {
	const { insertConsentBlock } = useInsertConsentBlock();

	return (
		<>
			<p>
				{ __(
					'You’re already collecting email contacts. Why not make sure you have permission to email them too?',
					'jetpack'
				) }
			</p>
			<Button variant="secondary" onClick={ insertConsentBlock } style={ { marginBottom: '1em' } }>
				{ __( 'Add email permission request', 'jetpack' ) }
			</Button>
			<br />
		</>
	);
};

const shouldHaveConsentBlockSelector = innerBlocks => {
	const hasEmailBlock = innerBlocks.some( ( { name } ) => name === 'jetpack/field-email' );
	const hasConsentBlock = innerBlocks.some( ( { name } ) => name === 'jetpack/field-consent' );
	if ( hasEmailBlock ) {
		return ! hasConsentBlock;
	}
	return false;
};

const ConsentBlockSettings = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );
	const shouldHaveConsentBlock = useMemo(
		() => shouldHaveConsentBlockSelector( selectedBlock.innerBlocks ),
		[ selectedBlock.innerBlocks ]
	);

	if ( shouldHaveConsentBlock ) {
		return <NoConsentBlockSettings />;
	}

	return null;
};

export default ConsentBlockSettings;
