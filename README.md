# duo-express

Express middleware for handling Duo sign and verify actions

## Purpose

From the client side, you need to create the Duo signature request and then verify the Duo response. Both of these actions require access to the Duo `ikey`, `skey`, and `akey`. These are secret and cannot be part of your web application. Accordingly, these actions must be performed on the server. This package provides an Express middleware module that handles these requests.

## Prerequisites

Some optional functions require that you have installed and configured the [express-session](https://www.npmjs.com/package/express-session) package.

## Installation

```
npm install --save duo-express
```

## Usage

```javascript
const duo = require('duo-express');
const app = express();
app.use(duo(duoConfig, paths)); // paths is an optional argument
```

The optional `paths` argument is a set of paths you want to protect (e.g., `['/api']`). If provided, all requests are checked. If a request path begins with a value specified in the `paths` array and the `/duo/verify` endpoint has not yet been called, then a 401 (Unauthorized) response is returned. As mentioned in the prerequisites, session middleware must be installed for this to work.

## Configuration

This middleware module requires a configuration object having the following properties:

```javascript
const duoConfig = {
  ikey: 'your duo integration key',
  skey: 'your duo secret key',
  akey: 'your duo application key',
  host: 'your duo api hostname'
};
```

## Endpoints

This middleware module provides three endpoints that you can call from your web application.

### `POST /duo/sign`

This endpoint signs the username using the three Duo keys and returns the request expected by the `Duo.init` method.

```
POST /duo/sign

{
  username: 'joe@example.com'
}
```

The response is a [JSend](https://github.com/omniti-labs/jsend) object:

```javascript
{
  status: 'success',
  data: {
    host: 'api-XXXXXXXX.duosecurity.com',
    request: 'the request that is passed to the duo web init call'
  }
}
```

The hostname is returned so you need only to maintain in one location and not separately in your web app and your server. Having it in the response is a handy way to get it and use it as the `host` parameter to `Duo.init`.

### `POST /duo/verify`

After you display the iFrame and Duo returns a response, the response must be verified.

```
POST /duo/verify

{
  response: 'the response from the Duo web iFrame'
}
```

The response is a [JSend](https://github.com/omniti-labs/jsend) object:

```javascript
{
  status: 'success',
  data: {
    username: 'joe@example.com'
  }
}
```

If you have session middleware installed (as evidenced by `req.session` being an object), then a `duo` object is added to the session with the `username` property.

### `GET /duo`

A quick way to check if Duo verification has taken place. The response is a [JSend](https://github.com/omniti-labs/jsend) object:

```javascript
{
  status: 'success',
  data: {
    username: 'joe@example.com'
  }
}

// -or-

{
  status: 'success',
  data: null
}
```

Again, this will only work if you have session middleware installed.

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
