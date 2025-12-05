import { PlayingCard } from './PlayingCard.js';

export abstract class Hand {
    protected cards: PlayingCard []  = [];

    constructor(initialCards: PlayingCard[] = []) {
        this.cards = initialCards;
    }

    public addCard(card: PlayingCard): void {
        this.cards.push(card);
    }

    public abstract getScore(): number;

    public getCards(): PlayingCard[] {
        return [...this.cards];
    }
}