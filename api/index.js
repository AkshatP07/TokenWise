const axios = require('axios');
const express = require('express');
require('dotenv').config();
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 3000;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HELIUS_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=1a8cab10-9d12-4a99-bfb3-5ab3b242672f';
const fartcoin = '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump';

async function getBalanceSOL(walletAddress) {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [walletAddress]
    };

    const response = await makeRequestWithBackoff(payload);
    console.log(`[SOL Balance] Wallet: ${walletAddress}, Response:`, response?.data);
    return response?.data?.result.value / 1e9;
}



const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

async function saveTransactions(transactions, tokenAccount) {
  for (const tx of transactions) {
    try {
      const exists = await prisma.transaction.findUnique({
        where: { signature: tx.signature },
      });

      if (!exists) {
        let parsedTimestamp;
        if (tx.timestamp?.UTC_minus_4) {
          parsedTimestamp = dayjs(tx.timestamp.UTC_minus_4, 'DD/MM/YYYY, HH:mm:ss').toDate();
          if (isNaN(parsedTimestamp.getTime())) {
            throw new Error(`Invalid parsed date: ${tx.timestamp.UTC_minus_4}`);
          }
        } else {
          throw new Error(`Missing UTC_minus_4 in transaction: ${JSON.stringify(tx)}`);
        }

        await prisma.transaction.create({
          data: {
            signature: tx.signature,
            timestamp: parsedTimestamp,
            type: tx.type,
            amount: parseFloat(tx.amount),
            protocol: tx.protocol,
            tokenAccount,
          },
        });
      }
    } catch (err) {
      console.error(`Error saving transaction ${tx.signature}:`, err);
    }
  }
}


async function getTokenSupply(tokenMintAddress){
const payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenSupply",
    "params": [
      tokenMintAddress,{ commitment: "finalized" }
    ]};
const response = await makeRequestWithBackoff(payload);
console.log(`[Token Supply] Mint: ${tokenMintAddress}, Response:`, response?.data);
return response?.data?.result.value.uiAmount
}

async function getTokenBalance(walletAddress, tokenMintAddress) {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
            walletAddress,
            { mint: tokenMintAddress },
            { encoding: 'jsonParsed' }
        ]
    };
    const response = await makeRequestWithBackoff(payload);
    console.log(`[Token Balance] Wallet: ${walletAddress}, Token: ${tokenMintAddress}, Response:`, response?.data);

    const accounts = response?.data?.result.value;
    if (!accounts || accounts.length === 0) {
        return 0;
    }
    return accounts[0].account.data.parsed.info.tokenAmount.uiAmount;
}

async function getTokenLargestAccounts(tokenMintAddress) {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [tokenMintAddress, { commitment: "finalized" }]
    };
    const response = await makeRequestWithBackoff(payload);
    console.log(`[Largest Accounts] Token: ${tokenMintAddress}, Response:`, response?.data);

    return response?.data?.result.value || [];
}

async function getAccountOwner(tokenAccount) {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [tokenAccount, { encoding: "jsonParsed" }]
    };
    const response = await makeRequestWithBackoff(payload);
    console.log(`[Account Owner] Token Account: ${tokenAccount}, Response:`, response?.data);
    return response?.data?.result.value?.data?.parsed?.info?.owner || null;
}

function parseTransaction(txData, tokenAccountAddress) {
    if (!txData || !txData.transaction?.message?.instructions) return null;
  
    // Look for the parsed instruction with type "transferChecked"
    const transferInstruction = txData.transaction.message.instructions.find(
      (ins) => ins.parsed && (ins.parsed.type === "transferChecked" || ins.parsed.type ==="transfer")
    );
    
    if (!transferInstruction) {
        console.log('checking for v0');
        if(!txData.meta.innerInstructions.instructions) return null
         transferInstruction = txData.meta.innerInstructions.instructions.find(
            (ins) => ins.parsed && (ins.parsed.type === "transferChecked" || ins.parsed.type ==="transfer")
          );
    }
    if(!transferInstruction) return null


    const { destination } = transferInstruction.parsed.info;
    // If destination matches tokenAccountAddress, then it's a "buy", else "sell"
    const type = destination === tokenAccountAddress ? "buy" : "sell";
    
    // Extract the amount from tokenAmount.uiAmountString (or default to "0")
    const amount = transferInstruction.parsed.info.tokenAmount?.uiAmountString ||  ((parseFloat(transferInstruction.parsed.info.amount) / Math.pow(10, 6)))||   "0";
  
    // Use the program field from the same instruction as protocol
    const protocol = transferInstruction.program;
  
    return { type, amount, protocol };
  }
  
