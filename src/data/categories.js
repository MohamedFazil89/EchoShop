export const categories = [
  {
    id: "home-decoration",
    name: "Home Decor",
    tagline: "Stylish décor & accents",
    image: "https://picsum.photos/seed/home-decoration/600/700",
  },
  {
    id: "groceries",
    name: "Groceries",
    tagline: "Fresh pantry essentials",
    image: "https://picsum.photos/seed/groceries/600/700",
  },
  {
    id: "fragrances",
    name: "Fragrances",
    tagline: "Eco-friendly scents",
    image: "https://picsum.photos/seed/fragrances/600/700",
  },
  {
    id: "kitchen-accessories",
    name: "Kitchen Accessories",
    tagline: "Tools for every kitchen",
    image: "https://picsum.photos/seed/kitchen-accessories/600/700",
  },
];

export const getCategoryById = (id) => categories.find((c) => c.id === id);
