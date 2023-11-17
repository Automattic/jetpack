# Jetpack AI JWT Library

This JavaScript library provides a convenient way to acquire and handle JWT tokens for Jetpack AI. It is designed to work with both Jetpack sites and Simple or Atomic sites, while managing token expiration and storage for you.

## Features

- Acquires JWT tokens from either Jetpack or WP.com sites.
- Caches tokens in the browser's `localStorage`.
- Automatically handles token expiration by setting a default expiration time.
- Allows customization of request options such as `apiNonce`, `siteId` and `expirationTime`.

## Installation

To install this library, run the following command in your project root:

```bash
npm install --save @automattic/jetpack-ai-client
```

## Usage

```javascript
import { requestJwt } from '@automattic/jetpack-ai-client';

const tokenData = await requestJwt();
```

`requestJwt` is an asynchronous function that returns a Promise. The Promise resolves with an object containing the token, blogId, and expire time.

```javascript
{
	token: 'YOUR_JWT_TOKEN',
	blogId: 'YOUR_BLOG_ID',
	expire: 1652492550000, // Token expiration time in milliseconds since the Unix Epoch
}
```