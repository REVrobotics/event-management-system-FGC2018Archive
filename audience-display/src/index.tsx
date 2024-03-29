import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {CookiesProvider} from "react-cookie";
import App from './App';
import './index.css';

ReactDOM.render(
  <CookiesProvider>
    <App/>
  </CookiesProvider>,
  document.getElementById('root') as HTMLElement
);