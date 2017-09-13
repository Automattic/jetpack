'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */
var __ = wp.i18n.__;
var _wp$blocks = wp.blocks,
    registerBlockType = _wp$blocks.registerBlockType,
    Editable = _wp$blocks.Editable,
    _wp$blocks$source = _wp$blocks.source,
    children = _wp$blocks$source.children,
    query = _wp$blocks$source.query;
var Button = wp.components.Button;


registerBlockType('jetpack/quiz', {
	title: __('Quiz'),
	icon: 'lightbulb',
	category: 'common',
	attributes: {
		question: children('.jetpack-quiz-question'),
		answers: {
			type: 'array',
			source: query('.jetpack-quiz-answer-text', children()),
			default: [[], []]
		},
		explanations: {
			type: 'array',
			source: query('.jetpack-quiz-explanation', children()),
			default: [[], []]
		},
		choices: {
			type: 'number',
			default: 2
		},
		correct: {
			type: 'number',
			default: -1
		}
	},
	edit: function edit(props) {
		var _props$attributes = props.attributes,
		    question = _props$attributes.question,
		    answers = _props$attributes.answers,
		    explanations = _props$attributes.explanations,
		    choices = _props$attributes.choices,
		    correct = _props$attributes.correct,
		    setAttributes = props.setAttributes,
		    setFocus = props.setFocus,
		    focus = props.focus;

		var focusedEditable = focus ? focus.editable || 'question' : null;

		var onChangeQuestion = function onChangeQuestion(value) {
			setAttributes({ question: value });
		};
		var onFocusQuestion = function onFocusQuestion(focused) {
			setFocus(_.extend({}, focused, { editable: 'question' }));
		};

		var addNewAnswer = function addNewAnswer() {
			setAttributes({ choices: choices + 1 });
		};

		return wp.element.createElement(
			'div',
			{ className: props.className + ' jetpack-quiz' },
			wp.element.createElement(Editable, {
				tagName: 'div',
				multiline: false,
				formattingControls: [],
				className: 'gutenpack-quiz-question jetpack-quiz-question',
				placeholder: __('Write the question here'),
				value: question,
				onChange: onChangeQuestion,
				focus: focusedEditable === 'question',
				onFocus: onFocusQuestion
			}),
			_.times(choices, function (index) {
				return wp.element.createElement(
					'div',
					{ key: 'gutenpack-quiz-choice-' + index },
					wp.element.createElement(Editable, {
						tagName: 'div',
						multiline: false,
						formattingControls: [],
						className: 'gutenpack-quiz-answer jetpack-quiz-answer',
						placeholder: __('Add an answer'),
						value: answers && answers[index],
						onChange: function onChange(value) {
							setAttributes({
								answers: [].concat((0, _toConsumableArray3['default'])(answers.slice(0, index)), [value], (0, _toConsumableArray3['default'])(answers.slice(index + 1)))
							});
						},
						focus: focus && focus.answer === index,
						onFocus: function onFocus() {
							return setFocus({ answer: index });
						}
					}),
					wp.element.createElement(
						'label',
						{ htmlFor: 'gutenpack-quiz-radio-' + index },
						wp.element.createElement('input', {
							id: 'gutenpack-quiz-radio-' + index,
							type: 'radio',
							name: 'correct',
							value: index,
							checked: correct && correct === index ? 'checked' : '',
							onChange: function onChange() {
								setAttributes({ correct: index });
							}
						}),
						__('Correct')
					),
					wp.element.createElement(Editable, {
						tagName: 'div',
						multiline: false,
						className: 'gutenpack-quiz-explanation jetpack-quiz-explanation',
						placeholder: __('and its explanation'),
						value: explanations && explanations[index],
						onChange: function onChange(value) {
							setAttributes({
								explanations: [].concat((0, _toConsumableArray3['default'])(explanations.slice(0, index)), [value], (0, _toConsumableArray3['default'])(explanations.slice(index + 1)))
							});
						},
						focus: focus && focus.explanation === index,
						onFocus: function onFocus() {
							return setFocus({ explanation: index });
						}
					})
				);
			}),
			wp.element.createElement(
				Button,
				{
					className: 'button',
					onClick: addNewAnswer
				},
				__('Add new answer')
			)
		);
	},
	save: function save(props) {
		var _props$attributes2 = props.attributes,
		    question = _props$attributes2.question,
		    answers = _props$attributes2.answers,
		    explanations = _props$attributes2.explanations,
		    choices = _props$attributes2.choices,
		    correct = _props$attributes2.correct;

		return wp.element.createElement(
			'div',
			{ className: 'jetpack-quiz quiz' },
			wp.element.createElement(
				'div',
				{ className: 'jetpack-quiz-question question' },
				question
			),

			// add data-correct="1" if it's the right one
			_.times(choices, function (index) {
				return answers && answers[index] && wp.element.createElement(
					'div',
					{
						key: 'gutenpack-quiz-choice-' + index,
						className: 'jetpack-quiz-answer',
						'data-correct': correct && correct === index ? '1' : '0'
					},
					wp.element.createElement(
						'div',
						{ className: 'jetpack-quiz-answer-text' },
						answers[index]
					),
					explanations && explanations[index] && wp.element.createElement(
						'div',
						{ className: 'jetpack-quiz-explanation' },
						explanations[index]
					)
				);
			})
		);
	}
});