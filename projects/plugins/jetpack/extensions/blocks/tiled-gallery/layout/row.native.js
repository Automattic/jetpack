/**
 * External dependencies
 */
import classnames from 'classnames';
import { View } from 'react-native';
export default function Row( { children, className } ) {
	return <View className={ classnames( 'tiled-gallery__row', className ) }>{ children }</View>;
}
