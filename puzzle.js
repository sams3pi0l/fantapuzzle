document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Avvio Puzzle Game - Versione Semplificata");

  // Elementi DOM
  const puzzleBoard = document.getElementById("puzzle-board");
  const startButton = document.getElementById("start-button");
  const difficultySelect = document.getElementById("difficulty");
  const timerElement = document.getElementById("timer");
  const timerElementDesktop = document.getElementById("timer-desktop");
  const congratulationsModal = document.getElementById("congratulations");
  const completionTimeElement = document.getElementById("completion-time");
  const completionMovesElement = document.getElementById("completion-moves");
  const completionTitleElement = document.getElementById("completion-title");
  const moveCounterElement = document.getElementById("move-counter");
  const moveCounterElementDesktop = document.getElementById(
    "move-counter-desktop",
  );
  const retryButton = document.getElementById("retry-button");
  const nextLevelButton = document.getElementById("next-level-button");
  const aboutButton = document.getElementById("about-button");
  const aboutModal = document.getElementById("about-modal");
  const closeAboutButton = document.getElementById("close-about-button");
  const referenceImg = document.getElementById("reference-img");
  // const customImageInput = document.getElementById('custom-image'); // TEMPORANEAMENTE DISABILITATO
  const imageSelect = document.getElementById("image-select");
  const audioToggle = document.getElementById("audio-toggle");

  // Variabili di gioco
  let puzzlePieces = [];
  let grid = [];
  let gridSize = 4;
  let timerInterval;
  let startTime;
  let imageLoaded = false;
  let currentImageIndex = 0; // Indice dell'immagine corrente
  let moveCount = 0; // Contatore delle mosse
  let timeLimit = 2 * 60; // Limite di tempo in secondi (default 2 minuti)
  let moveLimit = 20; // Limite di mosse (default 20)
  let gameOver = false; // Flag per indicare se il gioco è terminato
  let completedLevels = []; // Array per tenere traccia dei livelli completati
  // Sistema di punteggio
  let currentScore = 0; // Punteggio del livello corrente
  let totalScore = 0; // Punteggio totale accumulato
  let currentDifficulty = 4; // Difficoltà corrente (default: medio)
  let difficultyMultipliers = { 3: 1, 4: 2, 5: 3 }; // Moltiplicatori per difficoltà
  // L'immagine principale del puzzle
  const image = new Image();

  // Sistema Audio
  const audioSystem = {
    sounds: {},
    enabled: true,
    
    // Inizializza il sistema audio
    init() {
      console.log("🔊 Inizializzazione sistema audio...");
      
      // Pre-carica tutti i suoni
      this.sounds.move = this.createAudio('audio/move.mp3');
      this.sounds.complete = this.createAudio('audio/complete.mp3');
      this.sounds.lose = this.createAudio('audio/lose.mp3');
      
      console.log("🔊 Sistema audio inizializzato");
    },
    
    // Crea un oggetto audio con gestione errori
    createAudio(src) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.6; // Volume moderato
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`🔊 Audio caricato: ${src}`);
      });
      
      audio.addEventListener('error', (e) => {
        console.warn(`⚠️ Errore caricamento audio: ${src}`, e);
      });
      
      audio.src = src;
      return audio;
    },
    
    // Riproduce un suono
    play(soundName) {
      if (!this.enabled) {
        console.log(`🔇 Audio disabilitato - saltato suono: ${soundName}`);
        return;
      }
      
      if (!this.sounds[soundName]) {
        console.warn(`⚠️ Suono non trovato: ${soundName}`);
        return;
      }
      
      try {
        console.log(`🔊 Riproduzione suono: ${soundName}`);
        // Reset dell'audio per permettere riproduzioni multiple rapide
        this.sounds[soundName].currentTime = 0;
        const playPromise = this.sounds[soundName].play();
        
        // Gestisce la Promise per compatibilità browser
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`⚠️ Errore riproduzione audio ${soundName}:`, error);
          });
        }
      } catch (error) {
        console.warn(`⚠️ Errore riproduzione audio ${soundName}:`, error);
      }
    },
    
    // Attiva/disattiva l'audio
    toggle() {
      this.enabled = !this.enabled;
      console.log(`🔊 Audio ${this.enabled ? 'abilitato' : 'disabilitato'}`);
      return this.enabled;
    },
    
    // Imposta il volume generale
    setVolume(volume) {
      const normalizedVolume = Math.max(0, Math.min(1, volume));
      Object.values(this.sounds).forEach(audio => {
        audio.volume = normalizedVolume;
      });
      console.log(`🔊 Volume impostato a: ${Math.round(normalizedVolume * 100)}%`);
    }
  };

  // CONFIGURAZIONE IMMAGINI INCORPORATE
  const gameImages = [
    { name: "Buzzling", path: "images/01.buzzling.png" },
    { name: "Wormkin", path: "images/02.wormkin.png" },
    { name: "Skywyrm", path: "images/03.skywyrm.png" },
    { name: "Forestshade", path: "images/04.forestshade.png" },
    { name: "Rosecoil", path: "images/05.rosecoil.png" },
    { name: "Rootguard", path: "images/06.rootguard.png" },
    { name: "Aquarex", path: "images/07.aquarex.png" },
    { name: "Snailsong", path: "images/08.snailsong.png" },
  ];

  // Popola il selettore
  function populateImageSelect() {
    console.log("🔧 Popolando selettore immagini...");
    imageSelect.innerHTML = "";
    
    // Aggiungi solo l'immagine corrente
    const currentImage = gameImages[currentImageIndex];
    const option = document.createElement("option");
    option.value = currentImage.path;
    option.textContent = `${currentImageIndex + 1}/${gameImages.length}: ${currentImage.name}`;
    option.selected = true;
    imageSelect.appendChild(option);
    
    // Disabilita il selettore
    imageSelect.disabled = true;
    
    console.log(`🎯 Selettore popolato con l'immagine corrente: ${currentImage.name}`);
  }

  // Passa all'immagine successiva
  function nextImage() {
    // Aggiunge l'immagine corrente ai livelli completati se non è già presente
    if (!completedLevels.includes(currentImageIndex)) {
      completedLevels.push(currentImageIndex);
    }
    
    // Controlla se tutti i livelli sono stati completati
    if (completedLevels.length >= gameImages.length) {
      // Bonus per il completamento di tutti i livelli
      const gameCompletionBonus = 5000 * difficultyMultipliers[gridSize];
      totalScore += gameCompletionBonus;
      
      // Mostra un messaggio di completamento del gioco
      completionTitleElement.textContent = "🏆 CONGRATULAZIONI! 🏆";
      const completionMessage = document.getElementById("completion-message");
      completionMessage.innerHTML = "<strong>Hai completato tutti i livelli del gioco!</strong>";
      
      const performanceInfoElement = document.getElementById("performance-info");
      if (performanceInfoElement) {
        const difficultyNames = { 3: "Facile", 4: "Media", 5: "Difficile" };
        const difficultyName = difficultyNames[gridSize] || "Media";
        performanceInfoElement.textContent = `Gioco completato | Difficoltà: ${difficultyName}\nBonus: ${gameCompletionBonus} | Totale: ${totalScore}`;
        performanceInfoElement.classList.add("good-performance");
      }
      
      // Cambia il testo del pulsante "Livello Successivo"
      nextLevelButton.textContent = "Gioca ancora";
      
      // Mostra il modal
      congratulationsModal.style.display = "flex";
      
      // Non resettiamo qui il gioco, lo farà l'event listener del pulsante quando l'utente clicca "Gioca ancora"
      return;
    }
    
    // Comportamento normale - passa al livello successivo
    currentImageIndex = (currentImageIndex + 1) % gameImages.length;
    populateImageSelect();
    loadImage(gameImages[currentImageIndex].path);
    console.log(
      `🎯 Passato all'immagine ${currentImageIndex + 1}/${gameImages.length}: ${gameImages[currentImageIndex].name}`,
    );
    // Reset del gioco per la nuova immagine
    gameOver = false;

    // Nasconde il modal delle congratulazioni se è ancora visibile
    if (congratulationsModal.style.display === "flex") {
      congratulationsModal.style.display = "none";
    }
  }

  // Carica un'immagine
  function loadImage(imagePath) {
    console.log("📸 Caricando immagine:", imagePath);
    imageLoaded = false;

    // Se è già un data URL (immagine caricata dall'utente), usala direttamente
    if (imagePath.startsWith("data:")) {
      image.onload = function () {
        console.log(
          "✅ Immagine data URL caricata!",
          this.width + "x" + this.height,
        );
        imageLoaded = true;
        startButton.disabled = false;
        referenceImg.src = this.src;

        setTimeout(() => {
          createPuzzle();
        }, 100);
      };

      image.onerror = function () {
        console.error("❌ Errore caricamento data URL:", imagePath);
        alert("Impossibile caricare l'immagine caricata");
      };

      image.src = imagePath;
    } else {
      // Per le immagini locali, convertile in data URL per evitare problemi CORS
      console.log("🔄 Convertendo immagine locale in data URL...");

      fetch(imagePath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            console.log("✅ Immagine convertita in data URL");

            image.onload = function () {
              console.log(
                "✅ Immagine locale caricata!",
                this.width + "x" + this.height,
              );
              imageLoaded = true;
              startButton.disabled = false;
              referenceImg.src = this.src;

              setTimeout(() => {
                createPuzzle();
              }, 100);
            };

            image.onerror = function () {
              console.error("❌ Errore caricamento immagine convertita");
              alert("Errore nel processare l'immagine: " + imagePath);
            };

            image.src = e.target.result;
          };

          reader.onerror = function () {
            console.error("❌ Errore nella conversione blob->dataURL");
            alert("Errore nella conversione dell'immagine");
          };

          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error("❌ Errore nel fetch dell'immagine:", error);
          console.log("📁 Percorso tentato:", imagePath);
          alert(
            `Impossibile caricare l'immagine: ${imagePath}\nErrore: ${error.message}`,
          );
        });
    }
  }
  // Funzioni utility
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  // Imposta i limiti in base alla difficoltà
  function setLimitsForDifficulty() {
    switch (gridSize) {
      case 3: // Facile
        timeLimit = 1 * 60; // 1 minuto
        moveLimit = 10;
        break;
      case 4: // Medio
        timeLimit = 2 * 60; // 2 minuti
        moveLimit = 20;
        break;
      case 5: // Difficile
        timeLimit = 3 * 60; // 3 minuti
        moveLimit = 30;
        break;
      default:
        timeLimit = 2 * 60;
        moveLimit = 20;
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    gameOver = false;

    // Imposta i limiti per la difficoltà corrente
    setLimitsForDifficulty();

    // Inizializza entrambi i contatori (mobile e desktop)
    timerElement.innerHTML = `Tempo: ${formatTime(timeLimit)}`;
    timerElementDesktop.innerHTML = `Tempo: ${formatTime(timeLimit)}`;
    moveCounterElement.innerHTML = `Mosse: 0/${moveLimit}`;
    moveCounterElementDesktop.innerHTML = `Mosse: 0/${moveLimit}`;

    timerInterval = setInterval(() => {
      if (gameOver) return;

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = timeLimit - elapsedSeconds;
      const remainingMoves = moveLimit - moveCount;
      // Aggiorna timer
      if (remainingTime > 0) {
        timerElement.innerHTML = `Tempo: ${formatTime(remainingTime)}`;
        timerElementDesktop.innerHTML = `Tempo: ${formatTime(remainingTime)}`;
      } else {
        // Usa un colore rosso più intenso per il messaggio di tempo scaduto
        timerElement.innerHTML = `<span style="color: #D32F2F;">TEMPO SCADUTO!</span>`;
        timerElementDesktop.innerHTML = `<span style="color: #D32F2F;">TEMPO SCADUTO!</span>`;
        if (!gameOver && congratulationsModal.style.display !== "flex") {
          gameOver = true;
          audioSystem.play('lose');
          showGameOverModal("tempo");
        }
      }

      // Aggiorna contatore mosse con limite
      if (remainingMoves > 0) {
        moveCounterElement.innerHTML = `Mosse: ${moveCount}/${moveLimit}`;
        moveCounterElementDesktop.innerHTML = `Mosse: ${moveCount}/${moveLimit}`;
      } else {
        // Usa un colore rosso più intenso per il messaggio di mosse terminate
        moveCounterElement.innerHTML = `<span style="color: #D32F2F;">MOSSE TERMINATE!</span>`;
        moveCounterElementDesktop.innerHTML = `<span style="color: #D32F2F;">MOSSE TERMINATE!</span>`;
        if (!gameOver && congratulationsModal.style.display !== "flex") {
          gameOver = true;
          audioSystem.play('lose');
          showGameOverModal("mosse");
        }
      }
    }, 1000);

    // Inizializza i display
    timerElement.innerHTML = `Tempo: ${formatTime(timeLimit)}`;
    moveCounterElement.innerHTML = `Mosse: 0/${moveLimit}`;
    timerElementDesktop.innerHTML = `Tempo: ${formatTime(timeLimit)}`;
    moveCounterElementDesktop.innerHTML = `Mosse: 0/${moveLimit}`;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return Math.floor((Date.now() - startTime) / 1000);
  } // Mostra il modal di game over
  function showGameOverModal(type) {
    const elapsedTime = stopTimer();
    const elapsedMinutes = Math.floor(elapsedTime / 60);

    completionTimeElement.textContent = formatTime(elapsedTime);
    completionMovesElement.textContent = moveCount;

    // Ottieni riferimento al messaggio di completamento
    const completionMessageElement =
      document.getElementById("completion-message");
      
    // Ottieni riferimento al contenuto del modal
    const modalContent = document.querySelector(".modal-content");

    if (type === "tempo") {
      completionTitleElement.textContent = "⏰ Tempo Scaduto!";
      completionTitleElement.className = "error-message"; // Aggiungi classe per colore rosso
      completionMessageElement.innerHTML = `Non hai completato il puzzle in tempo. Hai usato <strong>${moveCount} mosse</strong>.`;
      
      // Rimuovi la classe success-modal se presente
      if (modalContent) {
        modalContent.classList.remove("success-modal");
      }
      
      // Mostra solo il pulsante "Riprova" quando il gioco è perso
      retryButton.style.display = "inline-block";
      nextLevelButton.style.display = "none";
    } else if (type === "mosse") {
      completionTitleElement.textContent = "🚫 Mosse Terminate!";
      completionTitleElement.className = "error-message"; // Aggiungi classe per colore rosso
      completionMessageElement.innerHTML = `Hai esaurito tutte le mosse disponibili dopo <strong>${formatTime(elapsedTime)}</strong>.`;
      
      // Rimuovi la classe success-modal se presente
      if (modalContent) {
        modalContent.classList.remove("success-modal");
      }
      
      // Mostra solo il pulsante "Riprova" quando il gioco è perso
      retryButton.style.display = "inline-block";
      nextLevelButton.style.display = "none";
    } else if (type === "completato") {
      // Rimuovi la classe error-message per i messaggi di successo
      completionTitleElement.className = "";
      // Il titolo sarà impostato nella funzione checkCompletion
      const mosseTesto = moveCount === 1 ? "mossa" : "mosse";
      completionMessageElement.innerHTML = `Hai completato il puzzle in <strong>${formatTime(elapsedTime)}</strong> con <strong>${moveCount} ${mosseTesto}</strong>!`;
      
      // Assicuriamoci che il modal abbia sfondo bianco standard
      if (modalContent) {
        modalContent.classList.remove("success-modal");
      }
      
      // Mostra solo il pulsante "Livello Successivo" quando il livello è completato
      retryButton.style.display = "none";
      nextLevelButton.style.display = "inline-block";
    }

    // Aggiorna le informazioni sulla performance
    const performanceInfoElement = document.getElementById("performance-info");
    if (performanceInfoElement) {
      const difficultyNames = { 3: "Facile", 4: "Media", 5: "Difficile" };
      const difficultyName = difficultyNames[gridSize] || "Media";

      if (type === "tempo") {
        const minuti = Math.floor(timeLimit / 60);
        const minutiText = minuti === 1 ? "minuto" : "minuti";
        performanceInfoElement.textContent = `Hai superato il limite di tempo di ${minuti} ${minutiText} per la difficoltà ${difficultyName}`;
        performanceInfoElement.classList.add("bad-performance");
        performanceInfoElement.classList.remove("good-performance");
      } else if (type === "mosse") {
        // Ottieni il limite di mosse corretto in base alla difficoltà
        let limiteMovimentoCorretto;
        switch (gridSize) {
          case 3: limiteMovimentoCorretto = 10; break; // Facile
          case 4: limiteMovimentoCorretto = 20; break; // Medio
          case 5: limiteMovimentoCorretto = 30; break; // Difficile
          default: limiteMovimentoCorretto = 20;
        }
        
        const mosseTesto = limiteMovimentoCorretto === 1 ? "mossa" : "mosse";
        performanceInfoElement.textContent = `Hai superato il limite di ${limiteMovimentoCorretto} ${mosseTesto} per la difficoltà ${difficultyName}`;
        performanceInfoElement.classList.add("bad-performance");
        performanceInfoElement.classList.remove("good-performance");
      }
      // Il caso 'completato' sarà gestito nella funzione checkCompletion
    }

    // Mostra il modale solo se non è già visibile
    if (congratulationsModal.style.display !== "flex") {
      congratulationsModal.style.display = "flex";
    }
  } // Crea il puzzle
  function createPuzzle() {
    // Resetta lo stato del gioco
    puzzlePieces = [];
    grid = [];
    gameOver = false;
    resetMoveCounter();
    
    // Verifica se la difficoltà è cambiata
    if (currentDifficulty !== gridSize) {
      console.log(`🔄 Difficoltà cambiata da ${currentDifficulty}x${currentDifficulty} a ${gridSize}x${gridSize} - Reset punteggio`);
      // Reset del punteggio totale e dei livelli completati quando cambia la difficoltà
      totalScore = 0;
      currentScore = 0;
      completedLevels = [];
      currentImageIndex = 0; // Torna al primo livello
      populateImageSelect();
      loadImage(gameImages[currentImageIndex].path);
      // Aggiorna la difficoltà corrente
      currentDifficulty = gridSize;
    }
    
    // Resetta l'array dei livelli completati solo se si inizia una nuova partita
    // e non quando si riprova lo stesso livello
    if (nextLevelButton.textContent === "Ricomincia") {
      completedLevels = [];
      nextLevelButton.textContent = "Livello Successivo";
    }

    // Pulisci la board
    puzzleBoard.innerHTML = "";
    puzzleBoard.style.position = "relative";

    // Ottieni le dimensioni del contenitore
    const containerWidth = puzzleBoard.clientWidth;
    const containerHeight = puzzleBoard.clientHeight;
    const size = Math.min(containerWidth, containerHeight);

    // Calcola le dimensioni dei pezzi - rimuoviamo lo spazio tra i pezzi
    const pieceSize = Math.floor(size / gridSize);
    console.log("🧩 Board size:", size, "Piece size:", pieceSize);
    
    // Impostiamo la dimensione esatta della board per evitare spazi vuoti
    const boardSize = pieceSize * gridSize;
    puzzleBoard.style.width = `${boardSize}px`;
    puzzleBoard.style.height = `${boardSize}px`;
    // Impostiamo un background che si integri meglio con l'interfaccia
    puzzleBoard.style.backgroundColor = "#f8f8f8";

    // Canvas per tagliare l'immagine - usa dimensioni fisse per evitare problemi
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = pieceSize;
    canvas.height = pieceSize;

    console.log("🎨 Canvas creato:", canvas.width, "x", canvas.height);

    // Crea le posizioni mischiate
    let positions = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      positions.push(i);
    }
    positions = shuffleArray(positions);

    // Crea i pezzi
    for (let i = 0; i < gridSize * gridSize; i++) {
      const piece = document.createElement("div");
      piece.className = "puzzle-piece";

      // Posizione originale
      const originalRow = Math.floor(i / gridSize);
      const originalCol = i % gridSize;

      // Posizione mescolata
      const shuffledPosition = positions[i];
      const shuffledRow = Math.floor(shuffledPosition / gridSize);
      const shuffledCol = shuffledPosition % gridSize;

      // Dimensioni e posizione - rimuoviamo lo spazio tra i pezzi
      piece.style.width = `${pieceSize}px`;
      piece.style.height = `${pieceSize}px`;
      piece.style.left = `${shuffledCol * pieceSize}px`;
      piece.style.top = `${shuffledRow * pieceSize}px`;
      
      // Taglia l'immagine
      ctx.clearRect(0, 0, pieceSize, pieceSize);
      console.log(
        `Tagliando pezzo ${i}: img(${image.naturalWidth}x${image.naturalHeight}) da [${originalCol * (image.naturalWidth / gridSize)}, ${originalRow * (image.naturalHeight / gridSize)}] size [${image.naturalWidth / gridSize}, ${image.naturalHeight / gridSize}]`,
      );

      try {
        // Verifica che l'immagine sia completamente caricata
        if (image.complete && image.naturalWidth > 0) {
          ctx.drawImage(
            image,
            originalCol * (image.naturalWidth / gridSize),
            originalRow * (image.naturalHeight / gridSize),
            image.naturalWidth / gridSize,
            image.naturalHeight / gridSize,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          const dataURL = canvas.toDataURL();
          piece.style.backgroundImage = `url(${dataURL})`;
          piece.style.backgroundSize = `${canvas.width}px ${canvas.height}px`;
          piece.style.backgroundRepeat = "no-repeat";
          piece.style.backgroundPosition = "center";
          console.log(`✅ Pezzo ${i} tagliato correttamente`);
        } else {
          throw new Error("Immagine non completamente caricata");
        }
      } catch (err) {
        console.error("❌ Errore nel tagliare l'immagine pezzo", i, ":", err);
        // Fallback con numero
        piece.style.backgroundColor = `hsl(${(i * 25) % 360}, 70%, 80%)`;
        piece.textContent = i + 1;
        piece.style.display = "flex";
        piece.style.alignItems = "center";
        piece.style.justifyContent = "center";
        piece.style.fontSize = pieceSize / 3 + "px";
        piece.style.fontWeight = "bold";
        piece.style.color = "#333";
      }

      // Dati del pezzo
      piece.dataset.position = shuffledPosition;
      piece.dataset.correctPosition = i;
      // Eventi per mouse e touch
      piece.addEventListener("mousedown", onPieceStart);
      piece.addEventListener("touchstart", onPieceStart, { passive: false });

      puzzleBoard.appendChild(piece);
      puzzlePieces.push(piece);
      grid[shuffledPosition] = piece;
    }

    startTimer();
    console.log("✅ Puzzle creato con successo!");
  }
  // Helper per gestire coordinate sia mouse che touch
  function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }
  // Gestione trascinamento unificata (mouse + touch)
  function onPieceStart(e) {
    // Previeni il trascinamento se il gioco è finito
    if (gameOver) return;

    e.preventDefault();
    const piece = e.target;
    piece.classList.add("dragging");

    const coords = getEventCoordinates(e);
    const offsetX = coords.clientX - piece.getBoundingClientRect().left;
    const offsetY = coords.clientY - piece.getBoundingClientRect().top;
    function onMove(e) {
      e.preventDefault(); // Previene scroll su mobile
      const coords = getEventCoordinates(e);
      const boardRect = puzzleBoard.getBoundingClientRect();
      const pieceSize = puzzleBoard.offsetWidth / gridSize;

      let left = coords.clientX - boardRect.left - offsetX;
      let top = coords.clientY - boardRect.top - offsetY;

      // Limita il movimento all'interno della board
      left = Math.max(0, Math.min(left, boardRect.width - pieceSize));
      top = Math.max(0, Math.min(top, boardRect.height - pieceSize));

      piece.style.left = left + "px";
      piece.style.top = top + "px";
    }
    function onEnd(e) {
      e.preventDefault();
      piece.classList.remove("dragging");

      // Rimuovi tutti i listener (mouse e touch)
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove, { passive: false });
      document.removeEventListener("touchend", onEnd);
      // Gestisci coordinate per touch (changedTouches) o mouse
      let coords;
      if (e.changedTouches && e.changedTouches.length > 0) {
        coords = {
          clientX: e.changedTouches[0].clientX,
          clientY: e.changedTouches[0].clientY,
        };
      } else {
        coords = getEventCoordinates(e);
      }
      const boardRect = puzzleBoard.getBoundingClientRect();
      const pieceSize = puzzleBoard.offsetWidth / gridSize;

      const col = Math.floor((coords.clientX - boardRect.left) / pieceSize);
      const row = Math.floor((coords.clientY - boardRect.top) / pieceSize);
      if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
        const newPosition = row * gridSize + col;
        const oldPosition = parseInt(piece.dataset.position);

        // Controlla se la posizione è effettivamente cambiata
        if (newPosition !== oldPosition) {
          if (grid[newPosition]) {
            const otherPiece = grid[newPosition];

            // Posizionamento preciso
            otherPiece.style.left = `${(oldPosition % gridSize) * pieceSize}px`;
            otherPiece.style.top = `${Math.floor(oldPosition / gridSize) * pieceSize}px`;
            otherPiece.dataset.position = oldPosition;
            grid[oldPosition] = otherPiece;
          } else {
            grid[oldPosition] = null;
          }

          // Posizionamento preciso
          piece.style.left = `${col * pieceSize}px`;
          piece.style.top = `${row * pieceSize}px`;
          piece.dataset.position = newPosition;
          grid[newPosition] = piece;

          // Incrementa il contatore delle mosse SOLO se il pezzo è stato effettivamente spostato
          moveCount++;
          updateMoveCounter();
          
          // Riproduce il suono di movimento
          audioSystem.play('move');

          // Controlla se è nella posizione corretta
          if (newPosition === parseInt(piece.dataset.correctPosition)) {
            piece.classList.add("correct");
          } else {
            piece.classList.remove("correct");
          }

          checkCompletion();
        } else {
          // Il pezzo è stato rilasciato nella stessa posizione, assicuriamo un posizionamento preciso
          piece.style.left = `${col * pieceSize}px`;
          piece.style.top = `${row * pieceSize}px`;
          
          console.log(
            "🎯 Pezzo rilasciato nella stessa posizione - nessuna mossa contata",
          );
        }
      } else {
        // Rimetti nella posizione originale con posizionamento preciso
        const position = parseInt(piece.dataset.position);
        piece.style.left = `${(position % gridSize) * pieceSize}px`;
        piece.style.top = `${Math.floor(position / gridSize) * pieceSize}px`;
      }
    }

    // Aggiungi listener per mouse e touch
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  }
  // Aggiorna il contatore delle mosse
  function updateMoveCounter() {
    if (gameOver) return;

    const remainingMoves = moveLimit - moveCount;
    if (remainingMoves >= 0) {
      moveCounterElement.innerHTML = `Mosse: ${moveCount}/${moveLimit}`;
      moveCounterElementDesktop.innerHTML = `Mosse: ${moveCount}/${moveLimit}`;
    } else {
      // Usa un colore rosso più intenso per il messaggio di mosse terminate
      moveCounterElement.innerHTML = `<span style="color: #D32F2F;">MOSSE TERMINATE!</span>`;
      moveCounterElementDesktop.innerHTML = `<span style="color: #D32F2F;">MOSSE TERMINATE!</span>`;
      if (!gameOver) {
        gameOver = true;
        audioSystem.play('lose');
        showGameOverModal("mosse");
      }
    }
  }
  // Resetta il contatore delle mosse
  function resetMoveCounter() {
    moveCount = 0;
    gameOver = false;
    setLimitsForDifficulty(); // Assicura che i limiti siano aggiornati
    moveCounterElement.innerHTML = `Mosse: 0/${moveLimit}`;
    moveCounterElementDesktop.innerHTML = `Mosse: 0/${moveLimit}`;
  }
  
  // Calcola il punteggio per il livello completato
  function calculateLevelScore(elapsedTime, movesMade) {
    // Base di punteggio per il completamento del livello
    let baseScore = 1000;
    
    // Calcola bonus tempo (più veloce = più punti)
    const timeBonus = Math.max(0, Math.floor((timeLimit - elapsedTime) * 10));
    
    // Calcola bonus mosse (meno mosse = più punti)
    const moveBonus = Math.max(0, Math.floor((moveLimit - movesMade) * 15));
    
    // Applica il moltiplicatore di difficoltà
    const difficultyMultiplier = difficultyMultipliers[gridSize] || 1;
    
    // Calcola il punteggio totale per questo livello
    const levelScore = (baseScore + timeBonus + moveBonus) * difficultyMultiplier;
    
    console.log(`🎯 Calcolo punteggio: Base ${baseScore} + Tempo ${timeBonus} + Mosse ${moveBonus} × Difficoltà ${difficultyMultiplier} = ${levelScore}`);
    
    return levelScore;
  }
  
  // Controlla se il puzzle è completato
  function checkCompletion() {
    // Se il gioco è già terminato o il modale è già visibile, non fare nulla
    if (gameOver) return;
    if (congratulationsModal.style.display === "flex") return;

    let complete = true;
    for (let piece of puzzlePieces) {
      if (
        parseInt(piece.dataset.position) !==
        parseInt(piece.dataset.correctPosition)
      ) {
        complete = false;
        break;
      }
    }
    if (complete) {
      gameOver = true; // Imposta il flag di gioco finito
      const elapsedTime = stopTimer();
      const elapsedMinutes = Math.floor(elapsedTime / 60);

      // Aggiungi il livello corrente all'array dei livelli completati se non è già presente
      if (!completedLevels.includes(currentImageIndex)) {
        completedLevels.push(currentImageIndex);
        console.log(`🎯 Livello ${currentImageIndex + 1} (${gameImages[currentImageIndex].name}) completato!`);
        console.log(`🏆 Livelli completati: ${completedLevels.length}/${gameImages.length}`);
        
        // Calcola il punteggio per questo livello
        currentScore = calculateLevelScore(elapsedTime, moveCount);
        // Aggiungi al punteggio totale
        totalScore += currentScore;
        
        console.log(`💯 Punteggio livello: ${currentScore} | Punteggio totale: ${totalScore}`);
      }

      completionTimeElement.textContent = formatTime(elapsedTime);
      completionMovesElement.textContent = moveCount;
      // Determina il messaggio di successo
      const difficultyNames = { 3: "Facile", 4: "Media", 5: "Difficile" };
      const difficultyName = difficultyNames[gridSize] || "Media";

      // Selezione casuale di un messaggio di successo
      const successMessages = [
        "🎉 Fantastico! Puzzle completato!",
        "🌟 Ottimo lavoro! Puzzle completato!",
        "🏆 Perfetto! Prestazione eccellente!",
        "👏 Eccellente! Hai completato il puzzle!",
      ];
      const title =
        successMessages[Math.floor(Math.random() * successMessages.length)];

      completionTitleElement.textContent = title;
      // Aggiorna le informazioni sulla performance
      const performanceInfoElement =
        document.getElementById("performance-info");
      if (performanceInfoElement) {
        // Visualizzazione semplificata del punteggio
        performanceInfoElement.textContent = `Livello ${currentImageIndex + 1} completato | Difficoltà: ${difficultyName}\nPunteggio: ${currentScore} | Totale: ${totalScore}`;

        // Aggiungi classe CSS per performance positiva
        performanceInfoElement.classList.add("good-performance");
        performanceInfoElement.classList.remove("bad-performance");
      }

      // Riproduce il suono di completamento
      audioSystem.play('complete');
      
      // Chiama showGameOverModal con tipo 'completato' per gestire il messaggio corretto
      showGameOverModal("completato");
    }
  }

  // Event Listeners
  imageSelect.addEventListener("change", function () {
    if (this.value) {
      const selectedIndex = gameImages.findIndex(
        (img) => img.path === this.value,
      );
      if (selectedIndex !== -1) {
        currentImageIndex = selectedIndex;
      }
      loadImage(this.value);
    }
  });

  /* TEMPORANEAMENTE DISABILITATO - Caricamento immagini personalizzate
    customImageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imageSelect.value = '';
                loadImage(e.target.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }    });
    */

  startButton.addEventListener("click", () => {
    gridSize = parseInt(difficultySelect.value);
    if (imageLoaded) {
      createPuzzle();
    } else {
      alert("Immagine non ancora caricata!");
    }
  });

  difficultySelect.addEventListener("change", () => {
    gridSize = parseInt(difficultySelect.value);
    if (imageLoaded) {
      createPuzzle();
      console.log(
        `🎯 Difficoltà cambiata a ${gridSize}x${gridSize} - Puzzle avviato automaticamente`,
      );
    }
  });

  // Event listener per il pulsante "Riprova"
  retryButton.addEventListener("click", () => {
    congratulationsModal.style.display = "none";
    gridSize = parseInt(difficultySelect.value);
    createPuzzle();
  });

  // Event listener per il pulsante "Livello Successivo"
  nextLevelButton.addEventListener("click", () => {
    congratulationsModal.style.display = "none";
    
    // Se il pulsante dice "Gioca ancora", resetta il gioco completamente
    if (nextLevelButton.textContent === "Gioca ancora") {
      completedLevels = [];
      currentImageIndex = 0;
      totalScore = 0; // Reset del punteggio totale
      currentScore = 0; // Reset del punteggio del livello corrente
      nextLevelButton.textContent = "Livello Successivo"; // Ripristina il testo del pulsante
      populateImageSelect();
      loadImage(gameImages[currentImageIndex].path);
      createPuzzle();
    } else {
      // Comportamento normale - passa al livello successivo
      nextImage();
    }
  });

  // Event listener per il pulsante "About"
  aboutButton.addEventListener("click", () => {
    aboutModal.style.display = "flex";
  });

  // Event listener per chiudere il modal About
  closeAboutButton.addEventListener("click", () => {
    aboutModal.style.display = "none";
  });

  // Event listener per il toggle audio
  audioToggle.addEventListener("click", () => {
    const isEnabled = audioSystem.toggle();
    audioToggle.textContent = isEnabled ? "🔊" : "🔇";
    audioToggle.title = isEnabled ? "Disattiva audio" : "Attiva audio";
    audioToggle.setAttribute("aria-label", isEnabled ? "Disattiva audio" : "Attiva audio");
  });

  // Chiudi il modal About cliccando fuori da esso
  aboutModal.addEventListener("click", (e) => {
    if (e.target === aboutModal) {
      aboutModal.style.display = "none";
    }
  });

  // Inizializzazione
  console.log("🎮 Inizializzazione del gioco...");
  
  // Inizializza il sistema audio
  audioSystem.init();
  
  populateImageSelect();
  gridSize = parseInt(difficultySelect.value);
  currentDifficulty = gridSize; // Imposta la difficoltà iniziale
  console.log(`🎯 Difficoltà iniziale: ${gridSize}x${gridSize}`);
  console.log(`💯 Sistema di punteggio inizializzato: Punteggio 0, Difficoltà ${currentDifficulty}x${currentDifficulty}`);

  // Funzione temporanea per mostrare il messaggio di completamento del gioco
  window.mostraCompletamentoGioco = function() {
    // Simula il completamento di tutti i livelli
    completedLevels = [...Array(gameImages.length).keys()]; // [0,1,2,3,4,5,6,7]
    
    // Simula un punteggio totale
    totalScore = 15000;
    const gameCompletionBonus = 5000 * difficultyMultipliers[gridSize];
    totalScore += gameCompletionBonus;
    
    // Mostra il messaggio di completamento
    completionTitleElement.textContent = "🏆 CONGRATULAZIONI! 🏆";
    completionTitleElement.className = ""; // Assicura che non ci sia la classe error-message
    const completionMessage = document.getElementById("completion-message");
    completionMessage.innerHTML = "<strong>Hai completato tutti i livelli del gioco!</strong>";
    
    const performanceInfoElement = document.getElementById("performance-info");
    if (performanceInfoElement) {
      const difficultyNames = { 3: "Facile", 4: "Media", 5: "Difficile" };
      const difficultyName = difficultyNames[gridSize] || "Media";
      performanceInfoElement.textContent = `Gioco completato | Difficoltà: ${difficultyName}\nBonus: ${gameCompletionBonus} | Totale: ${totalScore}`;
      performanceInfoElement.classList.add("good-performance");
    }
    
    // Cambia il testo del pulsante "Livello Successivo"
    nextLevelButton.textContent = "Gioca ancora";
    
    // Mostra solo il pulsante "Livello Successivo" (ora "Gioca ancora")
    retryButton.style.display = "none";
    nextLevelButton.style.display = "inline-block";
    
    // Assicuriamoci che il modal abbia sfondo bianco standard
    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
      modalContent.classList.remove("success-modal"); // Rimuoviamo la classe success-modal per mantenere lo sfondo bianco
    }
    
    // Mostra il modal
    congratulationsModal.style.display = "flex";
    
    console.log("🎮 Messaggio di completamento del gioco mostrato!");
  };

  // Carica la prima immagine
  if (gameImages.length > 0) {
    console.log(`📸 Caricando prima immagine: ${gameImages[0].name}`);
    loadImage(gameImages[0].path);
  } else {
    console.error("❌ Nessuna immagine trovata nell'array gameImages!");
  }

  console.log("🎮 Puzzle Game inizializzato!");
});
