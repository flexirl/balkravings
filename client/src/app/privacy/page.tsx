import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Kravings Kitchen by ARF — how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-10 pt-28 max-w-3xl">
      <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 28, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-foreground/90 text-[15px] leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">1. Who We Are</h2>
          <p>
            Kravings Kitchen is operated by <strong>Addis Royal Food (ARF)</strong>, a cloud kitchen based in Patia, Bhubaneswar, Odisha. 
            When we say &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;, we mean Kravings Kitchen / ARF.
          </p>
          <p className="mt-2">
            Website: <a href="https://www.kravingskitchen.in" className="text-primary hover:underline">www.kravingskitchen.in</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">2. Information We Collect</h2>
          <p>We collect the following information when you use our website or place an order:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1.5">
            <li><strong>Account information</strong> — name, email address, phone number (when you register or sign in via Google)</li>
            <li><strong>Delivery details</strong> — delivery address, hostel/room number, special instructions</li>
            <li><strong>Order history</strong> — items ordered, order totals, timestamps</li>
            <li><strong>Device data</strong> — browser type, IP address, and cookies for site functionality</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>To process and deliver your food orders</li>
            <li>To create and manage your account</li>
            <li>To communicate about your orders (WhatsApp, email)</li>
            <li>To send promotional offers and updates (only if you opt in)</li>
            <li>To improve our menu, service, and website experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1.5">
            <li><strong>Supabase</strong> — authentication and database hosting</li>
            <li><strong>Google OAuth</strong> — for sign-in with Google</li>
            <li><strong>Razorpay / UPI</strong> — for payment processing (we do not store card/UPI details)</li>
            <li><strong>Render</strong> — application hosting</li>
          </ul>
          <p className="mt-2">
            These services have their own privacy policies. We do not sell or rent your personal data to any third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">5. Cookies</h2>
          <p>
            We use essential cookies to keep you logged in and remember your cart. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">6. Data Security</h2>
          <p>
            We take reasonable measures to protect your information, including HTTPS encryption, secure database hosting, and access controls. 
            However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">7. Your Rights</h2>
          <p>You can:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1.5">
            <li>Access and update your profile information at any time</li>
            <li>Request deletion of your account by contacting us</li>
            <li>Opt out of marketing emails</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">8. Contact Us</h2>
          <p>
            For any privacy-related questions or requests, reach out to us:
          </p>
          <ul className="list-none pl-0 mt-2 space-y-1">
            <li>📧 Email: <a href="mailto:kravingskitchen@gmail.com" className="text-primary hover:underline">kravingskitchen@gmail.com</a></li>
            <li>📱 WhatsApp: <a href="https://wa.me/918018332575" className="text-primary hover:underline">+91 80183 32575</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground font-sans mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Any changes will be reflected on this page with an updated date. 
            Continued use of our website after changes constitutes acceptance of the updated policy.
          </p>
        </section>

      </div>
    </div>
  )
}
