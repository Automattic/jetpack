jest.setTimeout( 60000 );
jest.spyOn( global.console, 'debug' ).mockImplementation( () => jest.fn() );
