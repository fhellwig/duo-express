/*
 * MIT License
 *
 * Copyright (c) 2020 Frank Hellwig
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const duo = require('@duosecurity/duo_web');
const express = require('express');

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;

function middleware(config, paths) {
  checkConfig(config);

  const router = new express.Router();

  router.use(express.json());

  router.get('/duo', async (req, res) => {
    const session = getDuoSession(req);
    res.json({
      status: 'success',
      data: session
    });
  });

  router.post('/duo/sign', (req, res) => {
    const username = req.body.username;
    if (isString(username)) {
      const request = duo.sign_request(config.ikey, config.skey, config.akey, username);
      res.json({
        host: config.host,
        request: request
      });
    } else {
      res.status(BAD_REQUEST);
      res.json({
        status: 'fail',
        code: BAD_REQUEST,
        data: {
          username: 'Expected a string for this property'
        },
        message: 'Expected a username string property in request'
      });
    }
  });

  router.post('/duo/verify', (req, res) => {
    const response = req.body.response;
    if (isString(response)) {
      const username = duo.verify_response(config.ikey, config.skey, config.akey, response);
      if (username) {
        if (isObject(req.session)) {
          req.session.duo = { username };
        }
        res.json({
          status: 'success',
          data: {
            username
          }
        });
      } else {
        res.status(UNAUTHORIZED);
        res.json({
          status: 'error',
          code: UNAUTHORIZED,
          message: 'The Duo response could not be verified'
        });
      }
    } else {
      res.status(BAD_REQUEST);
      res.json({
        status: 'fail',
        code: BAD_REQUEST,
        data: {
          response: 'Expected a string for this property'
        },
        message: 'Expected a Duo response string property in request'
      });
    }
  });

  if (Array.isArray(paths)) {
    router.use('*', (req, res, next) => {
      if (paths.some((p) => req.baseUrl.startsWith(p))) {
        const session = getDuoSession(req);
        if (session) {
          next();
        } else {
          res.status(UNAUTHORIZED);
          res.json({
            status: 'error',
            code: UNAUTHORIZED,
            message: 'The user is not authorized for ' + req.baseUrl
          });
        }
      } else {
        next();
      }
    });
  }

  return router;
}

function checkConfig(config) {
  if (!isObject(config)) {
    throw new Error('Expected a config object');
  }
  if (!isString(config.ikey)) {
    throw new Error('Expected a string for the config.ikey property');
  }
  if (!isString(config.skey)) {
    throw new Error('Expected a string for the config.skey property');
  }
  if (!isString(config.akey)) {
    throw new Error('Expected a string for the config.akey property');
  }
  if (!isString(config.host)) {
    throw new Error('Expected a string for the config.host property');
  }
}

function getDuoSession(req) {
  if (!isObject(req.session)) {
    throw new Error('This middleware requires a session to work');
  }
  return req.session.duo || null;
}

function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

function isString(str, minLength = 1) {
  return typeof str === 'string' && str.length >= minLength;
}

module.exports = middleware;
