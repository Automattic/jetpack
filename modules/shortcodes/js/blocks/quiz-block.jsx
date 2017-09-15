/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */
const { __ } = wp.i18n;
const {
	registerBlockType,
	Editable,
	InspectorControls,
	InspectorControls: {
		TextareaControl
	},
	BlockDescription,
	source: {
		children,
		query
	}
} = wp.blocks;
const {
	Button
} = wp.components;

registerBlockType( 'jetpack/quiz', {
	title: __( 'Quiz' ),
	icon: 'lightbulb',
	category: 'common',
	attributes: {
		question: children( '.jetpack-quiz-question' ),
		correct: children( '.jetpack-quiz-correct-answer-text' ),
		answers: {
			type: 'array',
			source: query( '.jetpack-quiz-answer-text', children() ),
			default: [ [], [] ],
		},
		explanations: {
			type: 'array',
			source: query( '.jetpack-quiz-explanation', children() ),
			default: [ [], [] ],
		},
		choices: {
			type: 'number',
			default: 2,
		}
	},
	edit: props => {
		const {
			attributes: {
				question,
				answers,
				explanation,
				choices,
				correct
			},
			setAttributes,
			setFocus,
			focus
		} = props;
		const focusedEditable = focus ? focus.editable || 'question' : null;

		const onChangeQuestion = value => {
			setAttributes( { question: value } );
		};
		const onFocusQuestion = focused => {
			setFocus( _.extend( {}, focused, { editable: 'question' } ) );
		};

		const onChangeCorrect = value => {
			setAttributes( { correct: value } );
		};
		const onFocusCorrect = focused => {
			setFocus( _.extend( {}, focused, { editable: 'correct' } ) );
		};

		const changeExplanation = value => {
			setAttributes( { explanation: value } );
		};

		const addNewAnswer = () => {
			setAttributes( { choices: choices + 1 } );
		};

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Create a quiz with one correct answer and two or more incorrect answers.' ) }</p>
					</BlockDescription>
					<h3>{ __( 'Quiz Settings' ) }</h3>
					<TextareaControl
						multiline={ true }
						label={ __( 'Explanation for the correct answer' ) }
						type="string"
						value={ explanation }
						onChange={ ( value ) => changeExplanation( value ) }
					/>
				</InspectorControls>
			),
			<div className={ props.className + ' jetpack-quiz' }>
				<Editable
					tagName="h2"
					multiline={ false }
					formattingControls={ [] }
					className="gutenpack-quiz-question jetpack-quiz-question"
					placeholder={ __( 'Write the question here' ) }
					value={ question }
					onChange={ onChangeQuestion }
					focus={ focusedEditable === 'question' }
					onFocus={ onFocusQuestion }
				/>

				<Editable
					tagName="div"
					multiline={ false }
					formattingControls={ [] }
					className="gutenpack-quiz-answer jetpack-quiz-answer is-correct"
					placeholder={ __( 'Write the correct answer' ) }
					value={ correct }
					onChange={ onChangeCorrect }
					focus={ focusedEditable === 'correct' }
					onFocus={ onFocusCorrect }
				/>

				{ _.times( choices, ( index ) => {
					return <div key={ `gutenpack-quiz-choice-${ index }` }>
						<Editable
							tagName="div"
							multiline={ false }
							formattingControls={ [] }
							className="gutenpack-quiz-answer jetpack-quiz-answer"
							placeholder={ __( 'Add an incorrect answer' ) }
							value={ answers && answers[ index ] }
							onChange={ ( value ) => {
								setAttributes( {
									answers: [
										...answers.slice( 0, index ),
										value,
										...answers.slice( index + 1 ),
									],
								} );
							} }
							focus={ focus && focus.answer === index }
							onFocus={ ( focused ) => setFocus( _.extend( {}, focused, { answer: index } ) ) }
						/>
					</div>;
				} ) }

				<Button
					className="button jetpack-quiz__button"
					onClick={ addNewAnswer }
				>{ __( 'Add answer' ) }</Button>
			</div>
		];
	},
	save: ( props ) => {
		const {
			attributes: {
				question,
				correct,
				answers,
				choices,
				explanation
			}
		} = props;
		return (
			<div className="jetpack-quiz quiz">
				<div className="jetpack-quiz-question question">
					{ question }
				</div>
				<div className="jetpack-quiz-answer" data-correct="1">
					<div className="jetpack-quiz-correct-answer-text">
						{ correct }
					</div>
					{
						explanation && (
							<div className="jetpack-quiz-explanation">
								{ explanation }
							</div>
						)
					}
				</div>
				{
					_.times( choices, ( index ) => {
						return ( answers && answers[ index ] ) && (
							<div
								key={ `gutenpack-quiz-choice-${ index }` }
								className="jetpack-quiz-answer"
							>
								<div className="jetpack-quiz-answer-text">
									{ answers[ index ] }
								</div>
							</div>
						);
					} )
				}
			</div>
		);
	}
} );
