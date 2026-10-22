// The six hangman pictures: index = number of wrong guesses (0 to 5).
// 5 lives means 6 pictures — an empty gallows plus one for each miss.
import stage0 from '../assets/stages/stage-0.svg';
import stage1 from '../assets/stages/stage-1.svg';
import stage2 from '../assets/stages/stage-2.svg';
import stage3 from '../assets/stages/stage-3.svg';
import stage4 from '../assets/stages/stage-4.svg';
import stage5 from '../assets/stages/stage-5.svg';

export const STAGES = [stage0, stage1, stage2, stage3, stage4, stage5];
export const MAX_LIVES = STAGES.length - 1; // 5
