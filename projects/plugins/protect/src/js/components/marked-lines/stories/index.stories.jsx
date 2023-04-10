/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import MarkedLines from '../index.jsx';

export default {
	title: 'Plugins/Protect/Marked Lines',
	component: MarkedLines,
};

export const Default = () => (
	<MarkedLines
		context={ {
			10: 'add :: Num a => a -> a -> a',
			11: 'add = (+)',
			15: 'solve a b = solution',
			16: '	where',
			17: '		solution = sum parts',
			18: '		{- 💩 indices are in UCS-2 code units -}',
			19: '		sum = foldl add 0',
			20: '		parts = foo a b',
			58: '{- lines need not be contiguous -}',
			marks: {
				11: [ [ 6, 9 ] ],
				18: [ [ 23, 28 ] ],
				19: [
					[ 2, 5 ],
					[ 14, 17 ],
				],
			},
		} }
	/>
);
