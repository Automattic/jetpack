/*
 * External Dependencies
 */
import React from 'react';
/*
 * Internal Dependencies
 */
import AudioDurationDisplay from '..';

export default {
	title: 'JS Packages/AI Client/Audio Duration Display',
	component: AudioDurationDisplay,
};

const DefaultTemplate = props => {
	return <AudioDurationDisplay { ...props } />;
};

export const _default = DefaultTemplate.bind( {} );
_default.args = {};
