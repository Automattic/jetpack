import { useCallback } from 'react';
import Button from '../../button';
import { GlobalNotices, useGlobalNotices } from '../index';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/GlobalNotices',
	component: GlobalNotices,
	decorators: [ story => <div style={ { padding: '3rem' } }>{ story() }</div> ],
} satisfies Meta< typeof GlobalNotices >;

const Template = args => {
	const { createErrorNotice, createSuccessNotice, createInfoNotice, createWarningNotice } =
		useGlobalNotices();

	return (
		<div>
			<GlobalNotices { ...args } />
			<div style={ { display: 'flex', alignItems: 'start', gap: '1rem', flexDirection: 'column' } }>
				<Button
					onClick={ useCallback( () => {
						createSuccessNotice( 'This is a success notice' );
					}, [ createSuccessNotice ] ) }
				>
					Create Success Notice
				</Button>
				<Button
					onClick={ useCallback( () => {
						createErrorNotice( 'This is an error notice' );
					}, [ createErrorNotice ] ) }
				>
					Create Error Notice
				</Button>
				<Button
					onClick={ useCallback( () => {
						createInfoNotice( 'This is an info notice' );
					}, [ createInfoNotice ] ) }
				>
					Create Info Notice
				</Button>
				<Button
					onClick={ useCallback( () => {
						createWarningNotice( 'This is a warning notice' );
					}, [ createWarningNotice ] ) }
				>
					Create Warning Notice
				</Button>
			</div>
		</div>
	);
};

export const _Default = Template.bind( {} );
