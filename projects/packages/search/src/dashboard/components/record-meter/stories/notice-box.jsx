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

export const Default = () => (
	<div>
		<NoticeBox
			recordCount={ 1 }
			tierMaximumRecords={ 100 }
			hasBeenIndexed={ true }
			hasValidData={ true }
			hasItems={ true }
		/>
		<p>No notice box should be rendered here; no notice is shown if there are no issues.</p>
	</div>
);

export const NotIndexed = () => (
	<NoticeBox
		recordCount={ 1 }
		tierMaximumRecords={ 100 }
		hasBeenIndexed={ false }
		hasValidData={ true }
		hasItems={ true }
	/>
);

export const InvalidData = () => (
	<NoticeBox
		recordCount={ 1 }
		tierMaximumRecords={ 100 }
		hasBeenIndexed={ true }
		hasValidData={ false }
		hasItems={ true }
	/>
);

export const NoItems = () => (
	<NoticeBox
		recordCount={ 1 }
		tierMaximumRecords={ 100 }
		hasBeenIndexed={ true }
		hasValidData={ true }
		hasItems={ false }
	/>
);

export const NearRecordLimit = () => (
	<NoticeBox
		recordCount={ 99 }
		tierMaximumRecords={ 100 }
		hasBeenIndexed={ true }
		hasValidData={ true }
		hasItems={ true }
	/>
);
