import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";
import { BrandFlipCard } from "./brand-flip-card";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Animated Brand Column — flips between Kravings & Flexirl */}
          <BrandFlipCard />

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-xl mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Home</Link></li>
              <li><Link href="/menu" className="text-muted-foreground hover:text-primary transition-colors text-sm">Our Menu</Link></li>
              <li><Link href="/#offers" className="text-muted-foreground hover:text-primary transition-colors text-sm">Offers</Link></li>
              <li><Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors text-sm">Track Order</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-xl mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><span className="text-muted-foreground text-sm">Privacy Policy</span></li>
              <li><span className="text-muted-foreground text-sm">Terms of Service</span></li>
              <li><span className="text-muted-foreground text-sm">Refund Policy</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="font-display text-xl mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/search/?q=Addis+Royal+Food,+KIIT+Road,+Patia,+Bhubaneswar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Near Royal Enfield Showroom, KIIT Road, Patia,<br />Bhubaneswar, Odisha 751024
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+918018332575" className="text-sm text-muted-foreground hover:text-primary transition-colors">+91 80183 32575</a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">12:00 PM – 2:00 AM (Daily)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kravings by ARF. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <span className="text-red-500">♥</span> for kiitians
            <a href="https://www.flexirl.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">&nbsp;by Flexirl.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

