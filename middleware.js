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

const duoApi = require('@duosecurity/duo_api');
const duoWeb = require('@duosecurity/duo_web');
const express = require('express');

const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;

function middleware(config) {
  checkConfig(config);

  const client = new duoApi.Client(config.ikey, config.skey, config.host);
  const router = new express.Router();

  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  router.post('/duo', (req, res) => {
    checkSession(req);
    const username = req.body.username;
    if (isString(username)) {
      preauth(username)
        .then(() => {
          const request = duoWeb.sign_request(config.ikey, config.skey, config.akey, username);
          res.json({
            host: config.host,
            sig_request: request,
            post_argument: 'response',
            post_action: createActionUrl(req)
          });
        })
        .catch((err) => {
          res.status(UNAUTHORIZED);
          res.json({ message: err.message });
        });
    } else {
      res.status(BAD_REQUEST);
      res.json({ message: 'Expected a username string property in request.' });
    }
  });


  router.post('/duo/response', (req, res) => {
    checkSession(req);
    const username = duoWeb.verify_response(
      config.ikey,
      config.skey,
      config.akey,
      req.body.response
    );
    if (username) {
      req.session.duo = { username };
      if (isString(req.query.redirect)) {
        res.redirect(req.query.redirect);
      } else {
        res.sendStatus(NO_CONTENT);
      }
    } else {
      req.session.duo = null;
      res.sendStatus(UNAUTHORIZED);
    }
  });

  router.get('/duo', (req, res) => {
    checkSession(req);
    res.json(req.session.duo || null);
  });

  router.delete('/duo', (req, res) => {
    checkSession(req);
    delete req.session.duo;
    res.sendStatus(NO_CONTENT);
  });

  async function preauth(username) {
    return new Promise((resolve, reject) => {
      client.jsonApiCall('POST', '/auth/v2/preauth', { username }, (res) => {
        if (res.stat === 'OK') {
          if (res.response.result === 'deny') {
            reject(new Error(res.response.status_msg));
          } else {
            resolve();
          }
        } else {
          reject(new Error(res.message));
        }
      });
    });
  }

  return router;
}

function checkConfig(config) {
  if (!isObject(config)) {
    throw new Error('Expected a config object.');
  }
  if (!isString(config.ikey)) {
    throw new Error('Expected a string for the config.ikey property.');
  }
  if (!isString(config.skey)) {
    throw new Error('Expected a string for the config.skey property.');
  }
  if (!isString(config.akey)) {
    throw new Error('Expected a string for the config.akey property.');
  }
  if (!isString(config.host)) {
    throw new Error('Expected a string for the config.host property.');
  }
}

function checkSession(req) {
  if (!isObject(req.session)) {
    throw new Error(
      'No session object found in request. You must create a session middleware using express-session.'
    );
  }
}

function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

function isString(str, minLength = 1) {
  return typeof str === 'string' && str.length >= minLength;
}

function createActionUrl(req) {
  const buf = [req.originalUrl];
  if (req.originalUrl.slice(-1) !== '/') {
    buf.push('/');
  }
  buf.push('response');
  if (isString(req.body.redirect)) {
    buf.push('?redirect=');
    buf.push(req.body.redirect);
  }
  return buf.join('');
}

module.exports = middleware;
