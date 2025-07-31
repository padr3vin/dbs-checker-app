import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCOtW9WlEvIvfQ5e5_miQPgWdwRWJ_AoiA",
  authDomain: "dbs-check-105f1.firebaseapp.com",
  projectId: "dbs-check-105f1",
  storageBucket: "dbs-check-105f1.appspot.com",
  messagingSenderId: "178651185140",
  appId: "1:178651185140:web:3bc74047a8e9fd096fc3a1",
  measurementId: "G-0BJ5NL1T5Z"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? <DbsDashboard user={user} /> : <AuthScreen />}
    </div>
  );
}

// --- Authentication Screen Component ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          {isLogin ? 'Login to Your Account' : 'Create a New Account'}
        </h2>
        <form onSubmit={handleAuthAction} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLogin(!isLogin)} className="ml-1 font-semibold text-blue-600 hover:underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// --- Dashboard Component ---
function DbsDashboard({ user }) {
    const [employeeData, setEmployeeData] = useState({
        certificateNumber: '',
        surname: '',
        dob: '',
        employeeForename: '',
        employeeSurname: '',
    });
    const [statusResult, setStatusResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Make.com Configuration ---
    const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/9ei8ysxujfo0tg2ecequ86hn9u24f6ij';
    const MAKE_API_KEY = 'peanutbutterandjelly';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEmployeeData({ ...employeeData, [name]: value });
    };

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatusResult(null);

        try {
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-make-apikey': MAKE_API_KEY,
                },
                body: JSON.stringify({
                    ...employeeData,
                    organisationName: "DBS Checker App", // Using a static name for now
                    consent: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setStatusResult(result);
            
            const newHistoryEntry = {
                ...employeeData,
                status: result.status,
                checkedAt: new Date().toISOString(),
            };
            setHistory([newHistoryEntry, ...history]);

        } catch (err) {
            setError('Failed to connect to the status check service. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <header className="flex items-center justify-between pb-4 mb-8 border-b">
                <h1 className="text-3xl font-bold text-gray-800">DBS Status Tracker</h1>
                <div className="flex items-center">
                    <span className="mr-4 text-sm text-gray-600">{user.email}</span>
                    <button onClick={() => signOut(auth)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                        Logout
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* --- Input Form --- */}
                <div className="p-6 bg-white rounded-lg shadow-md lg:col-span-1">
                    <h2 className="mb-6 text-xl font-semibold text-gray-700">Check Employee Status</h2>
                    <form onSubmit={handleCheckStatus} className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-600">Applicant Details</h3>
                        <input
                            type="text"
                            name="certificateNumber"
                            value={employeeData.certificateNumber}
                            onChange={handleInputChange}
                            placeholder="DBS Certificate Number"
                            required
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="surname"
                            value={employeeData.surname}
                            onChange={handleInputChange}
                            placeholder="Applicant's Surname"
                            required
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            name="dob"
                            value={employeeData.dob}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <h3 className="pt-2 text-sm font-semibold text-gray-600">Your (Employer) Details</h3>
                         <input
                            type="text"
                            name="employeeForename"
                            value={employeeData.employeeForename}
                            onChange={handleInputChange}
                            placeholder="Your Forename"
                            required
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                         <input
                            type="text"
                            name="employeeSurname"
                            value={employeeData.employeeSurname}
                            onChange={handleInputChange}
                            placeholder="Your Surname"
                            required
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                        >
                            {loading ? 'Checking...' : 'Check Status'}
                        </button>
                    </form>
                    {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
                </div>

                {/* --- Results and History --- */}
                <div className="lg:col-span-2">
                    {/* --- Current Result --- */}
                    {statusResult && (
                        <div className={`p-6 mb-8 rounded-lg shadow-md ${statusResult.status === 'BLANK_NO_NEW_INFO' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <h3 className="text-lg font-semibold text-gray-800">Check Result</h3>
                            <p className={`text-2xl font-bold ${statusResult.status === 'BLANK_NO_NEW_INFO' ? 'text-green-700' : 'text-yellow-700'}`}>
                                {statusResult.status.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-600">{statusResult.message}</p>
                        </div>
                    )}

                    {/* --- History Log --- */}
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <h2 className="mb-4 text-xl font-semibold text-gray-700">Check History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2">Date</th>
                                        <th className="py-2">Certificate #</th>
                                        <th className="py-2">Surname</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length > 0 ? (
                                        history.map((entry, index) => (
                                            <tr key={index} className="border-b last:border-none">
                                                <td className="py-2 text-sm text-gray-600">{new Date(entry.checkedAt).toLocaleString()}</td>
                                                <td className="py-2 text-sm text-gray-800">{entry.certificateNumber}</td>
                                                <td className="py-2 text-sm text-gray-800">{entry.surname}</td>
                                                <td className={`py-2 text-sm font-semibold ${entry.status === 'BLANK_NO_NEW_INFO' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {entry.status.replace(/_/g, ' ')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-4 text-center text-gray-500">No checks have been made yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
