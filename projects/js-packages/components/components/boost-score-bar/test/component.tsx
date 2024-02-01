/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import BoostScoreBar from '..';
import type { BoostScoreBarProps } from '../types';

describe( 'BoostScrollBar', () => {
	const defaultProps: BoostScoreBarProps = {
		score: 80,
		prevScore: 60,
		scoreBarType: 'desktop',
		active: true,
		showPrevScores: true,
		isLoading: false,
		noBoostScoreTooltip: 'Test tooltip text',
	};

	it( 'renders the boost scroll bar when active is true', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } /> );

		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveAttribute( 'class', 'jb-score-bar jb-score-bar--desktop' );
	} );

	it( 'does not render the boost scroll bar when active is false', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } active={ false } /> );

		// eslint-disable-next-line testing-library/no-node-access
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render the tooltip when noBoostScoreTooltip is not provided', () => {
		render( <BoostScoreBar { ...defaultProps } noBoostScoreTooltip={ undefined } /> );

		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the tooltip with the correct text when noBoostScoreTooltip is provided', () => {
		render( <BoostScoreBar { ...defaultProps } /> );

		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Test tooltip text' );
	} );

	it( 'displays loading spinner when isLoading is true', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } isLoading={ true } /> );

		expect( container.querySelector( '.jb-score-bar__loading' ) ).toBeInTheDocument();
	} );

	it( 'does not display loading spinner when isLoading is false', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } /> );

		expect( container.querySelector( '.jb-score-bar__loading' ) ).not.toBeInTheDocument();
	} );

	it( 'renders mobile icon and text when scoreBarType is mobile', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } scoreBarType="mobile" /> );

		expect( screen.getByText( 'Mobile score' ) ).toBeInTheDocument();
		expect( container.querySelector( '.gridicons-phone' ) ).toBeInTheDocument();
	} );

	it( 'renders desktop icon and text when scoreBarType is desktop', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } /> );

		expect( screen.getByText( 'Desktop score' ) ).toBeInTheDocument();
		expect( container.querySelector( '.gridicons-computer' ) ).toBeInTheDocument();
	} );

	it( 'renders previous scores when showPrevScores is true', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } /> );

		const previousScoreContainer = container.querySelector( '.jb-score-bar__no_boost_score' );

		expect( previousScoreContainer ).toBeInTheDocument();
		expect( previousScoreContainer ).toHaveTextContent( '60' );
	} );

	it( 'does not render previous scores when showPrevScores is false', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } showPrevScores={ false } /> );

		expect( container.querySelector( '.jb-score-bar__no_boost_score' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the correct score bar class when score is < 50', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } score={ 40 } /> );

		expect( container.querySelector( '.fill-bad' ) ).toBeInTheDocument();
	} );

	it( 'renders the correct score bar class when score is >= 50 and < 71', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } score={ 60 } /> );

		expect( container.querySelector( '.fill-mediocre' ) ).toBeInTheDocument();
	} );

	it( 'renders the correct score bar class when score is > 70', () => {
		const { container } = render( <BoostScoreBar { ...defaultProps } /> );

		expect( container.querySelector( '.fill-good' ) ).toBeInTheDocument();
	} );
} );
