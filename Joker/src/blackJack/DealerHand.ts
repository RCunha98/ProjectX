
import { BlackjackHand } from './BlackJackHand.js';
import { PlayingCard } from '../core/card-games/PlayingCard.js';
import type { IGameRules } from './types.js';

export class DealerHand extends BlackjackHand {
    private holeCardVisible: boolean = false;

    constructor(initialCards: PlayingCard[] = []) {
        super(initialCards);
    }

    
    public revealHoleCard(): void {
        this.holeCardVisible = true;
    }
    
    public getVisibleCards(): PlayingCard[] {
        if (this.cards.length === 0) return [];
        if (this.holeCardVisible || this.cards.length === 1) {
            return super.getCards();
        }
        
        return [this.cards[0]!]; 
    }

    public shouldHit(rules: IGameRules): boolean {
        const score = this.getScore();
        

        if (score >= 18) {
            return false;
        }

        if (score <= 16) {
            return true;
        }

        if (score === 17) {
            
            if (rules.dealerSoft17Rule === 'HIT') {

                return super.isSoft(); 
            } else {
                return false;
            }
        }
        
        return false;
    }
}