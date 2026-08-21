import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const emptyBuyer = {
  name: "",
  email: "",
  phone: "",
  quantity: 1,
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  updates: true,
};

export default function Shop() {
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDiamond, setActiveDiamond] = useState(null);
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [showGst, setShowGst] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [successOrderId, setSuccessOrderId] = useState(null);

  useEffect(() => {
    api
      .get("/inventory/public")
      .then((res) => setDiamonds(res.data))
      .finally(() => setLoading(false));
  }, []);

  const openBuyModal = (diamond) => {
    setActiveDiamond(diamond);
    setBuyer(emptyBuyer);
    setShowGst(false);
    setPayError("");
    setSuccessOrderId(null);
  };

  const closeModal = () => {
    setActiveDiamond(null);
    setPaying(false);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPayError("");
    setPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPayError("Could not load payment gateway. Check your connection and try again.");
        setPaying(false);
        return;
      }

      const { data: orderData } = await api.post("/payment/create-order", {
        diamondId: activeDiamond._id,
        quantity: buyer.quantity,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Paladiya Brothers",
        description: `${activeDiamond.carat}ct ${activeDiamond.cut} ${activeDiamond.color} diamond`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: buyer.name,
          email: buyer.email,
          contact: buyer.phone,
        },
        theme: { color: "#B08D57" },
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              diamondId: activeDiamond._id,
              quantity: buyer.quantity,
              customerName: buyer.name,
              customerEmail: buyer.email,
              customerPhone: buyer.phone,
              shippingAddress: {
                line1: buyer.addressLine1,
                city: buyer.city,
                state: buyer.state,
                pincode: buyer.pincode,
              },
              gstNumber: buyer.gstNumber || undefined,
            });
            setSuccessOrderId(verifyData.orderId);
          } catch (err) {
            setPayError("Payment succeeded but order confirmation failed. Please contact us with your payment ID.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPayError("Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  const lineTotal = activeDiamond ? activeDiamond.price * buyer.quantity : 0;

  return (
    <div className="shop-page">
      <div className="inquiry-header">
        <Link to="/" className="inquiry-brand">Paladiya Brothers</Link>
      </div>

      <div className="shop-wrap">
        <h1>Available Diamonds</h1>
        <p className="shop-subtitle">Certified natural diamonds, ready to ship. Prices shown are per piece.</p>

        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : diamonds.length === 0 ? (
          <p className="empty-state">No diamonds available right now — check back soon.</p>
        ) : (
          <div className="shop-grid">
            {diamonds.map((d) => (
              <div key={d._id} className="shop-card">
                {d.images && d.images.length > 0 ? (
                  <img
                    src={d.images[0]}
                    alt={`${d.carat}ct ${d.cut} ${d.color} diamond`}
                    className="shop-card-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="shop-card-shape">{d.shape}</div>
                )}
                <h3>{d.carat}ct {d.cut}</h3>
                <p className="shop-card-specs">{d.color} · {d.clarity}{d.certification ? ` · ${d.certification}` : ""}</p>
                <div className="shop-card-price">₹{d.price.toLocaleString("en-IN")}</div>
                <p className="shop-card-stock">{d.stockQuantity} in stock</p>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => openBuyModal(d)}>
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeDiamond && (
        <div className="shop-modal-overlay" onClick={closeModal}>
          <div className="checkout-panel" onClick={(e) => e.stopPropagation()}>
            {successOrderId ? (
              <div className="inquiry-success" style={{ margin: 0, boxShadow: "none", border: "none" }}>
                <h2>Payment successful!</h2>
                <p>Your order has been placed. Our team will reach out to arrange delivery.</p>
                <button className="btn btn-primary" onClick={closeModal}>Close</button>
              </div>
            ) : (
              <form onSubmit={handlePay}>
                <div className="checkout-header">
                  <span>Checkout</span>
                  <button type="button" className="checkout-close" onClick={closeModal} aria-label="Close">✕</button>
                </div>

                <div className="checkout-section">
                  <div className="checkout-section-title">Order Summary · 1 item</div>
                  <div className="checkout-order-row">
                    {activeDiamond.images && activeDiamond.images.length > 0 ? (
                      <img
                        src={activeDiamond.images[0]}
                        alt={`${activeDiamond.carat}ct ${activeDiamond.cut} diamond`}
                        className="checkout-order-thumb-image"
                      />
                    ) : (
                      <div className="checkout-order-thumb">{activeDiamond.shape?.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div className="checkout-order-info">
                      <div className="checkout-order-name">
                        {activeDiamond.carat}ct {activeDiamond.cut} {activeDiamond.color}
                      </div>
                      <div className="checkout-order-specs">
                        {activeDiamond.clarity}{activeDiamond.certification ? ` · ${activeDiamond.certification}` : ""}
                      </div>
                    </div>
                    <div className="checkout-order-price">₹{lineTotal.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="checkout-qty-row">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={activeDiamond.stockQuantity}
                      value={buyer.quantity}
                      onChange={(e) =>
                        setBuyer({ ...buyer, quantity: Math.max(1, Math.min(activeDiamond.stockQuantity, Number(e.target.value))) })
                      }
                    />
                  </div>
                </div>

                <div className="checkout-section">
                  {showGst ? (
                    <input
                      placeholder="GST Number (optional)"
                      value={buyer.gstNumber}
                      onChange={(e) => setBuyer({ ...buyer, gstNumber: e.target.value })}
                    />
                  ) : (
                    <button type="button" className="checkout-add-link" onClick={() => setShowGst(true)}>
                      + Add GST number
                    </button>
                  )}
                </div>

                <div className="checkout-section">
                  <div className="checkout-section-title">Contact Details</div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <input placeholder="Full Name*" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} required />
                    <input placeholder="Email*" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} required />
                    <input placeholder="Phone*" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} required />
                  </div>
                </div>

                <div className="checkout-section">
                  <div className="checkout-section-title">Delivery Address</div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <input placeholder="Address*" value={buyer.addressLine1} onChange={(e) => setBuyer({ ...buyer, addressLine1: e.target.value })} required />
                  </div>
                  <div className="form-grid" style={{ marginTop: 10 }}>
                    <input placeholder="City*" value={buyer.city} onChange={(e) => setBuyer({ ...buyer, city: e.target.value })} required />
                    <input placeholder="State*" value={buyer.state} onChange={(e) => setBuyer({ ...buyer, state: e.target.value })} required />
                  </div>
                  <div className="form-grid" style={{ marginTop: 10, gridTemplateColumns: "1fr" }}>
                    <input placeholder="Pincode*" value={buyer.pincode} onChange={(e) => setBuyer({ ...buyer, pincode: e.target.value })} required />
                  </div>
                </div>

                <div className="checkout-section checkout-shipping-row">
                  <span>Standard Delivery</span>
                  <span className="checkout-free-tag">FREE</span>
                </div>

                <div className="checkout-updates-row">
                  <input
                    type="checkbox"
                    id="updates"
                    checked={buyer.updates}
                    onChange={(e) => setBuyer({ ...buyer, updates: e.target.checked })}
                  />
                  <label htmlFor="updates">Send me offers and order updates</label>
                </div>

                {payError && <p className="error">{payError}</p>}

                <button type="submit" className="btn btn-primary inquiry-submit-btn" disabled={paying}>
                  {paying ? "Processing…" : `Pay ₹${lineTotal.toLocaleString("en-IN")}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}