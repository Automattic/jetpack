import React, { useState } from 'react';
import PosterPanel, { VideoHoverPreviewControl } from '..';

export default {
	title: 'Packages/VideoPress/Block Editor/Poster Panel',
	component: PosterPanel,
	argTypes: {},
};

const DefaultTemplate = args => {
	const [ attributes, setAttributes ] = React.useState( {
		poster: args.poster,
		videoRatio: args.videoRatio,
		guid: args.guid,
	} );

	const setAttributesHandler = newAttributes => {
		setAttributes( { ...attributes, ...newAttributes } );
	};

	return (
		<PosterPanel
			attributes={ attributes }
			setAttributes={ setAttributesHandler }
			isGeneratingPoster={ false }
		/>
	);
};

export const _default = DefaultTemplate.bind( {} );
_default.args = {
	poster: 'https://jetpackme.files.wordpress.com/2018/04/cropped-jetpack-favicon-2018.png',
	videoRatio: 60,
	guid: 'ezoR6kzb',
};

const VideoHoverPreviewControlTemplate = args => {
	const [ previewOnHover, setPreviewOnHover ] = useState( true );
	const [ , setPreviewAt ] = useState( args.previewAtTime );
	const [ , setLoopDuraton ] = useState( args.loopDuration );
	const setPreviewAtHandler = newPreviewAt => {
		setPreviewAt( newPreviewAt );
		console.log( { newPreviewAt } ); // eslint-disable-line no-console
	};

	return (
		<VideoHoverPreviewControl
			{ ...args }
			previewOnHover={ previewOnHover }
			onPreviewAtTimeChange={ setPreviewAtHandler }
			onLoopDurationChange={ setLoopDuraton }
			onPreviewOnHoverChange={ setPreviewOnHover }
		/>
	);
};

export const VideoHoverPreviewControlStory = VideoHoverPreviewControlTemplate.bind( {} );
VideoHoverPreviewControlStory.args = {
	previewAtTime: 0,
	loopDuration: 2300,
	videoDuration: 80000, // 80 seconds
};

VideoHoverPreviewControlStory.storyName = 'VideoHoverPreviewControl';
