import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/app.jsx';

// Import Framework7 Bundle (core + all components)
import Framework7 from 'framework7/bundle';

// Import Framework7-React Plugin
import Framework7React from 'framework7-react';

// Import Framework7 Bundle Styles
import 'framework7/css/bundle';

// Import Icons
import 'framework7-icons/css/framework7-icons.css';
import 'material-icons/iconfont/material-icons.css';

// Import App custom styles
import '../css/app.css';

// Init F7 React Plugin
Framework7.use(Framework7React);

// Mount React App
const root = createRoot(document.getElementById('app'));
root.render(React.createElement(App));
