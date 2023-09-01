/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import { Button } from '@wordpress/components';
import React from 'react';
/**
 * Internal dependencies
 */
import useMediaRecording from '../';
/**
 * Types
 */
import type { Meta } from '@storybook/react';

const RecorderComponent = () => {
	const { start, pause, resume, stop, state } = useMediaRecording( {
		onDone: ( blob: Blob ) => action( 'onDone' )( { size: blob.size, type: blob.type } ),
	} );

	return (
		<div style={ { display: 'flex', flexDirection: 'row', gap: '1px' } }>
			<Button variant="primary" onClick={ start } disabled={ state !== 'inactive' }>
				Begin recording
			</Button>

			<Button variant="primary" onClick={ pause } disabled={ state !== 'recording' }>
				Pause
			</Button>

			<Button variant="primary" onClick={ resume } disabled={ state !== 'paused' }>
				Resume
			</Button>

			<Button variant="primary" onClick={ stop } disabled={ state === 'inactive' }>
				Stop
			</Button>
		</div>
	);
};

export default {
	title: 'JS Packages/AI Client/useMediaRecording',
	component: RecorderComponent,
} as Meta< typeof RecorderComponent >;

const Template = () => <RecorderComponent />;

const DefaultArgs = {};

export const Default = Template.bind( {} );
Default.args = DefaultArgs;
