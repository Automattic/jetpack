// Add Jest DOM specific matchers
import '@testing-library/jest-dom';

// Silence WordPress warning messages
jest.spyOn( global.console, 'warn' ).mockImplementation();

// Mock WordPress i18n functions
global.__ = text => text;
jest.spyOn( global, 'sprintf' ).mockImplementation( ( format, ...args ) => {
	let i = 0;
	return format.replace( /%s/g, () => args[ i++ ] );
} );
