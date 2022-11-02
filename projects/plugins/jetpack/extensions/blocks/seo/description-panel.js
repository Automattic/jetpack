import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CountedTextArea } from './counted-textarea';
import { withSeoHelper } from './with-seo-helper';

class SeoDescriptionPanel extends Component {
	onMessageChange = event => {
		this.props.updateMetaValue( event.target.value );
	};

	render() {
		const { metaValue } = this.props;

		return (
			<CountedTextArea
				value={ metaValue }
				onChange={ this.onMessageChange }
				placeholder={ __( 'Write a description…', 'jetpack' ) }
				rows={ 4 }
			/>
		);
	}
}

export default withSeoHelper( 'advanced_seo_description' )( SeoDescriptionPanel );
