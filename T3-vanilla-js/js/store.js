const initialValue = {
  currentGameMoves: [], // All the player moves for the active game
  history: {
    currentRoundGames: [],
    allGames: [],
  },
};

/*This class extends EventTarget in order to emit a 'statechange' event when the game state changes. 
This is listened for by the the controller so it can re-render the view. */

export default class Store extends EventTarget {
  constructor(key, players) {
    // Super() enables access to instance methods
    super();

    // Key is used for localStorage state object
    this.storageKey = key;
    this.players = players;
  }

  // Getters used to derive useful game statistics

  get stats() {
    // Retrieve current game state
    const state = this.#getState();

    // Find number of wins for each player in the current round of games
    return {
      playerWithStats: this.players.map((player) => {
        const wins = state.history.currentRoundGames.filter(
          (game) => game.status.winner?.id === player.id
        ).length;

        // Return a new object for each player which also includes number of wins
        return {
          ...player,
          wins,
        };
      }),

      // Find and return the number of ties in the current round of games
      ties: state.history.currentRoundGames.filter(
        (game) => game.status.winner === null
      ).length,
    };
  }

  // Returns an object containing information about the current state of the game
  get game() {
    // Retrieves current game state
    const state = this.#getState();

    // Determines current player based on the moves made so far
    const currentPlayer = this.players[state.currentGameMoves.length % 2];

    // Defines winning patterns
    const winningPatterns = [
      [1, 2, 3],
      [1, 5, 9],
      [1, 4, 7],
      [2, 5, 8],
      [3, 5, 7],
      [3, 6, 9],
      [4, 5, 6],
      [7, 8, 9],
    ];

    // Initialises the winner to null (no winner initially)
    let winner = null;

    // Determines whether or not a move has resulted in a game win
    for (const player of this.players) {
      // Filters past moves to current player only
      const selectedSquareIds = state.currentGameMoves
        .filter((move) => move.player.id === player.id)
        .map((move) => move.squareId);

      // Checks the current players moves against the winning patterns
      for (const pattern of winningPatterns) {
        if (pattern.every((v) => selectedSquareIds.includes(v))) {
          winner = player;
        }
      }
    }

    // Returns an object with updated information about the game
    return {
      moves: state.currentGameMoves,
      currentPlayer,
      status: {
        isComplete: winner != null || state.currentGameMoves.length === 9,
        winner,
      },
    };
  }

  /* Updates the state of the game with a new player move via a structured clone in order to 
  not mutate the state directly */
  playerMove(squareId) {
    const stateClone = structuredClone(this.#getState());

    stateClone.currentGameMoves.push({
      squareId,
      player: this.game.currentPlayer,
    });

    this.#saveState(stateClone);
  }

  // Resets the game, archiving the game if it is complete, or deleting it if it is not
  reset() {
    const stateClone = structuredClone(this.#getState());

    const { status, moves } = this.game;

    if (status.isComplete) {
      stateClone.history.currentRoundGames.push({ moves, status });
    }

    stateClone.currentGameMoves = [];

    this.#saveState(stateClone);
  }

  // Resets the scoreboard (wins, losses, and ties)
  newRound() {
    this.reset();

    const stateClone = structuredClone(this.#getState());
    stateClone.history.allGames.push(...stateClone.history.currentRoundGames);
    stateClone.history.currentRoundGames = [];

    this.#saveState(stateClone);
  }

  // Transitions from old state to new state and save to local storage
  #saveState(stateOrFn) {
    // get previous state
    const prevState = this.#getState();

    // initialise newState variable
    let newState;

    // check whether a function or object has been passed to saveState, set new state accordingly
    switch (typeof stateOrFn) {
      case "function":
        newState = stateOrFn(prevState);
        break;
      case "object":
        newState = stateOrFn;
        break;
      default:
        throw new Error("invalid argument passed to saveState");
    }

    // Emits a custom 'statechange' event
    window.localStorage.setItem(this.storageKey, JSON.stringify(newState));
    this.dispatchEvent(new Event("statechange"));
  }

  // Gets the current game state from local storage
  #getState() {
    const item = window.localStorage.getItem(this.storageKey);
    return item ? JSON.parse(item) : initialValue;
  }
}