async function makeRequestWithBackoff(payload) {
    const maxRetries = 5;
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
        try {
            const response = await axios.post(HELIUS_RPC_ENDPOINT, payload, {
                headers: { "Content-Type": "application/json" }
            });
            return response;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
                attempt++;
            } else {
                console.error("RPC request failed:", error.message);
                return null;
            }
        }
    }
    console.error("Max retries exceeded.");
    return null;
}
async function getTokenPriceInUSDT(tokenMintAddress) {
    const usdtMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const amount = 1_000_000; // 1 token assuming 6 decimals

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${tokenMintAddress}&outputMint=${usdtMint}&amount=${amount}`;

    try {
        const response = await axios.get(url);
        const price = response.data?.data?.[0]?.outAmount;
        return price ? parseFloat(price) / 1_000_000 : null;
    } catch (err) {
        console.error("Failed to fetch price from Jupiter:", err.message);
        return null;
    }
}
async function transaction(tokenAccountAddress) {
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [tokenAccountAddress, { limit: 10 }]
    };

    const sigRes = await makeRequestWithBackoff(payload);
    const signatures = sigRes?.data?.result || [];

    const trans = [];

    for (const sig of signatures) {
        const txPayload = {
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: [sig.signature, { encoding: "jsonParsed" , "maxSupportedTransactionVersion": 0 }]
        };

        const txRes = await makeRequestWithBackoff(txPayload);
        const txData = txRes?.data?.result;
        if (!txData) console.log('no tx data')
        if (!txData) continue;


        const parsed = parseTransaction(txData, tokenAccountAddress);
        const priceFart = await getTokenPriceInUSDT('So11111111111111111111111111111111111111112')
        console.log(priceFart);
        const timestamp = txData.blockTime
  ? {
      UTC_minus_4: new Date(txData.blockTime * 1000).toLocaleString('en-GB', {
        timeZone: 'America/New_York',
      })
    }
  : "No timestamp available";

console.log("Timestamp:", timestamp);

       if(parsed) trans.push({ signature: sig.signature,timestamp:timestamp, ...parsed });
        // trans.push({ signature: sig.signature,timestamp:timestamp, ...txData });
    }

    return trans;
}

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],  // Optional: specify allowed HTTP methods
  }
  
  app.use(cors(corsOptions))

async function processTopHolders(tokenAccounts,tokenMint) {
    const result = [];
    console.log(`\n[Processing Top Holders]: ${tokenAccounts.length} accounts\n`);

    const supply = await getTokenSupply(tokenMint)

    for (const tokenAccount of tokenAccounts) {
        const holder = { tokenAccount: tokenAccount.address };
        try {
            const accountOwner = await getAccountOwner(tokenAccount.address);
            holder.owner = accountOwner;
            console.log(`\n[Holder Info]\nToken Account: ${tokenAccount.address}\nOwner: ${accountOwner}\nToken Amount: ${tokenAccount.amount}`);

            const solBalance = await getBalanceSOL(accountOwner);
            holder.solBalance = solBalance;
            console.log(`SOL Balance: ${solBalance} SOL`);

            const fartcoinBalance = await getTokenBalance(accountOwner, fartcoin);
            holder.fartcoinBalance = fartcoinBalance;
            console.log(`fartcoin Balance: ${fartcoinBalance} fartcoin/SOL`);

            const percentage = (Number(fartcoinBalance) / Number(supply)) * 100;
            holder.percentage = percentage;

        } catch (error) {
            console.error(`[Error] Fetching balances for ${tokenAccount.address}:`, error.message);
            holder.error = error.message;
        }
        result.push(holder);
    }

    return result;
}

app.get('/transactions/:tokenAccount', async (req, res) => {
    const { tokenAccount } = req.params;
    const { type, protocol, start, end, signature } = req.query;
    if (!tokenAccount) {
        return res.status(400).json({ error: "Token mint address required." });
    }
    try {
        const data = await transaction(tokenAccount);
        await saveTransactions(data, tokenAccount);
    } catch (error) {
        console.error("Server error:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }    
    const filters = {
      tokenAccount,
      ...(type && { type }),
      ...(protocol && { protocol }),
      ...(signature && { signature }),
      ...(start && end && {
        timestamp: {
          gte: new Date(start),
          lte: new Date(end),
        },
      }),
    };
  
    const transactions = await prisma.transaction.findMany({
      where: filters,
      orderBy: { timestamp: 'desc' },
    });
  
    res.json(transactions);
  });

  

app.get('/holders/:tokenMint', async (req, res) => {
    const { tokenMint } = req.params;

    console.log(`\n[API Hit] /holders/${tokenMint}\n`);

    if (!tokenMint) {
        return res.status(400).json({ error: "Token mint address required." });
    }

    try {
        const topTokenAccounts = await getTokenLargestAccounts(tokenMint);
         const homedata = await processTopHolders(topTokenAccounts,tokenMint);
        const accountOwner = await getAccountOwner(topTokenAccounts[0].address);
        const tokenAccountAddress = topTokenAccounts[0].address
       // const data = await transaction(tokenAccountAddress)
        res.json({tokenAccountAddress,accountOwner,homedata});
    } catch (error) {
        console.error("Server error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
