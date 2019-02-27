/**
 * External dependencies
 */
import React from 'react';
import TagsInput from 'react-tagsinput';

class JetpackTagsInput extends React.Component {
	state = {
		tags: this.props.value || [],
	};

	handleChange = tags => {
		this.setState( { tags } );
		if ( this.props.onChange ) {
			this.props.onChange( {
				target: {
					name: this.props.name,
					value: tags.join( ',' ),
				},
			} );
		}
	};

	render() {
		return (
			<TagsInput
				disabled={ this.props.disabled }
				inputProps={ { placeholder: this.props.placeholder } }
				onChange={ this.handleChange }
				value={ this.state.tags }
			/>
		);
	}
}

export default JetpackTagsInput;
