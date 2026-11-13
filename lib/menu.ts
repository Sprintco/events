// Demo menu content for the lounge. Edit freely; the /menu page renders whatever is here.
export type MenuItem = { name: string; price: string; desc?: string };
export type MenuSection = { title: string; note?: string; items: MenuItem[] };

export const DINNER: MenuSection[] = [
  {
    title: "Fancy Bites",
    note: "Raw & roasted, made for sharing",
    items: [
      { name: "Oysters on the Half Shell", price: "$24 / $48", desc: "Half or full dozen, champagne mignonette, fresh horseradish" },
      { name: "Tuna Crudo", price: "$22", desc: "Yuzu, chili oil, cucumber, crispy shallot" },
      { name: "Jerk Lamb Chops", price: "$38", desc: "Charred pineapple, scotch bonnet glaze" },
      { name: "Lobster Beignets", price: "$26", desc: "Saffron aioli, chive" },
    ],
  },
  {
    title: "Soup & Salad",
    items: [
      { name: "Wild Mushroom Bisque", price: "$14", desc: "Truffle cream, toasted brioche" },
      { name: "Little Gem Caesar", price: "$16", desc: "Parmesan crisp, white anchovy, lemon" },
      { name: "Burrata & Heirloom", price: "$19", desc: "Basil oil, aged balsamic, grilled focaccia" },
    ],
  },
  {
    title: "Entrées",
    note: "Sauces, seafood, and a little extra drama",
    items: [
      { name: "Filet Mignon, 8 oz", price: "$62", desc: "Whipped potato, bordelaise" },
      { name: "Dry-Aged Ribeye, 16 oz", price: "$84", desc: "Bone marrow butter, charred shallot" },
      { name: "Seared Scallops", price: "$48", desc: "Cauliflower purée, brown butter, capers" },
      { name: "Truffle Pizza", price: "$28", desc: "Fontina, wild mushrooms, arugula" },
      { name: "Make It Fancy", price: "+$16", desc: "Add crab, lobster tail or foie gras to any entrée" },
    ],
  },
  {
    title: "Sides",
    items: [
      { name: "Truffle Fries", price: "$12" },
      { name: "Creamed Spinach", price: "$11" },
      { name: "Roasted Brussels", price: "$11", desc: "Honey, chili, almond" },
    ],
  },
  {
    title: "Dessert",
    items: [
      { name: "Dark Chocolate Soufflé", price: "$16", desc: "Vanilla bean crème anglaise" },
      { name: "Burnt Basque Cheesecake", price: "$14", desc: "Seasonal fruit" },
    ],
  },
];

export const DRINKS: MenuSection[] = [
  {
    title: "Signature Cocktails",
    note: "Lighter, but never light",
    items: [
      { name: "The Velvet", price: "$18", desc: "Bourbon, cherry, amaro, smoked orange" },
      { name: "Midnight Rose", price: "$17", desc: "Gin, rose, lychee, sparkling wine" },
      { name: "Gold Rush", price: "$17", desc: "Rye, honey, lemon" },
      { name: "Fancy Old Fashioned", price: "$20", desc: "Aged rum, demerara, black walnut" },
      { name: "Espresso Martini", price: "$18", desc: "Vodka, cold brew, coffee liqueur" },
    ],
  },
  {
    title: "Champagne & Bubbles",
    items: [
      { name: "Veuve Clicquot Yellow Label", price: "$145" },
      { name: "Moët & Chandon Impérial", price: "$125" },
      { name: "Dom Pérignon", price: "$420" },
    ],
  },
  {
    title: "Bottle Service",
    note: "Includes mixers, garnish and a dedicated host",
    items: [
      { name: "Tequila: Don Julio 1942", price: "$480" },
      { name: "Vodka: Grey Goose", price: "$260" },
      { name: "Whiskey: Macallan 12", price: "$340" },
      { name: "Cognac: Hennessy VSOP", price: "$320" },
    ],
  },
];
