import React from 'react';
import TagsInput from 'react-tagsinput';

const JetpackTagsInput = React.createClass( {
	getInitialState() {
		return {
			tags: this.props.value || []
		};
	},

	handleChange( tags ) {
		this.setState( { tags } )
		if ( this.props.onChange ) {
			this.props.onChange( {
				target: {
					name: this.props.name,
					value: tags.join( ',' )
				}
			} );
		}
	},

	render() {
		const props = this.props;
		return (
			<TagsInput
				inputProps={ { placeholder: props.placeholder } }
				onChange={ this.handleChange }
				value={ this.state.tags } />
		);
	}
} );

export default JetpackTagsInput;
