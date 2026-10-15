
import React, { useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";

import {
  getWallet,
  getWalletTransactions,
} from "../api/services/userWalletService";

import "./Wallet.css";

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const [walletResponse, transactionResponse] = await Promise.all([
        getWallet(),
        getWalletTransactions(),
      ]);

      if (walletResponse.success) {
        setBalance(Number(walletResponse.wallet?.balance || 0));
      }

      if (transactionResponse.success) {
        const transactionData =
          transactionResponse.transactions ||
          transactionResponse.wallet?.transactions ||
          [];

        setTransactions(Array.isArray(transactionData) ? transactionData : []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your wallet. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleAddMoney = (e) => {
    e.preventDefault();
    setMessage("");

    const money = Number(amount);

    if (!amount || !Number.isFinite(money) || money <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    if (money < 1) {
      setMessage("The minimum amount is ₹1.");
      return;
    }

    setAddingMoney(true);

    // A verified payment gateway must be integrated before
    // money can safely be credited to the wallet.
    setMessage(
      "Online wallet top-up is not connected yet. Your balance has not been changed."
    );

    setAddingMoney(false);
  };

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <div>
          <p className="wallet-eyebrow">SOLESTYLE ACCOUNT</p>
          <h1>My Wallet</h1>
          <p className="wallet-subtitle">
            Manage your balance and keep track of your transactions.
          </p>
        </div>

        <button
          type="button"
          className="wallet-refresh-button"
          onClick={loadWallet}
          disabled={loading}
          aria-label="Refresh wallet"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="wallet-error">
          <p>{error}</p>
          <button type="button" onClick={loadWallet}>
            Try again
          </button>
        </div>
      )}

      {message && (
        <div className="wallet-message" role="status">
          {message}
        </div>
      )}

      <div className="wallet-top-grid">
        <section className="wallet-balance-card">
          <div className="wallet-card-top">
            <div className="wallet-icon-circle">
              <WalletIcon size={25} />
            </div>
            <span className="wallet-card-label">AVAILABLE BALANCE</span>
          </div>

          <p className="wallet-balance-amount">
            {loading ? "Loading..." : formatMoney(balance)}
          </p>

          <p className="wallet-balance-description">
            Your balance for eligible SOLESTYLE purchases.
          </p>

          <div className="wallet-card-bottom">
            <ShieldCheck size={17} />
            <span>Wallet balance protected by your account</span>
          </div>
        </section>

        <section className="wallet-add-card">
          <div className="wallet-section-heading">
            <div className="wallet-small-icon">
              <Plus size={20} />
            </div>
            <div>
              <h2>Add Money</h2>
              <p>Add funds to your SOLESTYLE wallet.</p>
            </div>
          </div>

          <form onSubmit={handleAddMoney}>
            <label htmlFor="wallet-amount">Amount (₹)</label>

            <div className="wallet-amount-input">
              <span>₹</span>
              <input
                id="wallet-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setMessage("");
                }}
              />
            </div>

            <div className="wallet-quick-amounts">
              {[500, 1000, 2000].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setAmount(String(value));
                    setMessage("");
                  }}
                >
                  ₹{value.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="wallet-add-button"
              disabled={addingMoney}
            >
              <Plus size={18} />
              Add Money
            </button>

            <p className="wallet-payment-note">
              Payment gateway integration is required to add money securely.
            </p>
          </form>
        </section>
      </div>

      <section className="wallet-transactions-section">
        <div className="wallet-transactions-header">
          <div>
            <h2>Transaction History</h2>
            <p>Review your wallet credits and debits.</p>
          </div>

          <span className="wallet-transaction-count">
            {transactions.length} transactions
          </span>
        </div>

        {loading ? (
          <div className="wallet-empty-state">
            <RefreshCw size={25} />
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="wallet-empty-state">
            <div className="wallet-empty-icon">
              <Clock size={27} />
            </div>
            <h3>No transactions yet</h3>
            <p>
              Your wallet payments, refunds, and credits will appear here.
            </p>
          </div>
        ) : (
          <div className="wallet-transaction-list">
            {transactions.map((transaction, index) => {
              const isCredit =
                String(transaction.type).toLowerCase() === "credit";

              return (
                <div
                  className="wallet-transaction-row"
                  key={
                    transaction._id ||
                    transaction.transactionId ||
                    index
                  }
                >
                  <div
                    className={`wallet-transaction-icon ${
                      isCredit ? "credit" : "debit"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>

                  <div className="wallet-transaction-details">
                    <h3>
                      {transaction.description ||
                        (isCredit ? "Wallet Credit" : "Wallet Debit")}
                    </h3>
                    <p>{formatDate(transaction.createdAt)}</p>
                    {transaction.transactionId && (
                      <span>
                        ID: {transaction.transactionId}
                      </span>
                    )}
                  </div>

                  <div className="wallet-transaction-amount">
                    <strong className={isCredit ? "credit-text" : "debit-text"}>
                      {isCredit ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </strong>
                    <span>
                      Balance: {formatMoney(transaction.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Wallet;
