/* eslint-disable no-alert -- ok for demo */
import { Link } from '@wordpress/ui';
import Button from '../../button/index.tsx';
import Notice from '../index.tsx';

export default {
	title: 'JS Packages/Components/Notice',
	component: Notice,
	argTypes: {
		level: {
			control: {
				type: 'select',
			},
			options: [ 'info', 'success', 'warning', 'error' ],
		},
		hideCloseButton: {
			control: {
				type: 'boolean',
			},
		},
	},
};

const Template = args => <Notice { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	level: 'info',
	title: 'Improve your hovercraft',
	children:
		'Make your hovercraft better with HoverPack; the best hovercraft upgrade kit on the market.',
	onClose: () => alert( 'Close clicked' ),
	actions: [
		<Button key="install" isPrimary>
			Install now
		</Button>,
		<Link openInNewTab key="learn-more" href="https://en.wikipedia.org/wiki/Hovercraft">
			Learn more
		</Link>,
	],
	hideCloseButton: false,
};

export const Warning = Template.bind( {} );
Warning.args = {
	level: 'warning',
	title: 'Your hovercraft is full of eels.',
	children: (
		<div>
			Either your vehicle needs to be cleared, or some kind of translation error has occurred.
		</div>
	),
	actions: [
		<Button key="bail" isPrimary>
			Start Bailing
		</Button>,
		<Link openInNewTab key="learn-more" href="https://en.wikipedia.org/wiki/Hovercraft">
			Learn more
		</Link>,
	],
	hideCloseButton: false,
};

export const Success = Template.bind( {} );
Success.args = {
	level: 'success',
	title: 'Your hovercraft has been upgraded.',
	children: 'Please enjoy your newer, cooler hovercraft.',
	onClose: () => alert( 'Close clicked' ),
	actions: [
		<Button key="start" isPrimary>
			Start crafting
		</Button>,
	],
	hideCloseButton: false,
};

export const Error = Template.bind( {} );
Error.args = {
	level: 'error',
	title: 'The eels have stolen your hovercraft.',
	children:
		'We were unable to remove the eels from your hovercraft. Please contact the authorities, as the eels are armed and dangerous.',
	onClose: () => alert( 'Close clicked' ),
	actions: [
		<Link openInNewTab key="learn-more" href="https://en.wikipedia.org/wiki/Eel">
			Learn more
		</Link>,
	],
	hideCloseButton: false,
};
