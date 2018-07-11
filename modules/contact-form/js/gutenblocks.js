( function( wp, strings ) {
	wp.blocks.registerBlockType( 'jetpack/contact-form', {
		title : strings['Contact Form'],
		icon : 'feedback',
		category : 'common',

		attributes : {
			subject : {
				type : 'string',
				default : ''
			},
			to : {
				type : 'string',
				default : ''
			}
		},

		edit : function( props ) {
			function handleSubjectChange( value ) {
				props.setAttributes({
					subject : value
				});
				return value;
			}
			function handleToChange( value ) {
				props.setAttributes({
					to : value
				});
				return value;
			}

			return [
				wp.element.createElement(
					'h1',
					{
						key : 'jetpack/contact-form/placeholder',
					},
					'This is a Placeholder.'
				),
				!! props.focus && wp.element.createElement(
					wp.blocks.InspectorControls,
					{ key : 'inspector' },
					[
						wp.element.createElement(
							wp.blocks.InspectorControls.TextControl,
							{
								key : 'jetpack/contact-form/inspector/subject',
								onChange : handleSubjectChange,
								value : props.attributes.subject,
								label : strings['What would you like the subject of the email to be?']
							}
						),
						wp.element.createElement(
							wp.blocks.InspectorControls.TextControl,
							{
								key : 'jetpack/contact-form/inspector/to',
								onChange : handleToChange,
								value : props.attributes.to,
								label : strings['Which email address should we send the submissions to?'],
								help : 'Help for to line whatever'
							}
						)
					]
				),
			];
		},

		save : function() {
			return null;
		}

	} );
} )( window.wp, window.grunionGutenblocks.strings );