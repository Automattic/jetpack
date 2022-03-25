/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import RecordMeterBar, { RecordMeterBarProps } from '../index';

describe( 'RecordMeterBar', () => {
	const testProps: RecordMeterBarProps = {
		items: [
			{ count: 18, label: 'Posts', backgroundColor: '#00BA37' },
			{ count: 30, label: 'Plugins', backgroundColor: '#3895BA' },
			{ count: 52, label: 'Comments', backgroundColor: '#E68B28' },
			{ count: 24, label: 'Authors', backgroundColor: '#3859BA' },
		],
	};

	const renderer = ShallowRenderer.createRenderer();

	it( 'renders nothing when no items are passed', () => {
		renderer.render( <RecordMeterBar items={ [] } /> );

		expect( renderer.getRenderOutput() ).to.be.equal( null );
	} );

	it( 'renders the bar when NO totalCount is passed', () => {
		renderer.render( <RecordMeterBar { ...testProps } /> );
		const wrapper = shallow( renderer.getRenderOutput() );

		expect( wrapper.find( '.record-meter-bar__items' ).render().children().length ).to.be.equal(
			4
		);
	} );

	it( 'renders the bar when totalCount IS passed', () => {
		renderer.render( <RecordMeterBar { ...testProps } totalCount={ 200 } /> );
		const wrapper = shallow( renderer.getRenderOutput() );

		expect( wrapper.find( '.record-meter-bar__items' ).render().children().length ).to.be.equal(
			4
		);
	} );

	it( 'renders the legend when NO totalCount is passed', () => {
		renderer.render( <RecordMeterBar { ...testProps } /> );
		const wrapper = shallow( renderer.getRenderOutput() );

		expect(
			wrapper.find( '.record-meter-bar__legend--items' ).render().children().length
		).to.be.equal( 4 );
	} );

	it( 'renders the legend when totalCount IS passed', () => {
		renderer.render( <RecordMeterBar { ...testProps } totalCount={ 200 } /> );
		const wrapper = shallow( renderer.getRenderOutput() );

		expect(
			wrapper.find( '.record-meter-bar__legend--items' ).render().children().length
		).to.be.equal( 4 );
	} );
} );
