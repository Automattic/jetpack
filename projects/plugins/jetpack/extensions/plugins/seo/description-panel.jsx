import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CountedTextArea } from './counted-textarea';
import { withSeoHelper } from './with-seo-helper';

const isSeoEnhancerEnabled =
	getJetpackExtensionAvailability( 'ai-seo-enhancer' )?.available === true;

class SeoDescriptionPanel extends Component {
	onMessageChange = value => {
		this.props.updateMetaValue( value );
	};

	render() {
		const { metaValue } = this.props;

		const placeholder = __( 'Write a description…', 'jetpack' );
		const enhancerPlaceholder = __(
			'Add a compelling, keyword-rich summary that appears in search results (ideally under 156 characters)',
			'jetpack'
		);

		return (
			<CountedTextArea
				value={ metaValue }
				onChange={ this.onMessageChange }
				label={ __( 'SEO Description', 'jetpack' ) }
				placeholder={ isSeoEnhancerEnabled ? enhancerPlaceholder : placeholder }
				suggestedLimit={ 156 }
				rows={ 4 }
			/>
		);
	}
}

export default withSeoHelper( 'advanced_seo_description' )( SeoDescriptionPanel );
