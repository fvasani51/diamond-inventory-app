import { Link } from "react-router-dom";
import useReveal from "../components/useReveal";
import "./Landing.css";

function FacetMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 11L16 4L26 11L16 28L6 11Z" stroke="#B08D57" strokeWidth="1" strokeLinejoin="round" />
      <path d="M6 11H26M11 11L16 4L21 11M11 11L16 28M21 11L16 28" stroke="#B08D57" strokeWidth="0.6" />
    </svg>
  );
}

export default function Landing() {
  const [aboutRef, aboutVisible] = useReveal();
  const [expertiseHeadRef, expertiseHeadVisible] = useReveal();
  const [cardsRef, cardsVisible] = useReveal(0.05);
  const [trustRef, trustVisible] = useReveal(0.08);
  const [ctaRef, ctaVisible] = useReveal();

  return (
    <div className="lp">
      {/* ---------- Nav ---------- */}
      <nav className="lp-nav">
        <div className="brand">
          <FacetMark size={26} />
          <div className="brand-text">
            <h2>Paladiya Brothers</h2>
            <span>Est. 1997 &middot; Mumbai</span>
          </div>
        </div>
        <div className="lp-nav-links">
          <a href="#about">About</a>
          <a href="#expertise">Expertise</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-actions">
          <Link to="/shop" className="btn-ghost">Shop</Link>
          <Link to="/inquiry" className="btn-ghost">Inquiry</Link>
          <Link to="/login" className="btn-ghost">Staff Login</Link>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="lp-hero">
        <svg className="lp-hero-facet" width="520" height="520" viewBox="0 0 32 32" fill="none">
          <path d="M6 11L16 4L26 11L16 28L6 11Z" stroke="#B08D57" strokeWidth="0.35" strokeLinejoin="round" />
          <path d="M6 11H26M11 11L16 4L21 11M11 11L16 28M21 11L16 28" stroke="#B08D57" strokeWidth="0.2" />
        </svg>
        <div className="lp-hero-inner">
          <div className="lp-eyebrow">B2B Diamond Manufacturing Since 1997</div>
          <h1>Your sourcing<br />begins with <em>trust.</em></h1>
          <p className="lead">
            Paladiya Brothers is a natural diamond manufacturer based at the Bharat
            Diamond Bourse, Mumbai — supplying certified stock worldwide with
            consistent quality and transparent deals.
          </p>
          <div className="lp-hero-ctas">
            <Link to="/inquiry"><button className="lp-btn-primary">Submit an Inquiry</button></Link>
            <Link to="/login"><button className="lp-btn-secondary">Staff / Admin Login</button></Link>
          </div>
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="num"><span>28</span>+</div>
              <div className="label">Years in trade</div>
            </div>
            <div className="lp-stat">
              <div className="num">Mumbai</div>
              <div className="label">Bharat Diamond Bourse</div>
            </div>
            <div className="lp-stat">
              <div className="num">Worldwide</div>
              <div className="label">Shipping &amp; supply</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section className="lp-section" id="about">
        <div ref={aboutRef} className={`lp-about lp-reveal ${aboutVisible ? "is-visible" : ""}`}>
          <div className="lp-about-copy">
            <div className="lp-eyebrow">Our Story</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", marginBottom: "18px", fontWeight: 600 }}>
              Three decades of daily stock, delivered on trust.
            </h2>
            <p>
              Since 1997, Paladiya Brothers has built a reputation in the Mumbai
              diamond trade on one principle: consistency. Every stone that leaves
              our office is graded, tracked, and backed by a relationship, not just
              a transaction.
            </p>
            <p>
              Operating out of the Bharat Diamond Bourse, we run daily stock
              updates for our B2B partners and maintain a steady supply chain that
              reaches buyers across the globe — from natural rough to certified
              polished diamonds.
            </p>
          </div>
          <div className="lp-about-visual">
            <FacetMark size={140} />
            <div className="lp-about-tag">HW5012, Bharat Diamond Bourse — BKC, Mumbai</div>
          </div>
        </div>
      </section>

      <div className="lp-divider"><div className="line" /><FacetMark size={16} /><div className="line" /></div>

      {/* ---------- Expertise ---------- */}
      <section className="lp-section" id="expertise">
        <div ref={expertiseHeadRef} className={`lp-section-head lp-reveal ${expertiseHeadVisible ? "is-visible" : ""}`}>
          <div className="lp-eyebrow">What we do</div>
          <h2>End-to-end diamond trade, under one roof.</h2>
          <p>From sourcing rough stones to shipping certified inventory worldwide, every stage is handled in-house.</p>
        </div>
        <div ref={cardsRef} className={`lp-cards lp-reveal-stagger ${cardsVisible ? "is-visible" : ""}`}>
          <div className="lp-card">
            <span className="lp-card-num">01</span>
            <h3>Sourcing</h3>
            <p>Direct access to rough diamond supply, selected for cut, clarity, and long-term consistency of stock.</p>
          </div>
          <div className="lp-card">
            <span className="lp-card-num">02</span>
            <h3>Manufacturing</h3>
            <p>In-house cutting and polishing to precise carat, cut, color, and clarity specifications for every order.</p>
          </div>
          <div className="lp-card">
            <span className="lp-card-num">03</span>
            <h3>Global Supply</h3>
            <p>Reliable worldwide shipping with transparent pricing and daily-updated stock for B2B partners.</p>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="lp-trust">
        <div ref={trustRef} className={`lp-trust-inner lp-reveal-stagger ${trustVisible ? "is-visible" : ""}`}>
          <div className="lp-trust-item">
            <div className="dot" />
            <p><strong>Since 1997</strong>Nearly three decades of continuous diamond trade.</p>
          </div>
          <div className="lp-trust-item">
            <div className="dot" />
            <p><strong>Trusted quality</strong>Every stone graded and tracked before it ships.</p>
          </div>
          <div className="lp-trust-item">
            <div className="dot" />
            <p><strong>Transparent deals</strong>Clear pricing and honest communication, every order.</p>
          </div>
          <div className="lp-trust-item">
            <div className="dot" />
            <p><strong>Worldwide shipping</strong>Consistent supply to partners across the globe.</p>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section ref={ctaRef} className={`lp-cta lp-reveal ${ctaVisible ? "is-visible" : ""}`}>
        <h2>Manage the business behind the trade.</h2>
        <p>Staff and admin access to inventory, orders, and customer records.</p>
        <Link to="/login"><button className="lp-btn-primary">Go to Dashboard</button></Link>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-footer" id="contact">
        <div className="lp-footer-inner lp-footer-inner-v2">
          <div className="lp-footer-brand">
            <div className="brand">
              <FacetMark size={24} />
              <div className="brand-text"><h2>Paladiya Brothers</h2></div>
            </div>
            <p>B2B natural diamond manufacturing and supply, based in India since 1997.</p>
          </div>

          <div className="lp-footer-nav">
            <Link to="/"><span className="chevron">›</span> Home</Link>
            <a href="#about"><span className="chevron">›</span> About Us</a>
            <a href="#expertise"><span className="chevron">›</span> Sourcing &amp; Manufacturing</a>
            <a href="#expertise"><span className="chevron">›</span> Product Portfolio</a>
            <Link to="/shop"><span className="chevron">›</span> Shop</Link>
            <Link to="/inquiry"><span className="chevron">›</span> Inquiry</Link>
            <a href="#contact"><span className="chevron">›</span> Contact Us</a>
          </div>

          <div className="lp-office-block">
            <h4>Head Office</h4>
            <p className="lp-office-line">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              25-26, Sarthi Industrial Estate, Nandu Doshi ni Wadi, Vasta Devdi Road, Katargam, Surat - 395004.
            </p>
            <p className="lp-office-line">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              +91 261 2531091 / 92 / 93
            </p>
          </div>

          <div className="lp-office-block">
            <h4>Branch Office</h4>
            <p className="lp-office-line">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              HW5012, Bharat Diamond Bourse, Bandra Kurla Complex, Bandra East, Mumbai 400051
            </p>
            <p className="lp-office-line">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              +91 22 46111 111
            </p>
            <p className="lp-office-line">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
              <a href="mailto:info@pb.diamonds">info@pb.diamonds</a>
            </p>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} PALADIYA BROTHERS</p>
          <p>INVENTORY SYSTEM — INTERNAL USE</p>
        </div>
      </footer>
    </div>
  );
}