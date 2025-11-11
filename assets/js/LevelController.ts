import { _decorator, Component, Node, error } from 'cc';
import { GameManager } from './GameManager';
// Import the new BlockController and its config classes
import { BlockController, BlockConfig, EBlockType } from './BlockController'; 

const { ccclass, property } = _decorator;

// --- NEW HELPER CLASS ---
// This class defines a single row of blocks.
@ccclass('BlockRow')
export class BlockRow {
    @property({
        type: [BlockController],
        tooltip: "The blocks in this specific row."
    })
    blocks: BlockController[] = [];
}

// An enum to help with our type-checking logic
enum EConfigType { NORMAL, BOOSTER }

@ccclass('LevelController')
export class LevelController extends Component {

    // --- REPLACED ---
    // The flat list is replaced with a 2D row-based layout.
    @property({
        type: [BlockRow],
        tooltip: "The rows of blocks in the level. This defines the 2D layout."
    })
    rowLayout: BlockRow[] = [];

    // --- These are our new "data banks" for randomization ---
    @property({
        type: [BlockConfig],
        tooltip: "The list of available 'Normal Block' configurations to choose from."
    })
    normalBlockConfigs: BlockConfig[] = [];

    @property({
        type: [BlockConfig],
        tooltip: "The list of available 'Booster Block' configurations to choose from."
    })
    boosterBlockConfigs: BlockConfig[] = [];

    start() {
        this.generateLevel();
    }

    public generateLevel() {
        if (this.rowLayout.length === 0) {
            error("No rows assigned to LevelController rowLayout!");
            return;
        }
        if (this.normalBlockConfigs.length === 0 || this.boosterBlockConfigs.length === 0) {
            error("Block configs are not assigned in LevelController!");
            return;
        }
        
        // --- 1. Flatten the list and reset all blocks ---
        const allBlocks: BlockController[] = [];
        for (const row of this.rowLayout) {
            allBlocks.push(...row.blocks);
        }

        for (const block of allBlocks) {
            block.node.active = false;
        }
        
        const normalBlockCount = this.normalBlockConfigs.length;
        const boosterBlockCount = this.boosterBlockConfigs.length;
        const totalBlocksToSpawn = normalBlockCount + boosterBlockCount;

        if (totalBlocksToSpawn > allBlocks.length) {
            error("Total block count exceeds the number of available blocks in the scene!");
            return;
        }

        // --- 2. Create config decks (of actual configs) ---
        const normalConfigsToAssign = this.shuffleArray([...this.normalBlockConfigs]);
        const boosterConfigsToAssign = this.shuffleArray([...this.boosterBlockConfigs]);

        // --- 3. Create a "type deck" to shuffle ---
        const typeDeck: EConfigType[] = [];
        for (let i = 0; i < normalBlockCount; i++) typeDeck.push(EConfigType.NORMAL);
        for (let i = 0; i < boosterBlockCount; i++) typeDeck.push(EConfigType.BOOSTER);

        // --- 4. Constrained Shuffle ---
        // Shuffle the deck until it meets our adjacency rule.
        let attempts = 0;
        const maxAttempts = 100; // Failsafe to prevent infinite loop

        this.shuffleArray(typeDeck); // Initial shuffle
        
        while (!this.isValidLayout(typeDeck, this.rowLayout) && attempts < maxAttempts) {
            this.shuffleArray(typeDeck);
            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.warn("Could not find a valid block layout after 100 attempts. Using last layout (may be invalid).");
        }

        // --- 5. Assign configs to the blocks based on the validated type deck ---
        for (let i = 0; i < allBlocks.length; i++) {
            // Stop if we've assigned all the blocks we intended to
            if (i >= typeDeck.length) {
                allBlocks[i].node.active = false;
                continue;
            }

            const block = allBlocks[i];
            const type = typeDeck[i];
            let config: BlockConfig = null;

            if (type === EConfigType.BOOSTER && boosterConfigsToAssign.length > 0) {
                config = boosterConfigsToAssign.pop();
            } else if (type === EConfigType.NORMAL && normalConfigsToAssign.length > 0) {
                config = normalConfigsToAssign.pop();
            } else {
                // Failsafe in case of mismatch: try to pull from the other deck
                config = (type === EConfigType.BOOSTER ? normalConfigsToAssign.pop() : boosterConfigsToAssign.pop());
            }

            if (config) {
                block.resetBlock(); // Make it active
                block.setupBlock(config); // Configure it
                GameManager.instance?.registerBlock(block);
            }
        }
    }

    /**
     * Checks a flat type deck against a 2D row layout to see
     * if any two boosters are adjacent in the same row.
     */
    private isValidLayout(deck: EConfigType[], rows: BlockRow[]): boolean {
        let cursor = 0;
        for (const row of rows) {
            const rowLength = row.blocks.length;
            // Get the types for just this row
            const rowTypes = deck.slice(cursor, cursor + rowLength);
            
            // Check for adjacent boosters
            for (let i = 0; i < rowTypes.length - 1; i++) {
                if (rowTypes[i] === EConfigType.BOOSTER && rowTypes[i + 1] === EConfigType.BOOSTER) {
                    return false; // Found adjacent boosters in a row
                }
            }
            cursor += rowLength;
        }
        return true; // No violations found
    }

    /**
     * Shuffles an array in place using the Fisher-Yates algorithm.
     */
    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}