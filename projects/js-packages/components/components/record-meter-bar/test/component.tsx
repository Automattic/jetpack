import { render, queryByAttribute } from '@testing-library/react';
import React from 'react';
import RecordMeterBar, { RecordMeterBarProps } from '../index';

const getRecordBarItems = ( container: HTMLElement ) => {
	// eslint-disable-next-line testing-library/no-node-access
	return queryByAttribute( 'class', container, 'record-meter-bar__items' ).children;
};

const getRecordBarLegendItems = ( container: HTMLElement ) => {
	// eslint-disable-next-line testing-library/no-node-access
	return queryByAttribute( 'class', container, 'record-meter-bar__legend--items' ).children;
};

describe( 'RecordMeterBar', () => {
	const testProps: RecordMeterBarProps = {
		items: [
			{ count: 18, label: 'Posts', backgroundColor: '#00BA37' },
			{ count: 30, label: 'Plugins', backgroundColor: '#3895BA' },
			{ count: 52, label: 'Comments', backgroundColor: '#E68B28' },
			{ count: 24, label: 'Authors', backgroundColor: '#3859BA' },
		],
	};
	it( 'renders nothing when no items are passed', () => {
		const { container } = render( <RecordMeterBar items={ [] } /> );

		expect( getRecordBarItems( container ) ).toHaveLength( 0 );
	} );

	it( 'renders the bar when NO totalCount is passed', () => {
		const { container } = render( <RecordMeterBar { ...testProps } /> );

		expect( getRecordBarItems( container ) ).toHaveLength( 4 );
	} );

	it( 'renders the bar when totalCount IS passed', () => {
		const { container } = render( <RecordMeterBar { ...testProps } totalCount={ 200 } /> );

		expect( getRecordBarItems( container ) ).toHaveLength( 4 );
	} );

	it( 'renders the legend when NO totalCount is passed', () => {
		const { container } = render( <RecordMeterBar { ...testProps } /> );

		expect( getRecordBarLegendItems( container ) ).toHaveLength( 4 );
	} );

	it( 'renders the legend when totalCount IS passed', () => {
		const { container } = render( <RecordMeterBar { ...testProps } totalCount={ 200 } /> );

		expect( getRecordBarLegendItems( container ) ).toHaveLength( 4 );
	} );
} );
