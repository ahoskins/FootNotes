import React from 'react';
import ReactDOM from 'react-dom';
import Root from './root.jsx';

const container = document.createElement('div');
container.style.position = 'fixed';
container.style.bottom = '0px';
container.style.width = '100%';
container.style.zIndex = 100;
document.body.appendChild(container);

ReactDOM.render(<Root />, container);
