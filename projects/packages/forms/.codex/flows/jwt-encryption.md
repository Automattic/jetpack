# JWT Encryption

## When this happens

**Encoding**: During form rendering, when the form HTML is assembled and a JWT token is embedded as a hidden field.
**Decoding**: During form submission, when the JWT token is extracted from POST data and decoded to reconstruct the form.

## Entry points

- **Encode**: `src/contact-form/class-contact-form.php:731` -- `Contact_Form::get_jwt()`
- **Decode**: `src/contact-form/class-contact-form.php:345` -- `Contact_Form::get_instance_from_jwt()`
- **Secret**: `src/contact-form/class-contact-form.php:657` -- `Contact_Form::get_secret()`

## Sequence: Encoding (`get_jwt`, line 731)

1. Get the signing secret via `get_secret()` (line 732)
2. Derive two separate keys using HKDF (line 734-736):
   - `$jwt_signing_key` = `hash_hkdf('sha256', $secret, 32, 'jetpack-forms-jwt-hmac-v2')` -- for JWT HMAC signing
   - `$encryption_key` = `hash_hkdf('sha256', $secret, 32, 'jetpack-forms-aes-gcm-v2')` -- for attribute encryption
3. Get form source context via `Feedback_Source::get_current()` (line 739)
4. Check cipher availability (lines 745-770):
   - Primary: `aes-256-gcm` (12-byte IV, authenticated)
   - Fallback: `aes-256-cbc` (16-byte IV, unauthenticated)
5. If encryption available (line 781):
   - Generate random IV via `random_bytes($iv_length)` (line 782)
   - Encrypt attributes JSON with `openssl_encrypt()` using chosen cipher (line 784)
   - For GCM: blob = `IV (12 bytes) + auth tag (16 bytes) + ciphertext`
   - For CBC: blob = `IV (16 bytes) + ciphertext`
   - Encode JWT payload (version 2): `encrypted_attributes` (base64), `content`, `hash`, `source`, `version=2`, `cipher`
   - Sign with `JWT::encode($payload, $jwt_signing_key)` (line 803)
6. If encryption fails or unavailable (line 816):
   - Fall back to version 1 (unencrypted): attributes stored in plain text in JWT
   - Sign with derived key (not raw secret)

## Sequence: Decoding (`get_instance_from_jwt`, line 345)

1. Get secret and derive same two HKDF keys (lines 346-350)
2. Try JWT decode with derived signing key first (line 353)
3. On failure, retry with raw secret (backward compatibility, line 357)
4. On second failure, fire `jetpack_forms_jwt_decode_failure` filter for external handling (line 370)
5. Determine version: `$data['version']` (default: version 1) (line 388)
6. **Version 2** (encrypted, lines 390-453):
   - Base64-decode the `encrypted_attributes` field (line 396)
   - Determine cipher from JWT (default: `aes-256-gcm`) (line 402)
   - Validate cipher availability on server (line 406)
   - Extract IV, auth tag (GCM only), and ciphertext from blob (lines 411-428)
   - Decrypt with `openssl_decrypt()` using encryption key (line 430)
   - JSON-decode decrypted attributes (line 443)
   - Merge into data: `$data['attributes'] = $decrypted_attributes` (line 449)
7. **Version 0/1** (unencrypted): attributes are already in `$data['attributes']` -- no decryption needed
8. Reconstruct `Contact_Form` instance from decoded data (line 474)
9. Set source, hash, and `has_verified_jwt = true` (lines 475-477)

## Secret Resolution (`get_secret`, line 657)

Priority order:
1. `jetpack_forms_secret_jwt` filter (line 666) -- allows override
2. Jetpack Connection token: `(new Tokens())->get_access_token()->secret` (line 671)
3. Stored fallback: `get_option('jetpack_forms_secret_key')` (line 677)
4. Generate new: `wp_generate_password(64, true, true)` → store in option (line 680)

## Key decisions

- **HKDF key separation**: A single master secret is split into two purpose-specific keys using HKDF with distinct context strings (`jetpack-forms-jwt-hmac-v2` for signing, `jetpack-forms-aes-gcm-v2` for encryption). This prevents key reuse across cryptographic operations.
- **Selective encryption**: Only `attributes` are encrypted (they contain sensitive form config like email recipients). `content`, `hash`, and `source` remain unencrypted in the JWT for efficiency.
- **Cipher fallback**: GCM preferred (authenticated encryption) but falls back to CBC if GCM unavailable. The cipher used is stored in the JWT so decoding knows which cipher to use.
- **Backward compatibility**: Decoding tries the HKDF-derived key first, then falls back to the raw secret for tokens signed before HKDF was introduced. Similarly, version 0/1 tokens (unencrypted) are still accepted.
- **Version field**: `version=2` means encrypted attributes. `version=0` or `1` (or absent) means unencrypted.

## Files involved

| File | Role |
|------|------|
| `src/contact-form/class-contact-form.php` | `get_jwt()`, `get_instance_from_jwt()`, `get_secret()` |
| `automattic/jetpack-jwt` package | `JWT::encode()`, `JWT::decode()` -- external dependency |
| `automattic/jetpack-connection` package | `Tokens` class for connection token secret |
| `src/contact-form/class-feedback-source.php` | Source context serialized into JWT |

## Gotchas

- **Secret rotation breaks forms**: If the JWT secret changes between render and submit (e.g., Jetpack reconnection, option deletion), all rendered forms become invalid. The fallback to raw secret provides some backward compatibility.
- **GCM auth tag is critical**: For AES-256-GCM, the 16-byte authentication tag is prepended to ciphertext in the blob. If the blob format is parsed incorrectly (wrong offsets), decryption silently fails.
- **Base64 in JWT in POST**: The encrypted blob is base64-encoded inside the JWT, which is itself a base64url-encoded structure. This double encoding increases token size significantly.
- **Filter escape hatch**: `jetpack_forms_jwt_decode_failure` filter allows external code to handle JWT decode failures (e.g., for migration scenarios). Returns `null` by default.
- **No expiration**: JWT tokens don't have an `exp` claim. A rendered form's token is valid indefinitely as long as the secret hasn't changed.
