import Link from "next/link";
import { ChefHat, MapPin, Phone, Clock, Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-[family-name:var(--font-galindo)] text-xl leading-none tracking-wide text-primary">KRAVINGS <br />by ARF</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Premium cloud kitchen serving hot, hygiene-first, and chef-crafted meals for students & professionals across KIIT, Patia & nearby areas in Bhubaneswar.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://www.instagram.com/kravings_by.arf/" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://facebook.com/kravingsbyarf" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://twitter.com/kravingsbyarf" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

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
            <a href="https://www.flexirl.com">  by Flexirl.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
