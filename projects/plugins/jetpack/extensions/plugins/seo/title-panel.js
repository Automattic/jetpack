import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CountedTextArea } from './counted-textarea';
import { withSeoHelper } from './with-seo-helper';

const isSeoEnhancerEnabled =
	getJetpackExtensionAvailability( 'ai-seo-enhancer' )?.available === true;

class SeoTitlePanel extends Component {
	onTitleChange = value => {
		this.props.updateMetaValue( value );
	};

	render() {
		const { metaValue } = this.props;

		const placeholder = __( 'Write a title…', 'jetpack' );
		const enhancerPlaceholder = __(
			'Enter a clear, keyword-focused title (max 70 characters)',
			'jetpack'
		);

		return (
			<CountedTextArea
				value={ metaValue }
				onChange={ this.onTitleChange }
				label={ __( 'SEO Title', 'jetpack' ) }
				placeholder={ isSeoEnhancerEnabled ? enhancerPlaceholder : placeholder }
				suggestedLimit={ 70 }
				rows={ 2 }
			/>
		);
	}
}

export default withSeoHelper( 'jetpack_seo_html_title' )( SeoTitlePanel );
