class BrokenToken {
	constructor() {
		this.setCustomBlogTokenButton = document.getElementById( 'broken-token-set-blog-token' );
		this.saveCustomBlogTokenButton = document.getElementById( 'broken-token-save-blog-token' );
		this.setCustomBlogTokenText = document.getElementById( 'broken-token-edit-blog-token' );
		this.cancelEditBlogTokenButton = document.getElementById(
			'broken-token-cancel-edit-blog-token'
		);

		this.setCustomBlogTokenButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.displayEditBlogToken();
		} );

		this.cancelEditBlogTokenButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.cancelEditBlogToken();
		} );

		this.setCustomUserTokenButton = document.getElementById( 'broken-token-set-user-token' );
		this.saveCustomUserTokenButton = document.getElementById( 'broken-token-save-user-token' );
		this.setCustomUserTokenID = document.getElementById( 'broken-token-edit-user-id' );
		this.setCustomUserTokenText = document.getElementById( 'broken-token-edit-user-token' );
		this.cancelEditUserTokenButton = document.getElementById(
			'broken-token-cancel-edit-user-token'
		);

		this.setCustomUserTokenButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.displayEditUserToken();
		} );

		this.cancelEditUserTokenButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.cancelEditUserToken();
		} );

		this.setCustomBlogIDButton = document.getElementById( 'broken-token-set-blog-id' );
		this.saveCustomBlogIDButton = document.getElementById( 'broken-token-save-blog-id' );
		this.setCustomBlogIDText = document.getElementById( 'broken-token-edit-blog-id' );
		this.cancelEditBlogIDButton = document.getElementById( 'broken-token-cancel-edit-blog-id' );

		this.setCustomBlogIDButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.displayEditBlogID();
		} );

		this.cancelEditBlogIDButton.addEventListener( 'click', e => {
			e.preventDefault;
			this.cancelEditBlogID();
		} );
	}

	displayEditBlogToken() {
		this.setCustomBlogTokenText.style.display = 'block';
		this.setCustomBlogTokenButton.style.display = 'none';
		this.saveCustomBlogTokenButton.style.display = 'block';
		this.cancelEditBlogTokenButton.style.display = 'block';
	}

	cancelEditBlogToken() {
		this.setCustomBlogTokenText.style.display = 'none';
		this.setCustomBlogTokenButton.style.display = 'block';
		this.saveCustomBlogTokenButton.style.display = 'none';
		this.cancelEditBlogTokenButton.style.display = 'none';
	}

	displayEditUserToken() {
		this.setCustomUserTokenID.style.display = 'block';
		this.setCustomUserTokenText.style.display = 'block';
		this.setCustomUserTokenButton.style.display = 'none';
		this.saveCustomUserTokenButton.style.display = 'block';
		this.cancelEditUserTokenButton.style.display = 'block';
	}

	cancelEditUserToken() {
		this.setCustomUserTokenID.style.display = 'none';
		this.setCustomUserTokenText.style.display = 'none';
		this.setCustomUserTokenButton.style.display = 'block';
		this.saveCustomUserTokenButton.style.display = 'none';
		this.cancelEditUserTokenButton.style.display = 'none';
	}

	displayEditBlogID() {
		this.setCustomBlogIDText.style.display = 'block';
		this.setCustomBlogIDButton.style.display = 'none';
		this.saveCustomBlogIDButton.style.display = 'block';
		this.cancelEditBlogIDButton.style.display = 'block';
	}

	cancelEditBlogID() {
		this.setCustomBlogIDText.style.display = 'none';
		this.setCustomBlogIDButton.style.display = 'block';
		this.saveCustomBlogIDButton.style.display = 'none';
		this.cancelEditBlogIDButton.style.display = 'none';
	}
}

document.addEventListener( 'DOMContentLoaded', () => new BrokenToken() );
