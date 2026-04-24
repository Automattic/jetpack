/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import {
	CheckboxControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useFileBrowserContext } from './file-browser-context';

/**
 *
 * @param root0
 * @param root0.rewindId
 */
function FileBrowserHeader( { rewindId }: { rewindId: string } ) {
	const { fileBrowserState } = useFileBrowserContext();
	const { getNode, getCheckList, setNodeCheckState } = fileBrowserState;
	const rewindIdNum = Number( rewindId );
	const rootNode = getNode( '/', rewindIdNum );
	const browserCheckList = getCheckList( rewindIdNum );

	const onCheckboxChange = useCallback( () => {
		const newCheckState = rootNode && rootNode.checkState === 'unchecked' ? 'checked' : 'unchecked';
		setNodeCheckState( '/', newCheckState, rewindIdNum );
	}, [ rootNode, setNodeCheckState, rewindIdNum ] );

	return (
		<VStack className="file-browser-header">
			<HStack className="file-browser-header__selecting" justify="flex-start" spacing={ 0 }>
				<CheckboxControl
					__nextHasNoMarginBottom
					checked={ rootNode ? rootNode.checkState === 'checked' : false }
					indeterminate={ rootNode?.checkState === 'mixed' }
					onChange={ onCheckboxChange }
				/>
				<Text size="small">
					{ browserCheckList.totalItems } { __( 'files selected', 'jetpack-backup-pkg' ) }
				</Text>
			</HStack>
		</VStack>
	);
}

export default FileBrowserHeader;
