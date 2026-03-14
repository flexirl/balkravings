"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  price: number;
  badgeColor: "green" | "yellow" | "red";
  badgeText: string;
}

const products: Product[] = [
  {
    id: "p1",
    image: "/biryanicoke.png",
    name: "Biryani Coke Combo",
    description:
      "Aromatic chicken biryani served with chilled Coke and creamy raita.",
    price: 199,
    badgeColor: "green",
    badgeText: "Student Favorite",
  },
  {
    id: "p2",
    image: "/aalocurd.png",
    name: "Two Paratha with Curd",
    description:
      "Golden, crispy parathas paired with fresh, cool homemade curd.",
    price: 99,
    badgeColor: "yellow",
    badgeText: "Top Rated",
  },
  {
    id: "p3",
    image: "/friedricecombo1.png",
    name: "Fried Rice with Chicken Chilli/Paneer Chilli",
    description:
      "Flavorful fried rice served with spicy chicken or paneer chilli.",
    price: 179,
    badgeColor: "red",
    badgeText: "Best Seller",
  },
];

const StarBadge = ({
  color,
  text,
}: {
  color: "green" | "yellow" | "red";
  text: string;
}) => {
  const colorClass =
    color === "green"
      ? "fill-tmg-green"
      : color === "yellow"
      ? "fill-tmg-yellow"
      : "fill-tmg-red";

  return (
    <div className="absolute -top-6 -right-4 w-[110px] h-[110px] z-10">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
        <path
          d="M100 0 L120 65 L190 50 L145 100 L190 150 L120 135 L100 200 L80 135 L10 150 L55 100 L10 50 L80 65 Z"
          className={colorClass}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center px-3">
        <span className="text-[10px] font-display text-center leading-tight text-primary-foreground whitespace-pre-line">
          {text}
        </span>
      </div>
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/menu");
  };

  return (
    <div className="flex flex-col items-center text-center max-w-[340px]">
      <div className="relative w-full mb-4">
        <div className="overflow-hidden rounded-xl relative">
          <Image
            src={product.image}
            alt={product.name}
            width={370}
            height={340}
            className="w-full h-[450px] object-cover rounded-xl transition-transform duration-500 hover:scale-105"
          />

          {/* Plus Button — LEFT SIDE */}
          <button
            onClick={handleClick}
            className="absolute bottom-3 left-3 h-10 w-10 rounded-full flex items-center justify-center shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <StarBadge color={product.badgeColor} text={product.badgeText} />
      </div>

      <h3 className="font-display text-xl tracking-wide text-foreground mb-2">
        {product.name}
      </h3>

      <p className="font-body text-sm text-muted-foreground leading-relaxed px-2">
        {product.description}
      </p>
    </div>
  );
};

export function BestSellersSection() {
  return (
    <section className="w-full bg-background py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <h2 className="font-display text-3xl md:text-[42px] tracking-wide text-[#d8232a] text-center leading-tight mb-2">
          WHAT EVERYONE&apos;S KRAVING ABOUT
        </h2>

        <p className="font-display text-sm md:text-base tracking-[0.25em] text-muted-foreground uppercase mb-12 md:mb-16">
          OUR BEST SELLERS
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 w-full mb-12 md:mb-16">
          {products.map((product) => (
            <div key={product.id} className="flex justify-center">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <a
          href="/menu"
          className="inline-block font-display text-sm md:text-base tracking-[0.15em] uppercase bg-primary text-primary-foreground px-10 py-4 rounded-full hover:opacity-90 transition-opacity duration-300"
        >
          START YOUR ORDER
        </a>
      </div>
    </section>
  );
}