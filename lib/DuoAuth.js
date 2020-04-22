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

import React, { useContext, useReducer, useEffect, useRef } from 'react';
import axios from 'axios';
import Duo from '@duosecurity/duo_web/js/Duo-Web-v2.min.js';

const DUO_ENDPOINT = '/duo';

//------------------------------------------------------------------------------
// Context and the useDuoAuth convenience function
//------------------------------------------------------------------------------

const DuoAuthContext = React.createContext();

export function useDuoAuth() {
  return useContext(DuoAuthContext);
}

//------------------------------------------------------------------------------
// Reducer and associated action types
//------------------------------------------------------------------------------

export const actionTypes = {
  SET_USERNAME: 'setUsername'
};

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_USERNAME:
      return { ...state, username: action.payload };
    default:
      throw new Error('Invalid action type: ' + action.type);
  }
}

//------------------------------------------------------------------------------
// The DuoAuthProvider to wrap those parts of the app that need authentication
//------------------------------------------------------------------------------

export function DuoAuthProvider({ duoEndpoint, redirectUri, checkInterval, children }) {
  const [state, dispatch] = useReducer(reducer, { username: null });
  const duoRequest = apiRequest.bind(null, duoEndpoint || DUO_ENDPOINT);

  async function login(username) {
    const data = await duoRequest('POST', {
      username: username,
      redirect: redirectUri || null
    });
    if (data) {
      Duo.init(data);
    }
  }

  async function logout() {
    await duoRequest('DELETE');
    dispatch({ type: actionTypes.SET_USERNAME, payload: null });
  }

  async function check() {
    const data = await duoRequest('GET');
    const username = data ? data.username : null;
    if (state.username !== username) {
      dispatch({ type: actionTypes.SET_USERNAME, payload: username });
    }
  }

  useEffect(() => {
    check();
  }, []);

  useInterval(check, typeof checkInterval === 'number' ? checkInterval : null);

  //return <DuoAuthContext.Provider value={{ state, login, logout }}>{children}</DuoAuthContext.Provider>;
  return React.createElement(DuoAuthContext.Provider, {value:{ state, login, logout }}, children);
}

//------------------------------------------------------------------------------
// Internal helper functions
//------------------------------------------------------------------------------

/**
 * A generic API request. The path is the first parameter so it can be bound
 * to a specific path. On error, the error is logged and null is returned.
 *
 * @param {string} path - the endpoint path
 * @param {string} method - the HTTP method
 * @param {string} data - the data to send in a post
 *
 * @returns The response data or null on error.
 */
async function apiRequest(path, method, data) {
  const config = {
    method: method,
    url: path,
    responseType: 'json',
    withCredentials: true,
    headers: { Pragma: 'no-cache' },
    data: data
  };
  try {
    const response = await axios(config);
    return response.data;
  } catch (err) {
    if (err.response && err.response.message) {
      console.error(err.response.message);
    } else {
      console.error(err.message);
    }
    return null;
  }
}

/**
 * A react hook for an interval timer.
 * Copied from: https://github.com/donavon/use-interval
 *
 * @param {function} callback - the function to call at each interval
 * @param {number} delay - the delay in milliseconds or null to stop
 */
const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (...args) => savedCallback.current(...args);

    if (delay !== null) {
      const id = setInterval(handler, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
