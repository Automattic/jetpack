import { action } from '@storybook/addon-actions';
import { Icon, mapMarker } from '@wordpress/icons';
import { useState } from 'react';
import { Input, SearchInput } from '..';
import Doc from './Input.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Input',
	component: Input,
	parameters: {
		docs: {
			page: Doc,
		},
	},

	argTypes: {
		size: {
			options: [ 'small', 'large' ],
			control: { type: 'radio' },
		},
		type: {
			options: [ 'text', 'textarea', 'number', 'url', 'email', 'password', 'tel', 'search' ],
			control: { type: 'select' },
		},
	},
} as ComponentMeta< typeof Input >;

const onEnter = value => {
	action( 'onEnter' )( value );
};

const defaultArgs = {
	placeholder: 'Placeholder text',
	disabled: false,
	loading: false,
	size: 'small',
	type: 'text',
	label: '',
};

const Template: ComponentStory< typeof Input > = args => {
	const [ value, setValue ] = useState( '' );
	const onChange = inputValue => {
		setValue( inputValue );
	};

	return <Input { ...args } value={ value } onChange={ onChange } onEnter={ onEnter } />;
};

export const Default = Template.bind( {} );
Default.args = defaultArgs;

export const WithIcon = Template.bind( {} );
WithIcon.args = {
	...defaultArgs,
	icon: <Icon icon={ mapMarker } size={ 24 } />,
};

export const WithLabel = Template.bind( {} );
WithLabel.args = {
	...defaultArgs,
	label: 'My Label',
};

export const TextArea = Template.bind( {} );
TextArea.args = {
	...defaultArgs,
	type: 'textarea',
};

const SearchInputTemplate: ComponentStory< typeof SearchInput > = args => {
	const [ value, setValue ] = useState( '' );
	const onChange = inputValue => {
		setValue( inputValue );
		action( 'onChange' )( inputValue );
	};

	return <SearchInput { ...args } value={ value } onChange={ onChange } onEnter={ onEnter } />;
};

export const Search = SearchInputTemplate.bind( {} );
Search.args = {
	disabled: false,
	loading: false,
	onEnter: action( 'onEnter' ),
	onChange: action( 'onChange' ),
	onSearch: action( 'onSearch' ),
	wait: 500,
};
