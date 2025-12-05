import { PlayingCard } from './PlayingCard.js';
import { Suit, Rank } from './types.js';

export class Deck {
    private cards: PlayingCard[] = [];

    public initialize(numDecks: number = 4): void {
        const suits = Object.values(Suit);
        const ranks = Object.values(Rank); 
        
        for (let i = 0; i < numDecks; i++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    this.cards.push(new PlayingCard(suit, rank));
                }
            }
        }
        console.log(`Deck criado com ${this.cards.length} cartas (${numDecks} baralhos).`);
        this.shuffleDeck();
    }

    public shuffleDeck(): void {
        let count = this.cards.length;
        while (count > 0) {
            let index = Math.floor(Math.random() * count); 
            count--;
            
            const tmp = this.cards[count]!;
            this.cards[count] = this.cards[index]!;
            this.cards[index] = tmp;
        }
    }

    public drawCard(): PlayingCard | undefined {
        return this.cards.pop();
    }

    public get remainingCount(): number {
        return this.cards.length;
    }
}