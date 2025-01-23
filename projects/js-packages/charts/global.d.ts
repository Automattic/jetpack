/// <reference types="jest" />

declare global {
	const describe: jest.Describe;
	const test: jest.It;
	const expect: jest.Expect;
	const it: jest.It;
	const beforeAll: jest.Lifecycle;
	const afterAll: jest.Lifecycle;
	const beforeEach: jest.Lifecycle;
	const afterEach: jest.Lifecycle;
}

export {};
