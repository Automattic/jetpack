const { __ } = wp.i18n;
const {
	registerBlockType,
	Editable,
	MediaUploadButton,
	InspectorControls,
	InspectorControls: {
		ToggleControl,
		TextControl,
	},
	BlockDescription,
	source: {
		attr,
		children,
		text,
		query,
	}
} = wp.blocks;
const {
	Placeholder
} = wp.components;

registerBlockType( 'jetpack/recipe', {
	title: __( 'Recipe' ),
	icon: 'index-card',
	category: 'layout',
	attributes: {
		title: {
			type: 'array',
			source: children( '.jetpack-recipe-title' ),
		},
		servings: {
			type: 'string',
			source: text( '.jetpack-recipe-servings [data-value]' ),
		},
		time: {
			type: 'string',
			source: text( '.jetpack-recipe-time [data-value]' ),
		},
		difficulty: {
			type: 'string',
			source: text( '.jetpack-recipe-difficulty [data-value]' ),
		},
		print: {
			type: 'boolean',
			default: true,
		},
		source: {
			type: 'string',
			source: text( '.jetpack-recipe-source [data-value]'),
		},
		sourceurl: {
			type: 'string',
			source: attr( '.jetpack-recipe-source [data-value]', 'href'),
		},
		mediaId: {
			type: 'number',
		},
		mediaUrl: {
			type: 'string',
			source: attr( '.jetpack-recipe-image', 'src' ),
		},
		description: {
			type: 'array',
			source: children( '.jetpack-recipe-description' ),
		},
		instructions: {
			type: 'array',
			source: children( '.jetpack-recipe-instructions' ),
		},
		ingredients: {
			type: 'array',
			source: children( '.jetpack-recipe-ingredients' ),
		},
		ingredientsTitle: {
			type: 'string',
			default: __( 'Ingredients' ),
			source: text( '.jetpack-recipe-ingredients-title' ),
		},
		instructionsTitle: {
			type: 'string',
			default: __( 'Instructions' ),
			source: text( '.jetpack-recipe-instructions-title' ),
		},
	},
	edit: props => {
		const {
			focus,
			attributes,
			setAttributes,
			setFocus
		} = props;

		const focusedEditable = focus ? focus.editable || 'title' : null;
		const onSelectImage = media => {
			setAttributes( {
				mediaUrl: media.url,
				mediaId: media.id,
			} );
		};

		const onChangeEditable = field => value => setAttributes( { [field]: value } );
		const onChangeValue = field => e => setAttributes( { [field]: e.target.value } );
		const togglePrint = () => setAttributes( { print: ! attributes.print } );
		const onFocus = field => focus => {
			setFocus( _.extend( {}, focus, { editable: field } ) );
		};

		const classes = ( props.className || '' ) + ' hrecipe jetpack-recipe';
		const recipeMetaClasses = focus
			? 'jetpack-recipe__meta is-block-focus'
			: 'jetpack-recipe__meta';

		const mediaUploadButton = (
			<MediaUploadButton
				buttonProps={
					{
						className: attributes.mediaId
							? 'image-button'
							: 'components-button button button-large',
						isLarge: true
					}
				}
				onSelect={ onSelectImage }
				type="image"
				value={ attributes.mediaId }
			>
				{
					attributes.mediaId
						? <img src={ attributes.mediaUrl } />
						: __( 'Insert from Media Library' )
				}
			</MediaUploadButton>
		);

		const controls = focus && [
			<InspectorControls key="inspector">
				<BlockDescription>
					<p>{ __( 'Shows a recipe with consistent fomatting, an image, basic metadata, and an option to print the recipe.' ) }</p>
				</BlockDescription>
				<h3>{ __( 'Recipe Settings' ) }</h3>
				<ToggleControl
					label={ __( 'Show Print Button' ) }
					checked={ attributes.print }
					onChange={ togglePrint }
				/>
				<TextControl
					label={ __( 'Custom Title for Ingredients' ) }
					placeholder={ __( 'Ingredients' ) }
					onChange={ onChangeEditable( 'ingredientsTitle' ) }
					value={ attributes.ingredientsTitle }
				/>
				<TextControl
					label={ __( 'Custom Title for Instructions' ) }
					placeholder={ __( 'Instructions' ) }
					onChange={ onChangeEditable( 'instructionsTitle' ) }
					value={ attributes.instructionsTitle }
				/>
			</InspectorControls>
		];

		return [
			controls,
			<div className={ classes }>
				<Editable
					tagName="h3"
					placeholder={ __( 'Recipe title…' ) }
					onChange={ onChangeEditable( 'title' ) }
					focus={ focusedEditable === 'title' }
					onFocus={ onFocus( 'title' ) }
					className="jetpack-recipe-title"
					inlineToolbar
					value={ attributes.title }
				/>
				<ul className="jetpack-recipe-meta">
					<li className="jetpack-recipe-servings">
						<label>
							{ __( 'Servings:' ) }
							<input
								className={ recipeMetaClasses }
								value={ attributes.servings }
								onChange={onChangeValue('servings')}
								onFocus={onFocus('servings')}
							/>
						</label>
					</li>
					<li className="jetpack-recipe-time">
						<label>
							{ __( 'Time:' ) }
							<input
								className={ recipeMetaClasses }
								value={ attributes.time }
								onChange={onChangeValue('time')}
								onFocus={onFocus('time')}
							/>
						</label>
					</li>
					<li className="jetpack-recipe-difficulty">
						<label>
							{ __( 'Difficulty:' ) }
							<input
								className={ recipeMetaClasses }
								value={ attributes.difficulty }
								onChange={onChangeValue('difficulty')}
								onFocus={onFocus('difficulty')}
							/>
						</label>
					</li>
					{ attributes.print &&
						<li className="jetpack-recipe-print">
							<a href="#">{ __( 'Print' ) }</a>
						</li>
					}
				</ul>
				{
					attributes.mediaUrl
						? (
							<div className="recipe-image">
								{
									mediaUploadButton
								}
							</div>
						)
						: (
							<Placeholder
								key="placeholder"
								instructions={ __( 'Drag image here or insert from media library' ) }
								icon="format-image"
								label={ __( 'Recipe Image' ) }
								className="recipe-image">
								{
									mediaUploadButton
								}
							</Placeholder>
						)
				}
				{ ( props.focus || attributes.description ) &&
					<Editable
						tagName="p"
						placeholder={ __( 'Write a short description…' ) }
						onChange={ onChangeEditable( 'description' ) }
						focus={ focusedEditable === 'description' }
						onFocus={ onFocus( 'description' ) }
						value={ attributes.description }
						inlineToolbar
					/>
				}
				{ attributes.ingredientsTitle !== '' &&
					<h4 className="jetpack-recipe-ingredients-title">{ attributes.ingredientsTitle }</h4>
				}
				<Editable
					tagName="ul"
					multiline="li"
					placeholder={ __( 'List your ingredients…' ) }
					value={ attributes.ingredients }
					onChange={ onChangeEditable( 'ingredients' ) }
					focus={ focusedEditable === 'ingredients' }
					onFocus={ onFocus( 'ingredients' ) }
					className="ingredients"
					inlineToolbar
				/>
				{ attributes.instructionsTitle !== '' &&
					<h4 className="jetpack-recipe-instructions-title">{ attributes.instructionsTitle }</h4>
				}
				<Editable
					tagName="div"
					multiline="p"
					className="steps"
					placeholder={ __( 'Write the instructions…' ) }
					value={ attributes.instructions }
					onChange={ onChangeEditable( 'instructions' ) }
					focus={ focusedEditable === 'instructions' }
					onFocus={ onFocus( 'instructions' ) }
					inlineToolbar
				/>
			</div>
		];
	},
	save: props => {
		console.log('saving', props.attributes);
		const attributes = props.attributes;
		return (
			<div className={ 'hrecipe jetpack-recipe' } itemScope itemType="https://schema.org/Recipe">
				{ attributes.title.length
					? <h3 className="jetpack-recipe-title" itemProp="name">{ attributes.title }</h3>
					: null
				}
				<ul className="jetpack-recipe-meta">
					{ attributes.servings &&
						<li className="jetpack-recipe-servings" itemProp="recipeYield"><strong>Servings:</strong> <span data-value>{ attributes.servings }</span></li>
					}
					{ attributes.time &&
						<li className="jetpack-recipe-time">
							<time itemProp="totalTime" datetime="%3$s"><strong>Time: </strong><span data-value>{ attributes.time }</span></time>
						</li>
					}
					{ attributes.difficulty &&
						<li className="jetpack-recipe-difficulty">
							<strong>Difficulty: </strong><span data-value>{ attributes.difficulty }</span>
						</li>
					}
					{ attributes.source &&
						<li className="jetpack-recipe-source">
							Source: { attributes.sourceurl
								? <a href={ attributes.sourceurl } data-value>{ attributes.source }</a>
								: <span data-value>{ attributes.source }</span>
							}
						</li>
					}
					{ attributes.print &&
						<li className="jetpack-recipe-print">
							<a href="#">{ __( 'Print' ) }</a>
						</li>
					}
				</ul>
				{ attributes.mediaUrl
					? <img className="jetpack-recipe-image" itemProp="image" src={ attributes.mediaUrl } />
					: null
				}
				{ attributes.description && attributes.description.length
					? <p className="jetpack-recipe-description" itemProp="description">{ attributes.description }</p>
					: null
				}
				{ attributes.ingredients && attributes.ingredients.length
					? <div>
							{ attributes.ingredientsTitle !== '' &&
								<h4 className="jetpack-recipe-ingredients-title">{ attributes.ingredientsTitle }</h4>
							}
							<ul className="jetpack-recipe-ingredients">
								{ attributes.ingredients }
							</ul>
						</div>
					: null
				}
				{ attributes.instructions && attributes.instructions.length
					? <div>
							{ attributes.instructionsTitle !== '' &&
								<h4 className="jetpack-recipe-instructions-title">{ attributes.instructionsTitle }</h4>
							}
							<div className="jetpack-recipe-instructions" itempProp="recipeInstructions">
								{ attributes.instructions }
							</div>
						</div>
					: null
				}
			</div>
		);
	}
} );
