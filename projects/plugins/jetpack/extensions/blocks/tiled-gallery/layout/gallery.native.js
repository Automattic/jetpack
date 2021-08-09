import { View } from 'react-native';

export default function Gallery( { children, galleryRef } ) {
	return (
		<View className="tiled-gallery__gallery" ref={ galleryRef }>
			{ children }
		</View>
	);
}
