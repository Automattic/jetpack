import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../../utils/test-utils';
import { MessageTemplateSection } from '../index';

describe( 'MessageTemplateSection', () => {
	afterEach( () => {
		clearMockedScriptData();
	} );

	it( 'renders the editor when the feature is on and the user can manage_options', () => {
		mockScriptData( {
			site: { plan: { features: { active: [ 'social-message-templates' ] } } },
		} );

		render( <MessageTemplateSection /> );

		expect( screen.getByRole( 'heading', { name: /Default share message/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'textbox', { name: /Message template/i } ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when the message-templates feature is off', () => {
		mockScriptData( {
			site: { plan: { features: { active: [] } } },
		} );

		const { container } = render( <MessageTemplateSection /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the user lacks manage_options', () => {
		mockScriptData( {
			site: { plan: { features: { active: [ 'social-message-templates' ] } } },
			user: {
				current_user: {
					capabilities: { manage_options: false },
				},
			},
		} );

		const { container } = render( <MessageTemplateSection /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
