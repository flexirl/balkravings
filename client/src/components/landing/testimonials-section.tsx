import { Star } from "lucide-react";

// Mock Testimonials
const TESTIMONIALS = [
  {
    name: "Sneha Das",
    role: "B.Tech IT, 2nd Year",
    content: "hostel mess band tha so I tried the aloo paratha + dahi raita combo and bhai it literally tasted like ghar ka khana?? the paratha was soft and stuffed properly not some dry maida thing. now every sunday I skip mess and order from here instead 😭",
    rating: 5,
    avatarId: 10,
  },
  {
    name: "Rohit Mehra",
    role: "Hostel KP-5",
    content: "ordered matar paneer with fried rice for dinner and my roommate was like 'bro ye hostel mein kaise aa gaya'. that's the best review I can give lol. also the egg curry is underrated, tastes like something my mom would make ngl 😂",
    rating: 5,
    avatarId: 20,
  },
  {
    name: "Ananya Mishra",
    role: "MBA, 1st Year",
    content: "was craving chicken biryani at midnight and most places were closed. these guys delivered in 20 mins and the biryani had actual chicken pieces not just bones 😭 also tried their paneer bhurji paratha combo last week — pure comfort food. wallet is suffering tho because I keep ordering",
    rating: 4,
    avatarId: 30,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative bg-secondary/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4">
            Loved by <span className="text-[#d8232a]">KIITians</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            THEY CAME. THEY CRAVED. THEY CAME BACK. HERE’S WHY.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 relative">
              {/* Quotation mark decor */}
              <div className="absolute top-6 right-8 text-primary/10 font-serif text-6xl leading-none font-bold">&quot;</div>
              
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`h-5 w-5 ${j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-8 text-sm md:text-base relative z-10">
                &quot;{t.content}&quot;
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 font-display text-xl">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
