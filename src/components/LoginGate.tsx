import { useState, type ReactNode } from 'react';
import { Lock } from 'lucide-react';

const VALID_USER = 'demo';
const VALID_PASS = 'forecast2026';
const SESSION_KEY = 'df_authenticated';

export default function LoginGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 w-full max-w-sm space-y-5"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-900/40 mb-3">
            <Lock className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-100">Demand Forecasting</h1>
          <p className="text-xs text-gray-400 mt-1">Enter credentials to continue</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false); }}
            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center">Invalid username or password</p>
        )}

        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
