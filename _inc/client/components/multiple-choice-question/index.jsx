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
import { FormFieldset } from 'components/forms';

/**
 * Style dependencies
 */
import './style.scss';

const shuffleAnswers = memoize(
	answers => {
		const shuffles = shuffle( answers.filter( ( { doNotShuffle } ) => ! doNotShuffle ) );
		return answers.map( answer => ( answer.doNotShuffle ? answer : shuffles.pop() ) );
	},
	// this creates a unique id for the set for answers give to the question so that any change that would
	// require a reshuffle gets one. Will resemble: "answer1_false-answer2_false-answer3_true"
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
		subHeader: PropTypes.string,
	};

	static defaultProps = {
		disabled: false,
		selectedAnswerId: null,
		selectedAnswerText: '',
	};

	constructor( props ) {
		super( props );

		this.state = {
			selectedAnswerId: props.selectedAnswerId,
		};
	}

	handleAnswerChange = ( id, textResponse ) => {
		const { onAnswerChange } = this.props;
		onAnswerChange( id, textResponse );
		this.setState( {
			selectedAnswerId: id,
		} );
	};

	render() {
		const { disabled, answers, question, selectedAnswerText, subHeader } = this.props;

		const { selectedAnswerId } = this.state;

		const shuffledAnswers = shuffleAnswers( answers );

		return (
			<FormFieldset className="multiple-choice-question">
				<h2 className="multiple-choice-question__question">{ question }</h2>
				{ subHeader && <h3 className="multiple-choice-question__subheader">{ subHeader }</h3> }
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
