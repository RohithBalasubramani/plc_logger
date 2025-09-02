import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { Provider } from './state/store.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
  <Provider>
    <App />
  </Provider>
)
