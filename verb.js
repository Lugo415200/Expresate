// verb.js — Approved verb database for Exprésate
// Each entry: base, present, past, pp, ing, es, aliases[], examples[]
// aliases  — Spanish conjugated forms used by the search index
// examples — 3 EN + ES sentence pairs shown in the result card
// Add a new verb by copying any block below and filling all fields.

window.VERB_DB = {

  // ── CORE IRREGULARS ───────────────────────────────────────────

  have: {
    base: "have", present: "has", past: "had", pp: "had", ing: "having",
    es: "tener",
    aliases: [
      "tengo","tienes","tiene","tenemos","tienen",
      "tuve","tuviste","tuvo","tuvimos","tuvieron",
      "teniendo"
    ],
    examples: [
      { en: "I have a meeting at 3 PM.",   es: "Tengo una reunión a las 3 PM." },
      { en: "She has two brothers.",        es: "Ella tiene dos hermanos." },
      { en: "I had breakfast already.",     es: "Ya desayuné." }
    ]
  },

  do: {
    base: "do", present: "does", past: "did", pp: "done", ing: "doing",
    es: "hacer",
    aliases: [
      "hago","haces","hace","hacemos","hacen",
      "hice","hiciste","hizo","hicimos","hicieron",
      "haciendo"
    ],
    examples: [
      { en: "I do my homework every night.", es: "Hago mi tarea cada noche." },
      { en: "She does yoga in the morning.", es: "Ella hace yoga por la mañana." },
      { en: "I did my best.",                es: "Hice lo mejor que pude." }
    ]
  },

  go: {
    base: "go", present: "goes", past: "went", pp: "gone", ing: "going",
    es: "ir",
    aliases: [
      "voy","vas","va","vamos","van",
      "fui","fuiste","fue","fuimos","fueron",
      "yendo"
    ],
    examples: [
      { en: "I go to work by bus.",            es: "Voy al trabajo en autobús." },
      { en: "She goes to the gym on Mondays.", es: "Ella va al gimnasio los lunes." },
      { en: "I went to the store yesterday.",  es: "Fui a la tienda ayer." }
    ]
  },

  be: {
    base: "be", present: "is", past: "was/were", pp: "been", ing: "being",
    es: "ser/estar",
    aliases: [
      "soy","eres","somos","son",
      "estoy","estas","esta","estamos","estan",
      "era","eras","eramos","eran",
      "estaba","estabas","estabamos","estaban",
      "fui","fuiste","fue","fuimos","fueron",
      "estuve","estuviste","estuvo","estuvimos","estuvieron",
      "siendo","estando"
    ],
    examples: [
      { en: "I am a nurse.",              es: "Soy enfermero/a." },
      { en: "She is tired today.",        es: "Ella está cansada hoy." },
      { en: "I was at home yesterday.",   es: "Estuve en casa ayer." }
    ]
  },

  // ── COMMON IRREGULARS ─────────────────────────────────────────

  eat: {
    base: "eat", present: "eats", past: "ate", pp: "eaten", ing: "eating",
    es: "comer",
    audio: "audio/words/eat.wav",
    aliases: [
      "como","comes","come","comemos","comen",
      "comi","comiste","comio","comimos","comieron",
      "comiendo"
    ],
    examples: [
      { en: "I eat breakfast every morning.", es: "Desayuno todas las mañanas." },
      { en: "She eats healthy food.",          es: "Ella come comida saludable." },
      { en: "We ate pizza last night.",        es: "Comimos pizza anoche." }
    ]
  },

  see: {
    base: "see", present: "sees", past: "saw", pp: "seen", ing: "seeing",
    es: "ver",
    aliases: [
      "veo","ves","ve","vemos","ven",
      "vi","viste","vio","vimos","vieron",
      "viendo"
    ],
    examples: [
      { en: "I see what you mean.",              es: "Veo lo que quieres decir." },
      { en: "She sees her family on weekends.",  es: "Ella ve a su familia los fines de semana." },
      { en: "I saw that movie last week.",       es: "Vi esa película la semana pasada." }
    ]
  },

  take: {
    base: "take", present: "takes", past: "took", pp: "taken", ing: "taking",
    es: "tomar/llevar",
    aliases: [
      "tomo","tomas","toma","tomamos","toman",
      "tome","tomaste","tomo","tomamos","tomaron",
      "tomando",
      "llevo","llevas","lleva","llevamos","llevan",
      "lleve","llevaste","llevo","llevamos","llevaron",
      "llevando"
    ],
    examples: [
      { en: "I take the bus to work.",   es: "Tomo el autobús al trabajo." },
      { en: "She takes good photos.",    es: "Ella toma buenas fotos." },
      { en: "I took my medicine.",       es: "Tomé mi medicina." }
    ]
  },

  make: {
    base: "make", present: "makes", past: "made", pp: "made", ing: "making",
    es: "hacer/crear",
    aliases: [
      "creo","creas","crea","creamos","crean",
      "cree","creaste","creo","creamos","crearon",
      "creando"
    ],
    examples: [
      { en: "I make coffee every morning.", es: "Hago café cada mañana." },
      { en: "She makes the best food.",     es: "Ella hace la mejor comida." },
      { en: "I made a mistake.",            es: "Cometí un error." }
    ]
  },

  get: {
    base: "get", present: "gets", past: "got", pp: "gotten/got", ing: "getting",
    es: "obtener/conseguir",
    aliases: [
      "obtengo","obtienes","obtiene","obtenemos","obtienen",
      "obtuve","obtuviste","obtuvo","obtuvimos","obtuvieron",
      "obteniendo",
      "consigo","consigues","consigue","conseguimos","consiguen",
      "consegui","conseguiste","consiguio","conseguimos","consiguieron",
      "consiguiendo"
    ],
    examples: [
      { en: "I get up at 7 every day.",     es: "Me levanto a las 7 todos los días." },
      { en: "She gets good grades.",        es: "Ella obtiene buenas calificaciones." },
      { en: "I got your message.",          es: "Recibí tu mensaje." }
    ]
  },

  // ── REGULAR VERBS ─────────────────────────────────────────────

  work: {
    base: "work", present: "works", past: "worked", pp: "worked", ing: "working",
    es: "trabajar",
    aliases: [
      "trabajo","trabajas","trabaja","trabajamos","trabajan",
      "trabaje","trabajaste","trabajo","trabajamos","trabajaron",
      "trabajando"
    ],
    examples: [
      { en: "I work at a hospital.",       es: "Trabajo en un hospital." },
      { en: "She works from home.",        es: "Ella trabaja desde casa." },
      { en: "We worked all weekend.",      es: "Trabajamos todo el fin de semana." }
    ]
  },

  study: {
    base: "study", present: "studies", past: "studied", pp: "studied", ing: "studying",
    es: "estudiar",
    aliases: [
      "estudio","estudias","estudia","estudiamos","estudian",
      "estudie","estudiaste","estudio","estudiamos","estudiaron",
      "estudiando"
    ],
    examples: [
      { en: "I study English every day.", es: "Estudio inglés todos los días." },
      { en: "She studies at night.",      es: "Ella estudia de noche." },
      { en: "I studied for the exam.",    es: "Estudié para el examen." }
    ]
  },

  live: {
    base: "live", present: "lives", past: "lived", pp: "lived", ing: "living",
    es: "vivir",
    aliases: [
      "vivo","vives","vive","vivimos","viven",
      "vivi","viviste","vivio","vivimos","vivieron",
      "viviendo"
    ],
    examples: [
      { en: "I live in Miami.",                es: "Vivo en Miami." },
      { en: "She lives near the park.",        es: "Ella vive cerca del parque." },
      { en: "I lived in Mexico for 2 years.",  es: "Viví en México por 2 años." }
    ]
  },

  learn: {
    base: "learn", present: "learns", past: "learned/learnt", pp: "learned/learnt", ing: "learning",
    es: "aprender",
    aliases: [
      "aprendo","aprendes","aprende","aprendemos","aprenden",
      "aprendi","aprendiste","aprendio","aprendimos","aprendieron",
      "aprendiendo"
    ],
    examples: [
      { en: "I learn something new every day.", es: "Aprendo algo nuevo cada día." },
      { en: "She learns fast.",                 es: "Ella aprende rápido." },
      { en: "I learned English in 2 years.",    es: "Aprendí inglés en 2 años." }
    ]
  },

  want: {
    base: "want", present: "wants", past: "wanted", pp: "wanted", ing: "wanting",
    es: "querer",
    aliases: [
      "quiero","quieres","quiere","queremos","quieren",
      "quise","quisiste","quiso","quisimos","quisieron",
      "queriendo"
    ],
    examples: [
      { en: "I want a coffee, please.",  es: "Quiero un café, por favor." },
      { en: "She wants to travel.",      es: "Ella quiere viajar." },
      { en: "I wanted to call you.",     es: "Quería llamarte." }
    ]
  },

  need: {
    base: "need", present: "needs", past: "needed", pp: "needed", ing: "needing",
    es: "necesitar",
    aliases: [
      "necesito","necesitas","necesita","necesitamos","necesitan",
      "necesite","necesitaste","necesito","necesitamos","necesitaron",
      "necesitando"
    ],
    examples: [
      { en: "I need more time.",      es: "Necesito más tiempo." },
      { en: "She needs help.",        es: "Ella necesita ayuda." },
      { en: "I needed a break.",      es: "Necesitaba un descanso." }
    ]
  },

  look: {
    base: "look", present: "looks", past: "looked", pp: "looked", ing: "looking",
    es: "mirar/buscar",
    aliases: [
      "miro","miras","mira","miramos","miran",
      "mire","miraste","miro","miramos","miraron",
      "mirando",
      "busco","buscas","busca","buscamos","buscan",
      "busque","buscaste","busco","buscamos","buscaron",
      "buscando"
    ],
    examples: [
      { en: "Look at that!",             es: "¡Mira eso!" },
      { en: "She looks happy today.",    es: "Ella parece feliz hoy." },
      { en: "I looked for my keys.",     es: "Busqué mis llaves." }
    ]
  },

  call: {
    base: "call", present: "calls", past: "called", pp: "called", ing: "calling",
    es: "llamar",
    aliases: [
      "llamo","llamas","llama","llamamos","llaman",
      "llame","llamaste","llamo","llamamos","llamaron",
      "llamando"
    ],
    examples: [
      { en: "I call my mom every Sunday.", es: "Llamo a mi mamá cada domingo." },
      { en: "She calls me every night.",   es: "Ella me llama cada noche." },
      { en: "I called you this morning.",  es: "Te llamé esta mañana." }
    ]
  },

  help: {
    base: "help", present: "helps", past: "helped", pp: "helped", ing: "helping",
    es: "ayudar",
    aliases: [
      "ayudo","ayudas","ayuda","ayudamos","ayudan",
      "ayude","ayudaste","ayudo","ayudamos","ayudaron",
      "ayudando"
    ],
    examples: [
      { en: "Can you help me?",           es: "¿Me puedes ayudar?" },
      { en: "She helps her neighbors.",   es: "Ella ayuda a sus vecinos." },
      { en: "I helped him move.",         es: "Lo ayudé a mudarse." }
    ]
  },

  buy: {
    base: "buy", present: "buys", past: "bought", pp: "bought", ing: "buying",
    es: "comprar",
    aliases: [
      "compro","compras","compra","compramos","compran",
      "compre","compraste","compro","compramos","compraron",
      "comprando"
    ],
    examples: [
      { en: "I buy groceries on Saturdays.", es: "Compro víveres los sábados." },
      { en: "She buys everything online.",   es: "Ella compra todo en línea." },
      { en: "I bought a new phone.",         es: "Compré un teléfono nuevo." }
    ]
  },

  pay: {
    base: "pay", present: "pays", past: "paid", pp: "paid", ing: "paying",
    es: "pagar",
    aliases: [
      "pago","pagas","paga","pagamos","pagan",
      "pague","pagaste","pago","pagamos","pagaron",
      "pagando"
    ],
    examples: [
      { en: "I pay rent on the first.",  es: "Pago la renta el primero." },
      { en: "She pays with her phone.",  es: "Ella paga con su teléfono." },
      { en: "I paid the bill.",          es: "Pagué la cuenta." }
    ]
  },

  come: {
    base: "come", present: "comes", past: "came", pp: "come", ing: "coming",
    es: "venir",
    aliases: [
      "vengo","vienes","viene","venimos","vienen",
      "vine","viniste","vino","vinimos","vinieron",
      "viniendo"
    ],
    examples: [
      { en: "Come here, please.",              es: "Ven aquí, por favor." },
      { en: "She comes to class every day.",   es: "Ella viene a clase todos los días." },
      { en: "I came home late.",               es: "Llegué a casa tarde." }
    ]
  },

  leave: {
    base: "leave", present: "leaves", past: "left", pp: "left", ing: "leaving",
    es: "salir/dejar",
    aliases: [
      "salgo","sales","sale","salimos","salen",
      "sali","saliste","salio","salimos","salieron",
      "saliendo",
      "dejo","dejas","deja","dejamos","dejan",
      "deje","dejaste","dejo","dejamos","dejaron",
      "dejando"
    ],
    examples: [
      { en: "I leave at 8 AM.",                      es: "Salgo a las 8 AM." },
      { en: "She leaves work early on Fridays.",     es: "Ella sale del trabajo temprano los viernes." },
      { en: "I left my keys at home.",               es: "Dejé mis llaves en casa." }
    ]
  },

  run: {
    base: "run", present: "runs", past: "ran", pp: "run", ing: "running",
    es: "correr",
    aliases: [
      "corro","corres","corre","corremos","corren",
      "corri","corriste","corrio","corrimos","corrieron",
      "corriendo"
    ],
    examples: [
      { en: "I run 3 km every morning.",    es: "Corro 3 km cada mañana." },
      { en: "She runs in the park.",        es: "Ella corre en el parque." },
      { en: "I ran a marathon last year.",  es: "Corrí un maratón el año pasado." }
    ]
  }

};
