/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */
const { __ } = wp.i18n;
const {
	registerBlockType,
	Editable,
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
		},
		correct: {
			type: 'number',
			default: -1,
		},
	},
	edit: props => {
		const {
			attributes: {
				question,
				answers,
				explanations,
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

		const addNewAnswer = () => {
			setAttributes( { choices: choices + 1 } );
		};

		return (
			<div className={ props.className + ' jetpack-quiz' }>
				<Editable
					tagName="div"
					multiline={ false }
					formattingControls={ [] }
					className="gutenpack-quiz-question jetpack-quiz-question"
					placeholder={ __( 'Write the question here' ) }
					value={ question }
					onChange={ onChangeQuestion }
					focus={ focusedEditable === 'question' }
					onFocus={ onFocusQuestion }
				/>

				{ _.times( choices, ( index ) => {
					console.log( 'index ' + index + ' correct ' + correct );
					return <div key={ `gutenpack-quiz-choice-${ index }` }>
						<Editable
							tagName="div"
							multiline={ false }
							formattingControls={ [] }
							className="gutenpack-quiz-answer jetpack-quiz-answer"
							placeholder={ __( 'Add an answer' ) }
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
							onFocus={ () => setFocus( { answer: index } ) }
						/>
						<label htmlFor={ `gutenpack-quiz-radio-${ index }` }>
							<input
								id={ `gutenpack-quiz-radio-${ index }` }
								key={ `gutenpack-quiz-radio-${ index }` }
								type="radio"
								name="correct"
								value={ index }
								checked={
									correct && correct === index + 1
										? 'checked'
										: ''
								}
								onChange={ () => {
									setAttributes( { correct: index + 1 } );
								} }
							/>
							{ __( 'Correct' ) }
						</label>
						<Editable
							tagName="div"
							multiline={ false }
							className="gutenpack-quiz-explanation jetpack-quiz-explanation"
							placeholder={ __( 'and its explanation' ) }
							value={ explanations && explanations[ index ] }
							onChange={ ( value ) => {
								setAttributes( {
									explanations: [
										...explanations.slice( 0, index ),
										value,
										...explanations.slice( index + 1 ),
									],
								} );
							} }
							focus={ focus && focus.explanation === index }
							onFocus={ () => setFocus( { explanation: index } ) }
						/>
					</div>;
					}
				) }

				<Button
					className="button"
					onClick={ addNewAnswer }
				>{ __( 'Add new answer' ) }</Button>
			</div>
		);
	},
	save: ( props ) => {
		const {
			attributes: {
				question,
				answers,
				explanations,
				choices,
				correct
			}
		} = props;
		return (
			<div className="jetpack-quiz quiz">
				<div className="jetpack-quiz-question question">
					{ question }
				</div>
				{
					// add data-correct="1" if it's the right one
					_.times( choices, ( index ) => {
						const dataCorrect = correct && correct === index + 1
							? { 'data-correct': '1' }
							: null;
						return ( answers && answers[ index ] ) && (
							<div
								key={ `gutenpack-quiz-choice-${ index }` }
								className="jetpack-quiz-answer"
								{ ...dataCorrect }
							>
								<div className="jetpack-quiz-answer-text">
									{ answers[ index ] }
								</div>
								{
									( explanations && explanations[ index ] ) && (
										<div className="jetpack-quiz-explanation">
											{ explanations[ index ] }
										</div>
									)
								}
							</div>
						);
					} )
				}
			</div>
		);
	}
} );
