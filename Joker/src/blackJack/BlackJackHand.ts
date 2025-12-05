import { Hand } from '../core/card-games/Hand.js';
import { PlayingCard } from '../core/card-games/PlayingCard.js';
import { Rank } from '../core/card-games/types.js';

function getBlackjackValue(card: PlayingCard): number {
    switch (card.rank) {
        case Rank.Ace:
            return 11;
        case Rank.King:
        case Rank.Queen:
        case Rank.Jack:
        case Rank.Ten:
            return 10;
        default:
            return parseInt(card.rank, 10); 
    }
}


export class BlackjackHand extends Hand {
    public getScore(): number {
        let result = 0;
        let aces = 0;

        for (const card of this.cards) {
            if (card.rank === Rank.Ace) {
                aces++;
            } else {
                result += getBlackjackValue(card); 
            }
        }

        for (let j = aces; j > 0; j--) {

            if (result + 11 + (j - 1) * 1 > 21) { 
                result += 1;
            } else {
                result += 11;
            }
        }

        return result;
    }

    public isBust(): boolean {
        return this.getScore() > 21;
    }
    
    public isSoft(): boolean {

        return this.getScore() < 21 && this.cards.some(card => card.rank === Rank.Ace);
    }
    
}