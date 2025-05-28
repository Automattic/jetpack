import deprecateFieldStyles from '../deprecate-field-styles';

describe( 'deprecateFieldStyles', () => {
	it( 'should deprecate input styles', () => {
		const attributes = {
			borderColor: '#000000',
			borderRadius: 5,
			borderWidth: 2,
			fieldBackgroundColor: '#ffffff',
			fieldFontSize: '16px',
			inputColor: '#333333',
			lineHeight: 1.5,
		};

		const result = deprecateFieldStyles( attributes );

		expect( result.inputStyles ).toEqual( {
			border: {
				color: '#000000',
				radius: '5px',
				style: 'solid',
				width: '2px',
			},
			color: {
				text: '#333333',
				background: '#ffffff',
			},
			typography: {
				fontSize: '16px',
				lineHeight: '1.5',
			},
		} );
	} );

	it( 'should deprecate label styles', () => {
		const attributes = {
			labelColor: '#666666',
			labelFontSize: '14px',
			labelLineHeight: 1.2,
		};

		const result = deprecateFieldStyles( attributes );

		expect( result.labelStyles ).toEqual( {
			color: {
				text: '#666666',
			},
			typography: {
				fontSize: '14px',
				lineHeight: '1.2',
			},
		} );
	} );

	it( 'should deprecate option styles', () => {
		const attributes = {
			inputColor: '#333333',
			fieldFontSize: '16px',
			lineHeight: 1.5,
		};

		const result = deprecateFieldStyles( attributes );

		expect( result.optionStyles ).toEqual( {
			color: {
				text: '#333333',
			},
			typography: {
				fontSize: '16px',
				lineHeight: '1.5',
			},
		} );
	} );

	it( 'should handle empty or undefined values', () => {
		const attributes = {
			borderRadius: 0,
			borderWidth: 0,
			placeholder: 'Enter text',
		};

		const result = deprecateFieldStyles( attributes );

		expect( result.inputStyles ).toEqual( {
			border: {
				radius: '0px',
				style: 'solid',
				width: '0px',
			},
		} );
		expect( result.labelStyles ).toBeUndefined();
		expect( result.optionStyles ).toBeUndefined();
		expect( result.restAttributes ).toEqual( {} );
	} );
} );
