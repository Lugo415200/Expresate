// Source of truth for exact conjugations.
// You can add more verbs anytime.

window.VERB_DB = {
    // Core irregulars
    have: { base: "have", present: "has", past: "had", pp: "had", ing: "having", es: "tener" },
    do: { base: "do", present: "does", past: "did", pp: "done", ing: "doing", es: "hacer" },
    go: { base: "go", present: "goes", past: "went", pp: "gone", ing: "going", es: "ir" },
    be: { base: "be", present: "is", past: "was/were", pp: "been", ing: "being", es: "ser/estar" },

    // Common irregulars
    eat: { base: "eat", present: "eats", past: "ate", pp: "eaten", ing: "eating", es: "comer", audio: "audio/words/eat.wav" },
    see: { base: "see", present: "sees", past: "saw", pp: "seen", ing: "seeing", es: "ver" },
    take: { base: "take", present: "takes", past: "took", pp: "taken", ing: "taking", es: "tomar/llevar" },
    make: { base: "make", present: "makes", past: "made", pp: "made", ing: "making", es: "hacer/crear" },
    get: { base: "get", present: "gets", past: "got", pp: "gotten/got", ing: "getting", es: "obtener" },

    // Regular verbs can be added too (for Spanish meaning + exactness)
    work: { base: "work", present: "works", past: "worked", pp: "worked", ing: "working", es: "trabajar" },
    study: { base: "study", present: "studies", past: "studied", pp: "studied", ing: "studying", es: "estudiar" },
    live: { base: "live", present: "lives", past: "lived", pp: "lived", ing: "living", es: "vivir" },
    learn: { base: "learn", present: "learns", past: "learned/learnt", pp: "learned/learnt", ing: "learning", es: "aprender" },

    want: { base: "want", present: "wants", past: "wanted", pp: "wanted", ing: "wanting", es: "querer" },
    need: { base: "need", present: "needs", past: "needed", pp: "needed", ing: "needing", es: "necesitar" },
    look: { base: "look", present: "looks", past: "looked", pp: "looked", ing: "looking", es: "mirar/buscar"},
    call: { base: "call", present: "calls", past: "called", pp: "called", ing: "calling", es: "llamar" },
    help: {
        base: "help",
        present: "helps",
        past: "helped",
        pp: "helped",
        ing: "helping",
        es: "ayudar"
    },
    buy: {
        base: "buy",
        present: "buys",
        past: "bought",
        pp: "bought",
        ing: "buying",
        es: "comprar"
    },
    pay: {
        base: "pay",
        present: "pays",
        past: "paid",
        pp: "paid",
        ing: "paying",
        es: "pagar"
    },
    come: {
        base: "come",
        present: "comes",
        past: "came",
        pp: "come",
        ing: "coming",
        es: "venir"
    },
    leave: {
        base: "leave",
        present: "leaves",
        past: "left",
        pp: "left",
        ing: "leaving",
        es: "salir/dejar"
    },
    learn: {
        base: "learn",
        present: "learns",
        past: "learned/learnt",
        pp: "learned/learnt",
        ing: "learning",
        es: "aprender"
    },
    run: {
        base: "run",
        present: "runs",
        past: "ran",
        pp: "run",
        ing: "running",
        es: "correr",
        esForms: {
            yo: "corro",
            elElla: "corre",
            ayerYo: "corrí",
            yoEstoy: "estoy corriendo",
            yoVoyA: "voy a correr"
        }
    }



};
