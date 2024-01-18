import React from 'react';

interface ThumbnailProps {
	url?: string;
	title?: string;
	width: number;
	height: number;
}

const Thumbnail: React.FC< ThumbnailProps > = ( { url, title, width, height } ) => {
	const thumbnailStyle = {
		'--thumbnail-size': `${ width }px`,
	} as React.CSSProperties;

	return url && title ? (
		<img
			src={ url }
			alt={ title }
			width={ width }
			height={ height }
			className="jb-thumbnail__image"
		/>
	) : (
		<div className="jb-thumbnail__placeholder" style={ thumbnailStyle } />
	);
};

export default Thumbnail;
