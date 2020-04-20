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
app.use(duo(duoConfig));
```

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

### `POST /duo[?next=<path>]`

This endpoint signs the username using the three Duo keys and returns the an object you can pass directly to the `Duo.init` method. The optional `next` query parameter is the path to which the client is redirected on a successful Duo verification. If it is omitted, then the application is redirected to `/` on success.

```
POST /duo

{
  username: 'joe@example.com'
}
```

The response is a an object that you can pass directly to `Duo.init`. It is shown here for reference but you should not modify any of the properties.

```javascript
{
  host: config.host,
  sig_request: '<the signed duo request>',
  post_argument: 'response',
  post_action: '/duo/response?next=<path>'
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
