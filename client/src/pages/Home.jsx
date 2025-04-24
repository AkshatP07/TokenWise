import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';

const Home = () => {
  const [homedata, setHomedata] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND;
        const fullUrl = `${baseUrl}/holders/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump`;
        console.log('Fetching from:', fullUrl); // Debug
        const response = await axios.get(fullUrl);
        setHomedata(response.data.homedata);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching homedata:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', {
      style: {
        background: '#1f2937',
        color: '#ffffff',
        border: '1px solid #4b5563',

      },
    });
  };

  const truncate = (str) => str.slice(0, 4) + '...' + str.slice(-4);

  const toMillions = (num) => (num / 1_000_000).toFixed(2) + 'M';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <ClipLoader color="#6366f1" size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-400 text-center">Token Holder Data</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Rank</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Owner Address</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Token Address</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">SOL Balance</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Fartcoin Balance</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Percentage</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {homedata.map((item, index) => (
              <tr key={index} className="hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{index + 1}</td>
                <td
                  className="px-4 py-3 border-b border-gray-700 text-sm text-indigo-300 cursor-pointer hover:text-indigo-500 transition-colors font-mono"
                  onClick={() => copyToClipboard(item.owner)}
                  title={item.owner}
                >
                  {truncate(item.owner)}
                </td>
                <td
                  className="px-4 py-3 border-b border-gray-700 text-sm text-indigo-300 cursor-pointer hover:text-indigo-500 transition-colors font-mono"
                  onClick={() => copyToClipboard(item.tokenAccount)}
                  title={item.tokenAccount}
                >
                  {truncate(item.tokenAccount)}
                </td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{toMillions(item.solBalance)}</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{toMillions(item.fartcoinBalance)}</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{item.percentage.toFixed(2)}%</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">
                  <a
                    href={`/transactions/${item.tokenAccount}`}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;