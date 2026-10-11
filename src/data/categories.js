export const categories = [
  {
    id: "cookware",
    name: "Cookware",
    tagline: "Pots and pans for everyday cooking",
    image: "/products/p02.jpg",
  },
  {
    id: "drinkware",
    name: "Drinkware",
    tagline: "Bottles, mugs, and coffee essentials",
    image: "/products/p01.jpg",
  },
  {
    id: "kitchen-tools",
    name: "Kitchen Tools",
    tagline: "Useful pieces for prep and serving",
    image: "/products/p19.jpg",
  },
  {
    id: "food-storage",
    name: "Food Storage",
    tagline: "Containers and reusable coverings",
    image: "/products/p05.jpg",
  },
  {
    id: "kitchen-textiles",
    name: "Kitchen Textiles",
    tagline: "Aprons and reusable kitchen fabrics",
    image: "/products/p18.jpg",
  },
  {
    id: "tableware",
    name: "Tableware",
    tagline: "Everyday dining and serving",
    image: "/products/p11.jpg",
  },
  {
    id: "home-decor",
    name: "Home Decor",
    tagline: "Simple accents for the home",
    image: "/products/p15.jpg",
  },
  {
    id: "bakeware",
    name: "Bakeware",
    tagline: "Tools for home baking",
    image: "/products/p22.jpg",
  },
  {
    id: "kitchen-cleaning",
    name: "Kitchen Cleaning",
    tagline: "Reusable tools for routine cleanup",
    image: "/products/p23.jpg",
  },
];

export const getCategoryById = (id) => categories.find((category) => category.id === id);
