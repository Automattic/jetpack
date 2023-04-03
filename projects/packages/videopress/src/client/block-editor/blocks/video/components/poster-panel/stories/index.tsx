/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */
import PosterPanel from '..';
import Doc from './PosterPanel.mdx';

export default {
	title: 'Packages/VideoPress/Block Editor/Poster Panel',
	component: PosterPanel,
	parameters: {
		docs: {
			page: Doc,
		},
	},
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
