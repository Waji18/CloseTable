const restaurants = [
    
    {
      name: "Serafina Miami",
      cuisine: "Italian",
      location: "Aventura",
      price: "$$$",
      booked: 56,
      rating: "★★★★★",
      reviews: 1384,
      image: "https://media.architecturaldigest.com/photos/66c8923688f5dc5cc31e1e35/16:9/w_2560%2Cc_limit/CH_BAD_ROMAN_NYC_ROUND_1_020323952A.jpg", // Random Italian restaurant image
    },
    {
      name: "Sumak",
      cuisine: "Mediterranean",
      location: "Normandie",
      price: "$$$",
      booked: 19,
      rating: "★★★★★",
      reviews: 87,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTs3SeSEa4k0ASrlB8UzbIGh_6T40nDEvrKg&s", // Random Mediterranean restaurant image
    },
    {
      name: "Mykonos Kitchen and Bar",
      cuisine: "Mediterranean",
      location: "North ML",
      price: "$$$",
      booked: 25,
      rating: "★★★★",
      reviews: 146,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDv5EpSgcVeBe_EaOFbdTVLpGRbhMz8xI14g&s", // Random Greek restaurant image
    },
    {
      name: "CHICA Miami",
      cuisine: "Latin American",
      location: "Morning",
      price: "$$$",
      booked: 37,
      rating: "★★★★★",
      reviews: 2245,
      image: "https://www.telegraph.co.uk/content/dam/food-and-drink/2016/08/03/Cabana-Newcastle_trans_NvBQzQNjv4Bqeo_i_u9APj8RuoebjoAHt0k9u7HhRJvuo-ZLenGRumA.jpg?imwidth=680", // Random Latin American restaurant image
    },
    {
      name: "Tanuki River Landing",
      cuisine: "Asian",
      location: "Alligatush",
      price: "$$$",
      booked: 43,
      rating: "★★★★★",
      reviews: 522,
      image: "https://source.unsplash.com/300x200/?restaurant,asian", // Random Asian restaurant image
    },
    {
      name: "The Rusty Spoon",
      cuisine: "American",
      location: "Downtown",
      price: "$$",
      booked: 12,
      rating: "★★★★",
      reviews: 345,
      image: "https://source.unsplash.com/300x200/?restaurant,american", // Random American restaurant image
    },
    {
      name: "La Petite Maison",
      cuisine: "French",
      location: "Uptown",
      price: "$$$$",
      booked: 8,
      rating: "★★★★★",
      reviews: 789,
      image: "https://source.unsplash.com/300x200/?restaurant,french", // Random French restaurant image
    },
    {
      name: "Sushi Samba",
      cuisine: "Japanese",
      location: "South Beach",
      price: "$$$",
      booked: 34,
      rating: "★★★★★",
      reviews: 1234,
      image: "https://source.unsplash.com/300x200/?restaurant,japanese", // Random Japanese restaurant image
    },
    {
      name: "Bistro Central",
      cuisine: "European",
      location: "Central District",
      price: "$$",
      booked: 22,
      rating: "★★★★",
      reviews: 456,
      image: "https://source.unsplash.com/300x200/?restaurant,european", // Random European restaurant image
    },
    {
      name: "The Green Fork",
      cuisine: "Vegetarian",
      location: "Eco Park",
      price: "$$",
      booked: 15,
      rating: "★★★★",
      reviews: 321,
      image: "https://source.unsplash.com/300x200/?restaurant,vegetarian", // Random Vegetarian restaurant image
    },
    {
      name: "Ocean's Edge",
      cuisine: "Seafood",
      location: "Harbor Side",
      price: "$$$$",
      booked: 10,
      rating: "★★★★★",
      reviews: 987,
      image: "https://source.unsplash.com/300x200/?restaurant,seafood", // Random Seafood restaurant image
    },
    {
      name: "Pasta Palace",
      cuisine: "Italian",
      location: "Little Italy",
      price: "$$",
      booked: 18,
      rating: "★★★★",
      reviews: 654,
      image: "https://source.unsplash.com/300x200/?restaurant,pasta", // Random Pasta restaurant image
    },
    {
      name: "The Spice Route",
      cuisine: "Indian",
      location: "East End",
      price: "$$",
      booked: 20,
      rating: "★★★★",
      reviews: 543,
      image: "https://source.unsplash.com/300x200/?restaurant,indian", // Random Indian restaurant image
    },
    {
      name: "Burger Barn",
      cuisine: "American",
      location: "Westside",
      price: "$",
      booked: 30,
      rating: "★★★",
      reviews: 234,
      image: "https://source.unsplash.com/300x200/?restaurant,burger", // Random Burger restaurant image
    },
    {
      name: "Taco Haven",
      cuisine: "Mexican",
      location: "Southside",
      price: "$",
      booked: 25,
      rating: "★★★",
      reviews: 345,
      image: "https://source.unsplash.com/300x200/?restaurant,mexican", // Random Mexican restaurant image
    },
    {
      name: "The Golden Wok",
      cuisine: "Chinese",
      location: "Chinatown",
      price: "$$",
      booked: 14,
      rating: "★★★★",
      reviews: 432,
      image: "https://source.unsplash.com/300x200/?restaurant,chinese", // Random Chinese restaurant image
    },
    {
      name: "Café Parisien",
      cuisine: "French",
      location: "Riverside",
      price: "$$$",
      booked: 9,
      rating: "★★★★★",
      reviews: 876,
      image: "https://source.unsplash.com/300x200/?restaurant,cafe", // Random Café image
    },
    {
      name: "The Steakhouse",
      cuisine: "Steakhouse",
      location: "Meatpacking District",
      price: "$$$$",
      booked: 7,
      rating: "★★★★★",
      reviews: 765,
      image: "https://source.unsplash.com/300x200/?restaurant,steak", // Random Steakhouse image
    },
    {
      name: "Veggie Delight",
      cuisine: "Vegan",
      location: "Green Valley",
      price: "$$",
      booked: 12,
      rating: "★★★★",
      reviews: 321,
      image: "https://source.unsplash.com/300x200/?restaurant,vegan", // Random Vegan restaurant image
    },
    {
      name: "The Pizza Place",
      cuisine: "Italian",
      location: "Pizza Lane",
      price: "$",
      booked: 28,
      rating: "★★★",
      reviews: 456,
      image: "https://source.unsplash.com/300x200/?restaurant,pizza", // Random Pizza restaurant image
    },
  ];
  
  export default restaurants;