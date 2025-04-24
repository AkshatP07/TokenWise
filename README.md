# TokenWise
A web-based dashboard to monitor top Fartcoin holders, real-time buy/sell transactions, and protocol activity on the Solana blockchain. Includes wallet insights, historical filters, and Excel export functionality for detailed analysis.

Features
Displays top 30 holders of a specified Solana token
Tracks token transactions including amount, timestamp, and protocol used
Filter transactions by type (buy/sell) and protocol (Jupiter, Raydium, Orca)
Historical transaction analysis with date range selection
Exportable transaction data

Project Structure
bash
Copy
Edit
.
├── client   # Frontend (Next.js)
└── api      # Backend (Node.js/Express or similar)
Getting Started
Clone the repository

Navigate into each directory (client and api) and install dependencies

Run both development servers locally

bash
Copy
Edit
git clone https://github.com/your-username/fartcoin-tracker.git
cd fartcoin-tracker

cd client
npm install
npm run dev
Open a new terminal tab/window:

bash
Copy
Edit
cd api
npm install
npm run dev
