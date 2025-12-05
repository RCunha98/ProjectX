import { Suit, Rank } from './types.js';

export class PlayingCard {
    public readonly suit: Suit;
    public readonly rank: Rank;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
    }

    public get display(): string {
        return `${this.rank}${this.suit}`;
    }
}