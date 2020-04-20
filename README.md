# duo-express

Express middleware for handling Duo sign and verify actions

## Purpose

From the client side, you need to create the Duo signature request and then verify the Duo response. Both of these actions require access to the Duo `ikey`, `skey`, and `akey`. These are secret and cannot be part of your web application. Accordingly, these actions must be performed on the server. This package provides an Express middleware module that handles these requests.

For additional details, please review the [Duo Web](https://duo.com/docs/duoweb) documentation.

## Prerequisites

This module requires [@duosecurity/duo_web](https://www.npmjs.com/package/@duosecurity/duo_web) and [express](https://www.npmjs.com/package/express) to be installed as peer dependencies. You should also have installed and configured the [express-session](https://www.npmjs.com/package/express-session) package otherwise there is no way to remember that the user has, in fact, been authenticated by Duo.

## Installation

```
npm install --save duo-express
```

## Usage

Bind the middleware using the `app.use()` function and pass the configuration options to the `duo()` middleware function.

```javascript
const duo = require('duo-express');
const app = express();
app.use(duo(duoConfig));
```

The configuration object must have the following four properties:

```javascript
const duoConfig = {
  ikey: 'your duo integration key',
  skey: 'your duo secret key',
  akey: 'your duo application key',
  host: 'your duo api hostname'
};
```

A best practice is not to store the keys in your application's code base but in environment variables that are passed to the application. Most cloud providers have a way to do this via application configuration variables.

## Endpoints

This middleware module provides three endpoints that you can call from your web application.

### `POST /duo`

This endpoint signs the username using the three Duo keys and returns an object you can pass directly to the `Duo.init()` method. The `username` request property is required.

The optional `redirect` request property is the path to which the client is redirected on a successful Duo verification. If you do not specify the `redirect` property, then a `204` status is returned from the verification action and you will be left on the page with your Duo iframe. This may be useful for debugging but probably not what you want in production.
```
POST /duo

{
  username: 'joe@example.com',
  redirect: '/home'
}
```

The response is a an object that you can pass directly to `Duo.init()`. It is shown here for reference but you should not modify any of the properties.

```javascript
{
  host: config.host,
  sig_request: '<the signed duo request>',
  post_argument: 'response',
  post_action: '/duo/response?redirect=<redirect>'
}
```

The `post_action` response path is implemented by this middleware and is called automatically by Duo. On success, a POST to this path will set the `duo` object in the session:

```javascript
req.session.duo = {
  username: 'joe@example.com'
}
```

### `GET /duo`

A quick way to check if Duo verification has taken place. The response is the `duo` session object or `null` if no Duo session has been set.

```javascript
{
  username: 'joe@example.com'
}
```

### `DELETE /duo`

Removes the `duo` object from the session (i.e., performs a logout).

## Flow

The flow of this middleware is as follows (the "you" in these steps refers to your web application):

1. You get, and validate, the username. This is normally performed via a login form and back-end authentication.
2. You POST the username and the redirect property to the `/duo` middleware endpoint.
3. You receive the response data and pass that directly to `Duo.init()`. This response includes the signed request using the private keys on the server.
4. Duo performs the necessary user interactions via the iframe in your web application.
5. Duo sends a POST request to the `/duo/response` middleware endpoint. This request includes the Duo response.
6. The response is verified using the private keys on the server.
7. The middleware sets the `duo` object in the session and redirects to your specified application page.

In the last step, the redirect URI need not be a page in your application. It could be to another API endpoint that performs additional user lookup and adds user information to the session before redirecting the user to a page in the application.

## License

MIT License

Copyright (c) 2020 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
