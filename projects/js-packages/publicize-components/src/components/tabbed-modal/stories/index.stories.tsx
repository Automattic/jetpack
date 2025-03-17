import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import TabbedModal, { ModalTab, TabbedModalProps } from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Tabbed Modal',
	component: TabbedModal,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta< typeof TabbedModal >;

// Create interactive template with open/close functionality
const Template: StoryFn< typeof TabbedModal > = args => {
	const [ isOpen, setIsOpen ] = useState( false );

	const openModal = useCallback( () => setIsOpen( true ), [] );
	const closeModal = useCallback( () => setIsOpen( false ), [] );

	return (
		<>
			<Button variant="primary" onClick={ openModal }>
				Open Modal
			</Button>
			<TabbedModal { ...args } isOpen={ isOpen } onClose={ closeModal } />
		</>
	);
};

const sampleTabs: ModalTab[] = [
	{
		name: 'tab1',
		title: 'New Share',
		content: (
			<div>
				<h4>First Tab Content</h4>
				<p>This is the content of the first tab. You can put any React components here.</p>
			</div>
		),
	},
	{
		name: 'tab2',
		title: 'Scheduled',
		content: (
			<div>
				<h4>Second Tab Content</h4>
				<p>This is the content of the second tab with different components.</p>
				<Button variant="secondary">Example Button</Button>
			</div>
		),
	},
];

const DefaultArgs: TabbedModalProps = {
	isOpen: false,
	onClose: () => {},
	title: 'Share Post',
	tabs: sampleTabs,
};

// Export Default story
export const Default = Template.bind( {} );
Default.args = DefaultArgs;
