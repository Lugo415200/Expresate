/* ============================================================
   speech-practice.js — reusable frontend speech practice.

   Usage on any page:
     var practice = ExpresateSpeechPractice.create({
       root: document.getElementById("speechPractice"),
       expected: "apple",
       onResult: function(result) { console.log(result); }
     });
     practice.setExpected("banana");
   ============================================================ */

"use strict";

(function(global) {
  var Recognition = global.SpeechRecognition || global.webkitSpeechRecognition;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s']/g, "")
      .replace(/\s+/g, " ");
  }

  function levenshtein(a, b) {
    var rows = a.length + 1;
    var cols = b.length + 1;
    var dp = [];
    var i;
    var j;

    for (i = 0; i < rows; i++) {
      dp[i] = [];
      dp[i][0] = i;
    }
    for (j = 0; j < cols; j++) dp[0][j] = j;

    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  function normalizeAliases(expected, aliases) {
    var seen = {};
    var values = [expected].concat(Array.isArray(aliases) ? aliases : []);
    return values
      .map(normalize)
      .filter(function(value) {
        if (!value || seen[value]) return false;
        seen[value] = true;
        return true;
      });
  }

  function transcriptMatchesAlias(heard, alias) {
    if (heard === alias) return true;
    if (alias.indexOf(" ") === -1) {
      return heard.split(" ").indexOf(alias) !== -1;
    }
    return heard.indexOf(alias) !== -1;
  }

  function compareSpeech(transcript, expected, aliases) {
    var heard = normalize(transcript);
    var target = normalize(expected);
    var accepted = normalizeAliases(expected, aliases);

    if (!heard || !target) {
      return { status: "try-again", score: 0, transcript: transcript || "" };
    }

    for (var i = 0; i < accepted.length; i++) {
      if (transcriptMatchesAlias(heard, accepted[i])) {
        return { status: "correct", score: 1, transcript: transcript, matched: accepted[i] };
      }
    }

    var distance = levenshtein(heard, target);
    var maxLen = Math.max(heard.length, target.length, 1);
    var score = 1 - distance / maxLen;

    if (score >= 0.72 || distance <= 2 || heard.indexOf(target) !== -1 || target.indexOf(heard) !== -1) {
      return { status: "almost", score: score, transcript: transcript };
    }

    return { status: "try-again", score: Math.max(0, score), transcript: transcript };
  }

  function create(options) {
    options = options || {};
    var root = options.root;
    var expected = options.expected || "";
    var acceptedAliases = Array.isArray(options.aliases) ? options.aliases.slice() : [];
    var onResult = typeof options.onResult === "function" ? options.onResult : function() {};
    var formatTarget = typeof options.formatTarget === "function" ? options.formatTarget : null;
    var labels = Object.assign({
      correct: "Correct",
      almost: "Almost",
      tryAgain: "Try again",
      heard: "I heard",
      unsupported: "Speech practice works best in Chrome or Edge.",
      unavailable: "Tu navegador no permite práctica de voz aquí.",
      noMic: "Permite el micrófono para practicar.",
      unclear: "No pude escuchar bien. Intenta otra vez.",
      notAvailable: "La práctica de voz no está disponible ahora."
    }, options.labels || {});

    if (!root) {
      throw new Error("ExpresateSpeechPractice.create requires a root element.");
    }

    var recognition = null;
    var listening = false;

    root.classList.add("speech-practice");
    root.innerHTML =
      '<div class="speech-practice-card">' +
        '<div class="speech-practice-copy">' +
          '<span class="speech-practice-label">Pronunciación</span>' +
          '<strong class="speech-practice-target" data-speech-target></strong>' +
        '</div>' +
        '<button class="btn speech-practice-btn" type="button" data-speech-start>Hablar</button>' +
        '<div class="speech-practice-feedback" data-speech-feedback aria-live="polite"></div>' +
      '</div>';

    var targetEl = root.querySelector("[data-speech-target]");
    var button = root.querySelector("[data-speech-start]");
    var feedback = root.querySelector("[data-speech-feedback]");

    function setExpected(nextExpected, nextAliases) {
      expected = nextExpected || "";
      acceptedAliases = Array.isArray(nextAliases) ? nextAliases.slice() : [];
      targetEl.textContent = expected
        ? (formatTarget ? formatTarget(expected) : 'Di: "' + expected + '"')
        : "Elige una palabra";
      clearFeedback();
    }

    function clearFeedback() {
      root.classList.remove("is-correct", "is-almost", "is-try-again", "is-listening");
      feedback.textContent = "";
    }

    function setFeedback(kind, message, transcript) {
      root.classList.remove("is-correct", "is-almost", "is-try-again", "is-listening");
      root.classList.add("is-" + kind);
      feedback.innerHTML =
        '<strong>' + message + '</strong>' +
        (transcript ? '<span>' + escapeHtml(labels.heard) + ': "' + escapeHtml(transcript) + '"</span>' : "");
    }

    function setListening(nextListening) {
      listening = nextListening;
      root.classList.toggle("is-listening", listening);
      button.disabled = listening;
      button.textContent = listening ? "Escuchando..." : "Hablar";
    }

    function start() {
      if (!Recognition) {
        setFeedback("try-again", labels.unavailable, "");
        button.disabled = true;
        button.textContent = "No disponible";
        return;
      }

      if (listening) return;

      try {
        recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = function() {
          setListening(true);
          feedback.textContent = "Escuchando...";
        };

        recognition.onresult = function(event) {
          var transcript = "";
          if (event.results && event.results[0] && event.results[0][0]) {
            transcript = event.results[0][0].transcript || "";
          }
          var result = compareSpeech(transcript, expected, acceptedAliases);
          if (result.status === "correct") {
            setFeedback("correct", labels.correct, transcript);
          } else if (result.status === "almost") {
            setFeedback("almost", labels.almost, transcript);
          } else {
            setFeedback("try-again", labels.tryAgain, transcript);
          }
          onResult(Object.assign({ expected: expected, aliases: acceptedAliases.slice() }, result));
        };

        recognition.onerror = function(event) {
          var message = event && event.error === "not-allowed"
            ? labels.noMic
            : labels.unclear;
          setFeedback("try-again", message, "");
        };

        recognition.onend = function() {
          setListening(false);
        };

        recognition.start();
      } catch (err) {
        setListening(false);
        setFeedback("try-again", labels.notAvailable, "");
      }
    }

    function destroy() {
      if (recognition) recognition.abort();
      root.innerHTML = "";
    }

    setExpected(expected);

    if (!Recognition) {
      button.disabled = true;
      button.textContent = "No disponible";
      setFeedback("try-again", labels.unsupported, "");
    } else {
      button.addEventListener("click", start);
    }

    return {
      start: start,
      setExpected: setExpected,
      reset: clearFeedback,
      destroy: destroy,
      isSupported: !!Recognition,
      compare: compareSpeech,
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  global.ExpresateSpeechPractice = {
    create: create,
    compare: compareSpeech,
    isSupported: !!Recognition,
  };
})(window);
