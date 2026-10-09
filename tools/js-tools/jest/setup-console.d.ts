declare namespace jest {
	interface Matchers< R > {
		toHaveErrored(): R;
		toHaveErroredWith( ...args: unknown[] ): R;
		toHaveInformed(): R;
		toHaveInformedWith( ...args: unknown[] ): R;
		toHaveLogged(): R;
		toHaveLoggedWith( ...args: unknown[] ): R;
		toHaveWarned(): R;
		toHaveWarnedWith( ...args: unknown[] ): R;
	}
}
