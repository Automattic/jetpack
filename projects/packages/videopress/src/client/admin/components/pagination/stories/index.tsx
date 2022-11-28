import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/client-api';
import Pagination from '..';
import Doc from './Pagination.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Pagination',
	component: Pagination,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof Pagination >;

const Template: ComponentStory< typeof Pagination > = args => {
	const [ , updateArgs ] = useArgs();
	const onChangePage = ( newPage: number ) => {
		updateArgs( { currentPage: newPage, disabled: true } );
		action( 'onPageChange' )( newPage );
		setTimeout( () => {
			updateArgs( { disabled: false } );
		}, 500 );
	};

	return <Pagination { ...args } onChangePage={ onChangePage } />;
};

export const _default = Template.bind( {} );
_default.args = {
	currentPage: 1,
	perPage: 10,
	total: 100,
	minColumns: 7,
	disabled: false,
};
