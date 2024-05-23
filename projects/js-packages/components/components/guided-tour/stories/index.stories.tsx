import { useCallback } from 'react';
import Button from '../../button';
import { GuidedTour } from '../index';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/GuidedTour',
	component: GuidedTour,
	decorators: [ story => <div style={ { padding: '3rem' } }>{ story() }</div> ],
} satisfies Meta< typeof GuidedTour >;

const Template = args => {
	return (
		<div>
			<div className="abc">abc</div>
			<div className="def">def</div>
			<div className="ghi">ghi</div>
			<GuidedTour
				className="guided-tour"
				preferenceName="dashboard-tour"
				tours={ [
					{
						target: '.abc',
						title: 'tour title 1',
						description: 'Some description here.',
					},
					{
						target: '.def',
						title: 'tour title 2',
						description: 'Some description here.',
					},
					{
						target: '.ghi',
						popoverPosition: 'bottom left',
						title: 'tour title 3',
						description: 'Some description here.',
					},
				] }
				isDismissed={ false }
				hasFetched={ true }
				onTourEnd={ () => {
					// eslint-disable-next-line no-console
					console.log( 'Tour ended' );
				} }
				onTourStart={ () => {
					// eslint-disable-next-line no-console
					console.log( 'Tour started' );
				} }
			/>
		</div>
	);
};

export const _Default = Template.bind( {} );
