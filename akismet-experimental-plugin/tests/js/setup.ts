import '@testing-library/jest-dom';
import { __resetApiClientMocks } from './mocks/api-client';
import { __resetMockState } from './mocks/handlers';

afterEach( () => {
	__resetMockState();
	__resetApiClientMocks();
} );
