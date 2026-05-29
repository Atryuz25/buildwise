import { AppRouter } from './app/router';
import { ToastProvider } from './shared/components/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
