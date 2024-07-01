import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';
import Pagination from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Pagination',
	component: Pagination,
} as Meta< typeof Pagination >;

const Template: StoryFn< typeof Pagination > = args => {
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
