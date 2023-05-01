import View from "./view.js";
import Store from "./store.js";

// Defines icon, color, name and id for each player
const players = [
  {
    id: 1,
    name: "Player 1",
    iconClass: "fa-x",
    colorClass: "turquoise",
  },
  {
    id: 2,
    name: "Player 2",
    iconClass: "fa-o",
    colorClass: "yellow",
  },
];

// MVC pattern
function init() {
  // Model
  const store = new Store("live-t3-storage-key", players);
  // View
  const view = new View();

  // "Controller" logic (event listeners + handlers)

  // Listens for changes in the game state (current tab) and re-render the view when a change occurs
  // State change is a custom event defined in the Store class
  store.addEventListener("statechange", () => {
    view.render(store.game, store.stats);
  });

  // Listens for changes when two players are playing from two different browser tabs
  window.addEventListener("storage", () => {
    console.log("State changed from another tab");
    view.render(store.game, store.stats);
  });

  // When the HTML document first loads, renders the view based on the current state
  view.render(store.game, store.stats);

  view.bindGameResetEvent((event) => {
    store.reset();
  });

  view.bindNewRoundEvent((event) => {
    store.newRound();
  });

  view.bindPlayerMoveEvent((square) => {
    // Checks for an existing move in the clicked square
    const existingMove = store.game.moves.find(
      (move) => move.squareId === +square.id
    );

    // Returns early if a move already exists
    if (existingMove) {
      return;
    }

    // Advance to the next state by pushing a move to the moves array
    store.playerMove(+square.id);
  });
}

window.addEventListener("load", init);
