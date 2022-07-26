<?php
/**
 * VideoPress TUS Client
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Carbon\Carbon;
use TusPhp\Exception\TusException;
use TusPhp\Exception\FileException;
use GuzzleHttp\Exception\ClientException;
use TusPhp\Exception\ConnectionException;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\ConnectException;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * VideoPress Tus Client class.
 *
 * This class extends the TusPHP client class in order to make a few changes to work with our server:
 * * Use only POST and GET requests.
 * * Store the key specific token our server sends after we create the upload and use it in patch requests.
 */
class Tus_Client extends \TusPhp\Tus\Client {

	/**
	 * Create resource with POST request and upload data using the creation-with-upload extension.
	 *
	 * @see https://tus.io/protocols/resumable-upload.html#creation-with-upload
	 *
	 * @param string $key
	 * @param int    $bytes -1 => all data; 0 => no data
	 *
	 * @throws GuzzleException
	 *
	 * @return array [
	 *	 'location' => string,
	 *	 'offset' => int
	 * ]
	 */
	public function createWithUpload(string $key, int $bytes = -1): array {
		$bytes = $bytes < 0 ? $this->fileSize : $bytes;

		$headers = $this->headers + [
			'Upload-Length' => $this->fileSize,
			'Upload-Key' => $key,
			'Upload-Checksum' => $this->getUploadChecksumHeader(),
			'Upload-Metadata' => $this->getUploadMetadataHeader(),
		];

		$data = '';
		if ($bytes > 0) {
			$data = $this->getData(0, $bytes);

			$headers += [
				'Content-Type' => self::HEADER_CONTENT_TYPE,
				'Content-Length' => \strlen($data),
			];
		}

		if ($this->isPartial()) {
			$headers += ['Upload-Concat' => 'partial'];
		}

		try {
			$response = $this->getClient()->post($this->apiPath, [
				'body' => $data,
				'headers' => $headers,
			]);
		} catch (ClientException $e) {
			$response = $e->getResponse();
		}

		$statusCode = $response->getStatusCode();

		if (HttpResponse::HTTP_CREATED !== $statusCode) {
			throw new FileException('Unable to create resource.');
		}

		$uploadOffset   = $bytes > 0 ? current($response->getHeader('upload-offset')) : 0;
		$uploadLocation = current($response->getHeader('location'));

		$this->getCache()->set($this->getKey(), [
			'location' => $uploadLocation,
			'expires_at' => Carbon::now()->addSeconds($this->getCache()->getTtl())->format($this->getCache()::RFC_7231),
			// VideoPress mod: Store key specific token for future usage
			'token_for_key' => $response->getHeader('x-videopress-upload-key-token'),
		]);

		return [
			'location' => $uploadLocation,
			'offset' => $uploadOffset,
		];
	}

	/**
	 * Send DELETE request.
	 *
	 * @throws FileException
	 * @throws GuzzleException
	 *
	 * @return void
	 */
	public function delete() {
		$headers = $this->headers + [
			'X-HTTP-Method-Override' => 'DELETE', // VideoPress mod: add method override header.
		];
		try {
			$this->getClient()->post($this->getUrl()); // VideoPress mod: use post() instead of delete()
		} catch (ClientException $e) {
			$statusCode = $e->getResponse()->getStatusCode();

			if (HttpResponse::HTTP_NOT_FOUND === $statusCode || HttpResponse::HTTP_GONE === $statusCode) {
				throw new FileException('File not found.');
			}
		}
	}

	/**
	 * Send HEAD request.
	 *
	 * @throws FileException
	 * @throws GuzzleException
	 *
	 * @return int
	 */
	protected function sendHeadRequest(): int {
		$headers = $this->headers + [
			'X-HTTP-Method-Override' => 'HEAD', // VideoPress mod: add method override header.
		];
		$response   = $this->getClient()->get($this->getUrl(), [ 'headers' => $headers ]); // VideoPress mod: use get() instead of head()
		$statusCode = $response->getStatusCode();

		if (HttpResponse::HTTP_OK !== $statusCode) {
			throw new FileException('File not found.');
		}

		return (int) current($response->getHeader('upload-offset'));
	}

	/**
	 * Send PATCH request.
	 *
	 * @param int $bytes
	 * @param int $offset
	 *
	 * @throws TusException
	 * @throws FileException
	 * @throws GuzzleException
	 * @throws ConnectionException
	 *
	 * @return int
	 */
	protected function sendPatchRequest(int $bytes, int $offset): int {
		$data	= $this->getData($offset, $bytes);
		$headers = $this->headers + [
			'Content-Type' => self::HEADER_CONTENT_TYPE,
			'Content-Length' => \strlen($data),
			'Upload-Checksum' => $this->getUploadChecksumHeader(),
			'X-HTTP-Method-Override' => 'PATCH', // VideoPress mod: add method override header.

		];

		// VideoPress mod: override token with key specific token.
		$token = $this->getCache()->get($this->getKey())['token_for_key'] ?? null;
		$headers['x-videopress-upload-token'] = $token;

		if ($this->isPartial()) {
			$headers += ['Upload-Concat' => self::UPLOAD_TYPE_PARTIAL];
		} else {
			$headers += ['Upload-Offset' => $offset];
		}

		try {
			$response = $this->getClient()->post($this->getUrl(), [ // VideoPress mod: use post instead of patch.
				'body' => $data,
				'headers' => $headers,
			]);

			return (int) current($response->getHeader('upload-offset'));
		} catch (ClientException $e) {
			throw $this->handleClientException($e);
		} catch (ConnectException $e) {
			throw new ConnectionException("Couldn't connect to server.");
		}
	}

}
