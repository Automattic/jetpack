import Status from '..';

export default {
	title: 'JS Packages/Components/Status',
	component: Status,
	parameters: {
		layout: 'centered',
	},
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Active = args => {
	return <Status status="active" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Error = args => {
	return <Status status="error" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ActionNeeded = args => {
	return <Status status="action" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Initializing = args => {
	return <Status status="initializing" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Inactive = args => {
	return <Status status="inactive" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CustomLabel = args => {
	return <Status label="Code is poetry" />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NoLabel = args => {
	return <Status status="active" label="" />;
};
