/**
 * External dependencies
 */
import React, { Component } from 'react';
import { memoize, pick, shuffle, values } from 'lodash';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import MultipleChoiceAnswer from './answer';
import { FormFieldset, FormLegend } from 'components/forms';

/**
 * Style dependencies
 */
import './style.scss';

const shuffleAnswers = memoize(
	answers => {
		const shuffles = shuffle( answers.filter( ( { doNotShuffle } ) => ! doNotShuffle ) );
		return answers.map( answer => ( answer.doNotShuffle ? answer : shuffles.pop() ) );
	},
	answers =>
		answers.map( answer => values( pick( answer, 'id', 'doNotShuffle' ) ).join( '_' ) ).join( '-' )
);

class MultipleChoiceQuestion extends Component {
	static propTypes = {
		answers: PropTypes.arrayOf(
			PropTypes.shape( {
				id: PropTypes.string.isRequired,
				answerText: PropTypes.string.isRequired,
				doNotShuffle: PropTypes.bool,
				textInput: PropTypes.bool,
				textInputPrompt: PropTypes.string,
				children: PropTypes.object,
			} )
		).isRequired,
		disabled: PropTypes.bool,
		onAnswerChange: PropTypes.func.isRequired,
		question: PropTypes.string.isRequired,
		selectedAnswerId: PropTypes.string,
		selectedAnswerText: PropTypes.string,
	};

	static defaultProps = {
		disabled: false,
		selectedAnswerId: null,
		selectedAnswerText: '',
	};

	constructor( props ) {
		super( props );

		this.handleAnswerChange = this.handleAnswerChange.bind( this );
		this.state = {
			selectedAnswerId: props.selectedAnswerId,
		};
	}

	handleAnswerChange( id, textResponse ) {
		const { onAnswerChange } = this.props;
		onAnswerChange( id, textResponse );
		this.setState( {
			selectedAnswerId: id,
		} );
	}

	render() {
		const { disabled, answers, question, selectedAnswerText } = this.props;

		const { selectedAnswerId } = this.state;

		const shuffledAnswers = shuffleAnswers( answers );

		return (
			<FormFieldset className="multiple-choice-question">
				<FormLegend>{ question }</FormLegend>
				{ shuffledAnswers.map( answer => (
					<MultipleChoiceAnswer
						key={ answer.id }
						answer={ answer }
						disabled={ disabled }
						isSelected={ selectedAnswerId === answer.id }
						onAnswerChange={ this.handleAnswerChange }
						selectedAnswerText={ selectedAnswerId === answer.id ? selectedAnswerText : '' }
					/>
				) ) }
			</FormFieldset>
		);
	}
}

export default MultipleChoiceQuestion;
