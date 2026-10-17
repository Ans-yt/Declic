import { t } from "./i18n";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles.css';
import '../superr.css';
import './workspace.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
import './media-kit.css';
import './catalogue.css';

import './map.css';
import './awards-access.css';
