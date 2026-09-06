/* Shared published Lesson 000 content. Studio device drafts remain private. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ExpresateLesson000=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function letterEntry(letter, word, spanish, asset) {
    const imagePath = `assets/alphabet/examples/${asset}.webp`;
    const example = { word, spanish, pronunciation: word, imagePath };
    return { letter, sound: letter, word, pronunciation: word, spanish, imagePath, examples: [example], tip: "" };
  }

  const DEFAULT_LETTERS = {
    a: letterEntry("A", "Apple", "Manzana", "a-apple"),
    b: letterEntry("B", "Ball", "Pelota", "b-ball"),
    c: letterEntry("C", "Cat", "Gato", "c-cat"),
    d: letterEntry("D", "Dog", "Perro", "d-dog"),
    e: letterEntry("E", "Elephant", "Elefante", "e-elephant"),
    f: letterEntry("F", "Fish", "Pez", "f-fish"),
    g: letterEntry("G", "Goat", "Cabra", "g-goat"),
    h: letterEntry("H", "Hat", "Sombrero", "h-hat"),
    i: letterEntry("I", "Ice cream", "Helado", "i-ice-cream"),
    j: letterEntry("J", "Juice", "Jugo", "j-juice"),
    k: letterEntry("K", "Kite", "Cometa", "k-kite"),
    l: letterEntry("L", "Lion", "León", "l-lion"),
    m: letterEntry("M", "Moon", "Luna", "m-moon"),
    n: letterEntry("N", "Nest", "Nido", "n-nest"),
    o: letterEntry("O", "Orange", "Naranja", "o-orange"),
    p: letterEntry("P", "Pizza", "Pizza", "p-pizza"),
    q: letterEntry("Q", "Queen", "Reina", "q-queen"),
    r: letterEntry("R", "Rabbit", "Conejo", "r-rabbit"),
    s: letterEntry("S", "Sun", "Sol", "s-sun"),
    t: letterEntry("T", "Turtle", "Tortuga", "t-turtle"),
    u: letterEntry("U", "Umbrella", "Paraguas", "u-umbrella"),
    v: letterEntry("V", "Violin", "Violín", "v-violin"),
    w: letterEntry("W", "Whale", "Ballena", "w-whale"),
    x: letterEntry("X", "Xylophone", "Xilófono", "x-xylophone"),
    y: letterEntry("Y", "Yo-yo", "Yo-yo", "y-yo-yo"),
    z: letterEntry("Z", "Zebra", "Cebra", "z-zebra")
  };

 const recognition=[{target:'g',choices:['b','g','j','t']},{target:'m',choices:['n','m','w','e']},{target:'s',choices:['f','s','x','z']}];
 const spelling=[{target:['C','A','T'],choices:['C','A','T','B']},{target:['M','A','P'],choices:['M','A','P','N']},{target:['B','O','O','K'],choices:['B','O','O','K','D','P']}];
 return {id:'lesson-000-alphabet',title:'El alfabeto',xpReward:10,letters:DEFAULT_LETTERS,recognition,spelling};
});
