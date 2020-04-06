# Jetpack Terms of Service 

A Terms of Service Package that lets us know that 
the master user has agreed to the the terms of service for this site.


### Usage

Agree to the terms of service.

```php
use Automattic\Jetpack\Terms_Of_Service;

$terms_of_service = new Terms_Of_Service();
$terms_of_service->agree();
```

Reject the terms of service.

```php
use Automattic\Jetpack\Terms_Of_Service;

$terms_of_service = new Terms_Of_Service();
$terms_of_service->revoke();
```

Has the site agreed to the terms of service?

```php
use Automattic\Jetpack\Terms_Of_Service;

$terms_of_service = new Terms_Of_Service();
$has_agreed = $terms_of_service->has_agreed();
```
