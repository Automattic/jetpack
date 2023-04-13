import React from 'react';
import { NoticeBox } from '../notice-box';

export default {
	title: 'Packages/Search/RecordMeter/NoticeBox',
	component: NoticeBox,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 750 } }>
				<Story />
			</div>
		),
	],
};

export const Default = args => (
	<div>
		<NoticeBox { ...args } />
		<p>No notice box should be rendered here; no notice is shown if there are no issues.</p>
	</div>
);
Default.args = {
	recordCount: 1,
	tierMaximumRecords: 100,
	hasBeenIndexed: true,
	hasValidData: true,
	hasItems: true,
};

const Template = args => <NoticeBox { ...args } />;

export const NotIndexed = Template.bind( {} );
NotIndexed.args = {
	recordCount: 1,
	tierMaximumRecords: 100,
	hasBeenIndexed: false,
	hasValidData: true,
	hasItems: true,
};

export const InvalidData = Template.bind( {} );
InvalidData.args = {
	recordCount: 1,
	tierMaximumRecords: 100,
	hasBeenIndexed: true,
	hasValidData: false,
	hasItems: true,
};

export const NoItems = Template.bind( {} );
NoItems.args = {
	recordCount: 1,
	tierMaximumRecords: 100,
	hasBeenIndexed: true,
	hasValidData: true,
	hasItems: false,
};

export const NearRecordLimit = Template.bind( {} );
NearRecordLimit.args = {
	recordCount: 99,
	tierMaximumRecords: 100,
	hasBeenIndexed: true,
	hasValidData: true,
	hasItems: true,
};
