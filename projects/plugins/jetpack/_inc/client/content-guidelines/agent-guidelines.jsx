import { Button, Notice, Spinner, TextareaControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

const SUGGESTION_LABELS = {
	site: __( 'Site Context', 'jetpack' ),
	copy: __( 'Copy Guidelines', 'jetpack' ),
	images: __( 'Image Guidelines', 'jetpack' ),
	additional: __( 'Additional Guidelines', 'jetpack' ),
};

class AgentGuidelinesComponent extends Component {
	state = {
		isGenerating: false,
		suggestions: null,
		editedSuggestions: null,
		isSavingSuggestions: false,
		error: null,
	};

	handleSuggestGuidelines = async () => {
		this.setState( { isGenerating: true, error: null, suggestions: null, editedSuggestions: null } );

		try {
			const result = await apiFetch( {
				path: '/wpcom/v2/jetpack-ai/suggest-guidelines',
				method: 'POST',
				data: {
					sections: [ 'site', 'copy', 'images', 'additional' ],
				},
			} );
			this.setState( {
				isGenerating: false,
				suggestions: result,
				editedSuggestions: { ...result },
			} );
		} catch ( err ) {
			this.setState( {
				isGenerating: false,
				error: err.message || __( 'Failed to generate guidelines. Please try again.', 'jetpack' ),
			} );
		}
	};

	handleEditSuggestion = ( key, value ) => {
		this.setState( prevState => ( {
			editedSuggestions: {
				...prevState.editedSuggestions,
				[ key ]: value,
			},
		} ) );
	};

	handleSaveSuggestions = async () => {
		this.setState( { isSavingSuggestions: true, error: null } );

		try {
			const { editedSuggestions } = this.state;

			// Build guideline_categories in the format the CPT expects.
			const guidelineCategories = {};
			for ( const key of Object.keys( SUGGESTION_LABELS ) ) {
				if ( editedSuggestions[ key ] ) {
					guidelineCategories[ key ] = { guidelines: editedSuggestions[ key ] };
				}
			}

			// Check if guidelines already exist.
			const existing = await apiFetch( { path: '/wp/v2/content-guidelines' } );

			if ( existing.id && existing.id > 0 ) {
				// Update existing.
				await apiFetch( {
					path: `/wp/v2/content-guidelines/${ existing.id }`,
					method: 'PUT',
					data: {
						status: 'publish',
						guideline_categories: guidelineCategories,
					},
				} );
			} else {
				// Create new.
				await apiFetch( {
					path: '/wp/v2/content-guidelines',
					method: 'POST',
					data: {
						status: 'publish',
						guideline_categories: guidelineCategories,
					},
				} );
			}

			this.setState( {
				isSavingSuggestions: false,
				suggestions: null,
				editedSuggestions: null,
			} );
		} catch ( err ) {
			this.setState( {
				isSavingSuggestions: false,
				error: err.message || __( 'Failed to save guidelines. Please try again.', 'jetpack' ),
			} );
		}
	};

	handleDiscard = () => {
		this.setState( { suggestions: null, editedSuggestions: null, error: null } );
	};

	render() {
		const { isGenerating, editedSuggestions, isSavingSuggestions, error } = this.state;

		return (
			<SettingsCard { ...this.props } hideButton>
				<SettingsGroup>
					<p>
						{ __(
							'Generate AI-powered content guidelines based on your recent posts. Review, edit, and save them to your site.',
							'jetpack'
						) }
					</p>

					<div style={ { marginTop: '16px' } }>
						<Button
							variant="secondary"
							onClick={ this.handleSuggestGuidelines }
							disabled={ isGenerating || isSavingSuggestions }
						>
							{ isGenerating && <Spinner /> }
							{ isGenerating
								? __( 'Generating…', 'jetpack' )
								: __( 'Suggest Guidelines', 'jetpack' ) }
						</Button>
					</div>

					{ error && (
						<Notice status="error" isDismissible={ false } style={ { marginTop: '12px' } }>
							{ error }
						</Notice>
					) }

					{ editedSuggestions && (
						<div style={ { marginTop: '16px' } }>
							{ Object.entries( SUGGESTION_LABELS ).map(
								( [ key, label ] ) => (
									<TextareaControl
										key={ key }
										label={ label }
										value={ editedSuggestions[ key ] || '' }
										onChange={ value =>
											this.handleEditSuggestion( key, value )
										}
										rows={ 4 }
									/>
								)
							) }
							<div style={ { display: 'flex', gap: '8px', marginTop: '8px' } }>
								<Button
									variant="primary"
									onClick={ this.handleSaveSuggestions }
									disabled={ isSavingSuggestions }
								>
									{ isSavingSuggestions
										? __( 'Saving…', 'jetpack' )
										: __( 'Save Guidelines', 'jetpack' ) }
								</Button>
								<Button
									variant="tertiary"
									onClick={ this.handleDiscard }
									disabled={ isSavingSuggestions }
								>
									{ __( 'Discard', 'jetpack' ) }
								</Button>
							</div>
						</div>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default AgentGuidelinesComponent;
