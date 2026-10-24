
import React, { useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Gift,
} from "lucide-react";

import {
  getWallet,
  getWalletTransactions,
   createWalletTopUp,
  verifyWalletTopUp,
} from "../api/services/userWalletService";


import "./Wallet.css";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });


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

  
const handleAddMoney = async (e) => {
  e.preventDefault();
  setMessage("");

  const money = Number(amount);

  if (!amount || !Number.isFinite(money) || money < 1 || money > 50000) {
    setMessage("Enter an amount between ₹1 and ₹50,000.");
    return;
  }

  if (Math.abs(money * 100 - Math.round(money * 100)) > 0.000001) {
    setMessage("Enter an amount with at most two decimal places.");
    return;
  }

  setAddingMoney(true);

  try {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error("Unable to load Razorpay. Check your connection.");
    }

    const created = await createWalletTopUp(money);

    if (!created.success || !created.razorpayOrder || !created.keyId) {
      throw new Error(created.message || "Unable to start wallet top-up.");
    }

    const result = await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: created.keyId,
        amount: created.razorpayOrder.amount,
        currency: created.razorpayOrder.currency,
        name: "SOLESTYLE",
        description: "Wallet top-up",
        order_id: created.razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            const verification = await verifyWalletTopUp({
              ...paymentResponse,
              amount: money,
            });

            if (!verification.success) {
              throw new Error(
                verification.message || "Wallet payment verification failed."
              );
            }

            resolve(verification);
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => resolve(null),
        },
        theme: { color: "#c2185b" },
      });

      checkout.on("payment.failed", (event) => {
        reject(
          new Error(
            event.error?.description || "Wallet payment failed."
          )
        );
      });

      checkout.open();
    });

    if (!result) {
      setMessage("Payment window closed. Your wallet has not been credited.");
      return;
    }

    setBalance(Number(result.wallet?.balance || 0));
    setAmount("");
    setMessage("Wallet topped up successfully.");
    await loadWallet();
  } catch (err) {
    setMessage(
      err.response?.data?.message ||
        err.message ||
        "Unable to add money. Please try again."
    );
  } finally {
    setAddingMoney(false);
  }
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

  const totalReferralRewards = transactions.reduce((total, transaction) => {
  const isReferralReward =
    transaction.referenceType === "Referral" ||
    String(transaction.transactionId || "").startsWith("REFERRAL-");

  if (
    isReferralReward &&
    String(transaction.type).toLowerCase() === "credit"
  ) {
    return total + Number(transaction.amount || 0);
  }

  return total;
}, 0);

const referralRewardCount = transactions.filter((transaction) => {
  const isReferralReward =
    transaction.referenceType === "Referral" ||
    String(transaction.transactionId || "").startsWith("REFERRAL-");

  return (
    isReferralReward &&
    String(transaction.type).toLowerCase() === "credit"
  );
}).length;

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
  Secure wallet top-ups are processed through Razorpay.
</p>
          </form>
        </section>
      </div>

      <section className="wallet-referral-summary">
  <div className="wallet-referral-icon">
    <Gift size={24} />
  </div>

  <div className="wallet-referral-details">
    <h2>Referral Rewards</h2>
    <p>
      Total rewards earned from referring friends.
    </p>
    <span>
      {referralRewardCount}{" "}
      {referralRewardCount === 1 ? "reward received" : "rewards received"}
    </span>
  </div>

  <div className="wallet-referral-total">
    <span>Total Earned</span>
    <strong>{formatMoney(totalReferralRewards)}</strong>
  </div>
</section>

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
