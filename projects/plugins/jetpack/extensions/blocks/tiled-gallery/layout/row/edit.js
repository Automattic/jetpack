/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { Text } from 'react-native';

const RowEdit = props => {
	return <InnerBlocks allowedBlocks={ [ 'core/image' ] } template={ [ [ 'core/image' ] ] } />;
};
export default RowEdit;
