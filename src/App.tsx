import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { AppProviders } from './app/providers'

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  )
}
