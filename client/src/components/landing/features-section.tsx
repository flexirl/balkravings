import { Timer, ShieldCheck, IndianRupee, Moon } from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "20-Min Delivery in KIIT & Nearby Areas",
    desc: "We deliver across Patia, Chandrasekharpur & KIIT. Hunger shouldn't wait, and neither should you.",
  },
  {
    icon: ShieldCheck,
    title: "Hygienic & Fresh Ingredients",
    desc: "FSSAI certified kitchen. We treat your food as if we are feeding our own family.",
  },
  {
    icon: IndianRupee,
    title: "Student-Friendly Pricing",
    desc: "Premium quality food that doesn't burn a hole in your pocket.",
  },
  {
    icon: Moon,
    title: "Late Night Open (Till 1 AM)",
    desc: "Got a late-night study session or gaming marathon? We've got your back till 1 AM.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4">
            Why People <span className="text-[#D91729]">Choose Us</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We built Kravings by ARF,<br/> specifically to solve the food problems we faced ourselves.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
              
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-all duration-300 shadow-sm">
                <f.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
