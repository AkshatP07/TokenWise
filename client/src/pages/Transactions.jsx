import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { ClipLoader } from "react-spinners";

const Transactions = () => {
  const { tokenAccount } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const setQueryParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    navigate({ search: params.toString() });
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      const query = new URLSearchParams({
        type: searchParams.get("type") || "",
        protocol: searchParams.get("protocol") || "",
        signature: searchParams.get("signature") || "",
        start: searchParams.get("start") || "",
        end: searchParams.get("end") || "",
      }).toString();

      try {
        const baseUrl = import.meta.env.VITE_BACKEND;
        const fullUrl = `${baseUrl}/transactions/${tokenAccount}?${query}`;
        console.log('Fetching from:', fullUrl); // Debug
        const res = await fetch(fullUrl);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        } else {
          console.error("Failed to fetch transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAccount) {
      fetchTransactions();
    }
  }, [tokenAccount, searchParams]);

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export", {
        style: {
          background: "#1f2937",
          color: "#ffffff",
          border: "1px solid #4b5563",
        },
      });
      return;
    }
    const cleanData = transactions.map(({ signature, timestamp, type, amount, protocol }) => ({
      signature,
      timestamp: new Date(timestamp).toLocaleString(),
      type,
      amount,
      protocol,
    }));
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${tokenAccount}.xlsx`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", {
      style: {
        background: "#1f2937",
        color: "#ffffff",
        border: "1px solid #4b5563",
      },
    });
  };

  const truncate = (str) => str.slice(0, 5) + "..." + str.slice(-5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <ClipLoader color="#6366f1" size={50} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-2 text-indigo-400 text-center">Transactions for Fartcoin token</h2>
      <h3 className="text-sl font-bold mb-6 text-indigo-400 text-center cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => copyToClipboard('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump')} >9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump</h3>
      
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
          <label className="block text-sm mb-1">Start</label>
          <input
            type="date"
            onChange={(e) => setQueryParam("start", e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End</label>
          <input
            type="date"
            onChange={(e) => setQueryParam("end", e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <div className="flex gap-2">
            <button onClick={() => setQueryParam("type", "")} className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">All</button>
            <button onClick={() => setQueryParam("type", "buy")} className="bg-green-700 px-3 py-1 rounded hover:bg-green-600">Buy</button>
            <button onClick={() => setQueryParam("type", "sell")} className="bg-red-700 px-3 py-1 rounded hover:bg-red-600">Sell</button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Protocol</label>
          <div className="flex gap-2">
            <button onClick={() => setQueryParam("protocol", "")} className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">All</button>
            <button onClick={() => setQueryParam("protocol", "jupiter")} className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600">Jupiter</button>
            <button onClick={() => setQueryParam("protocol", "raydium")} className="bg-purple-700 px-3 py-1 rounded hover:bg-purple-600">Raydium</button>
            <button onClick={() => setQueryParam("protocol", "orca")} className="bg-yellow-700 px-3 py-1 rounded hover:bg-yellow-600">Orca</button>
          </div>
        </div>

       
      </div>

      <button
        onClick={exportToCSV}
        className="bg-indigo-500 text-white p-2 rounded-lg mb-4 hover:bg-indigo-400 transition"
      >
        Export to Excel
      </button>

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Signature</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Timestamp</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 border-b border-gray-700 text-left text-sm font-semibold">Protocol</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.signature} className="hover:bg-gray-700 transition-colors">
                <td
                  className="px-4 py-3 border-b border-gray-700 text-sm text-indigo-300 cursor-pointer hover:text-indigo-500 transition-colors"
                  onClick={() => copyToClipboard(tx.signature)}
                >
                  {truncate(tx.signature)}
                </td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{new Date(tx.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{tx.type}</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{tx.amount}</td>
                <td className="px-4 py-3 border-b border-gray-700 text-sm">{tx.protocol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toaster />
    </div>
  );
};

export default Transactions;
