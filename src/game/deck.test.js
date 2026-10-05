import {
  createStarterDeck,
  createOpponentDeck,
  deckToCards,
  canAddPokemon,
  addPokemon,
  swapPokemon,
  eligibleSteals,
  isDeckFull,
  MAX_DISTINCT,
  COPIES_PER_POKEMON,
} from './deck';

describe('deck model', () => {
  // deck-management: "Full deck shape", "Starter deck provided"
  it('starter deck has 5 distinct pokemon expanding to 10 cards, 2 per name', () => {
    const deck = createStarterDeck();
    expect(deck.pokemon).toHaveLength(MAX_DISTINCT);

    const cards = deckToCards(deck);
    expect(cards).toHaveLength(MAX_DISTINCT * COPIES_PER_POKEMON); // 10

    const counts = cards.reduce((acc, name) => {
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    Object.values(counts).forEach((count) => {
      expect(count).toBe(COPIES_PER_POKEMON); // 2 of each
    });
    expect(Object.keys(counts)).toHaveLength(MAX_DISTINCT);
  });

  // deck-management: "Distinct-type limit enforced"
  it('rejects adding a 6th distinct pokemon', () => {
    const full = createStarterDeck(); // already 5 distinct
    expect(isDeckFull(full)).toBe(true);
    expect(canAddPokemon(full, 'eevee')).toBe(false);
    const unchanged = addPokemon(full, 'eevee');
    expect(unchanged.pokemon).toEqual(full.pokemon);
  });

  it('rejects adding an already-owned pokemon', () => {
    const deck = { pokemon: ['pikachu', 'bulbasaur'] };
    expect(canAddPokemon(deck, 'pikachu')).toBe(false);
    expect(addPokemon(deck, 'pikachu').pokemon).toEqual(deck.pokemon);
  });

  it('adds a new pokemon when there is room', () => {
    const deck = { pokemon: ['pikachu', 'bulbasaur'] };
    expect(canAddPokemon(deck, 'eevee')).toBe(true);
    const next = addPokemon(deck, 'eevee');
    expect(next.pokemon).toEqual(['pikachu', 'bulbasaur', 'eevee']);
    // original unchanged (immutability)
    expect(deck.pokemon).toEqual(['pikachu', 'bulbasaur']);
  });

  // deck-management: "Steal into a full deck requires a swap"
  it('swap keeps deck at 5 distinct / 10 cards', () => {
    const full = createStarterDeck();
    const swapped = swapPokemon(full, full.pokemon[0], 'eevee');
    expect(swapped.pokemon).toHaveLength(MAX_DISTINCT);
    expect(swapped.pokemon).toContain('eevee');
    expect(swapped.pokemon).not.toContain(full.pokemon[0]);
    expect(deckToCards(swapped)).toHaveLength(10);
  });

  it('swap is a no-op if the added pokemon is already owned', () => {
    const deck = { pokemon: ['pikachu', 'bulbasaur'] };
    expect(swapPokemon(deck, 'pikachu', 'bulbasaur').pokemon).toEqual(
      deck.pokemon
    );
  });

  // deck-management: "Ineligible duplicates are not offered"
  it('eligibleSteals excludes pokemon the player already owns', () => {
    const player = createStarterDeck(); // pikachu, bulbasaur, charmander, squirtle, jigglypuff
    const opponent = createOpponentDeck(); // eevee, psyduck, snorlax, charmander, squirtle
    const steals = eligibleSteals(player, opponent);
    expect(steals).toContain('eevee');
    expect(steals).toContain('psyduck');
    expect(steals).toContain('snorlax');
    expect(steals).not.toContain('charmander'); // already owned
    expect(steals).not.toContain('squirtle'); // already owned
  });
});
