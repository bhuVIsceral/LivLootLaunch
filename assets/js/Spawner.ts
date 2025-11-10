import {
    _decorator,
    Component,
    Node,
    Prefab,
    NodePool,
    instantiate,
    randomRangeInt,
    random,
} from "cc";
import { MovingObject } from "./MovingObject"; // Import our new script
import { LaneRenderer } from './LaneRenderer';
import { GameManager } from "./GameManager";

const { ccclass, property } = _decorator;

// We define constants for the spawner's logic
const LANE_X_POSITIONS = [-120, 0, 120];
const SPAWN_Y = 550; // Y position where objects appear at the top
const MIN_SPAWN_DISTANCE_Y = 150; // Minimum vertical distance between spawned items in the same lane

@ccclass("Spawner")
export class Spawner extends Component {
    // --- PREFAB REFERENCES ---
    // @property({ type: LaneRenderer })
    public laneRenderer = new LaneRenderer();
    // We need references to all our prefabs to create the pools.
    @property({ type: [Prefab] }) public cratePrefabs: Prefab[] = [];
    @property({ type: Prefab }) public chilliPrefab: Prefab | null = null;
    @property({ type: Prefab }) public flowerPrefab: Prefab | null = null;
    @property({ type: Prefab }) public grassPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerupSpeedPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerupMagnetPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerup2xPrefab: Prefab | null = null;
    @property({ type: Prefab }) public powerupShieldPrefab: Prefab | null = null;

    @property({ tooltip: "Minimum time (in seconds) between obstacle spawns." }) public obstacleSpawnInterval: number = 3.0;

    // This property will be updated by the GameManager
    // public gameSpeed = 400;

    // --- OBJECT POOLS ---
    // We create a pool for each type of object.
    // private cratePool = new NodePool();
    private cratePools: NodePool[] = [];
    private chilliPool = new NodePool();
    private flowerPool = new NodePool();
    private grassPool = new NodePool();
    private powerupSpeedPool = new NodePool();
    private powerupMagnetPool = new NodePool();
    private powerup2xPool = new NodePool();
    private powerupShieldPool = new NodePool();

    // --- MAPPING for easy lookup ---
    private pools: Map<string, NodePool> = new Map();
    private powerupPools: NodePool[] = [];
    private powerupPrefabs: (Prefab | null)[] = [];
    private obstaclePools: NodePool[] = [];
    private obstaclePrefabs: (Prefab | null)[] = [];

    // --- SPAWN LOGIC ---
    // --- Timers ---
    private generalSpawnTimer: number = 0; // For chillies and powerups
    private obstacleTimer: number = 0;     // Separate timer for obstacles

    // // --- Overlap Prevention ---
    // // Keep track of the last spawn Y position for each lane
    // private lastSpawnY: number[] = [-Infinity, -Infinity, -Infinity]; 

    private get gameSpeed(): number {
        // Get the current speed dynamically from the GameManager
        return GameManager.instance?.currentGameSpeed ?? 400;
    }
    
    // Interval for general spawns (chillies/powerups) - can be faster
    private get generalSpawnInterval(): number {
        // Adjust this factor as needed for chilli/powerup frequency
        // return 0.25;
        return 100 / this.gameSpeed * 2.0; 
    }
    // private spawnTimer = 0;
    // // The interval will now be dynamic based on game speed
    // private get spawnInterval() {
    //     // As game speed increases, the spawn interval decreases (more spawns)
    //     return 0.5;
    // }

    onLoad() {
        // Initialize all our pools when the game loads
        // this.initPool(this.cratePool, this.cratePrefab, 10);

        this.cratePrefabs.forEach(prefab => {
            const pool = new NodePool();
            this.initPool(pool, prefab, 5);
            this.cratePools.push(pool);
            if (prefab) this.pools.set(prefab.name, pool);
        });
        
        this.initPool(this.chilliPool, this.chilliPrefab, 20);
        this.initPool(this.flowerPool, this.flowerPrefab, 5);
        this.initPool(this.grassPool, this.grassPrefab, 5);
        this.initPool(this.powerupSpeedPool, this.powerupSpeedPrefab, 2);
        this.initPool(this.powerupMagnetPool, this.powerupMagnetPrefab, 2);
        this.initPool(this.powerup2xPool, this.powerup2xPrefab, 2);
        this.initPool(this.powerupShieldPool, this.powerupShieldPrefab, 2);

        // Map prefab names to pools for easy despawning
        // if (this.cratePrefab)
        //     this.pools.set(this.cratePrefab.name, this.cratePool);
        if (this.chilliPrefab)
            this.pools.set(this.chilliPrefab.name, this.chilliPool);
        if (this.flowerPrefab)
            this.pools.set(this.flowerPrefab.name, this.flowerPool);
        if (this.grassPrefab)
            this.pools.set(this.grassPrefab.name, this.grassPool);
        if (this.powerupSpeedPrefab)
            this.pools.set(this.powerupSpeedPrefab.name, this.powerupSpeedPool);
        if (this.powerupMagnetPrefab)
            this.pools.set(
                this.powerupMagnetPrefab.name,
                this.powerupMagnetPool
            );
        if (this.powerup2xPrefab)
            this.pools.set(this.powerup2xPrefab.name, this.powerup2xPool);
        if (this.powerupShieldPrefab) 
            this.pools.set(this.powerupShieldPrefab.name, this.powerupShieldPool);

        // Create lists for easy random selection
        this.powerupPools = [
            this.powerupSpeedPool,
            this.powerupMagnetPool,
            this.powerup2xPool,
            this.powerupShieldPool,
        ];
        this.powerupPrefabs = [
            this.powerupSpeedPrefab,
            this.powerupMagnetPrefab,
            this.powerup2xPrefab, 
            this.powerupShieldPrefab,
        ];
        // this.obstaclePools = [this.cratePool, this.grassPool, this.flowerPool];
        // this.obstaclePrefabs = [
            //     this.cratePrefab,
            //     this.grassPrefab,
            //     this.flowerPrefab,
            // ];

        this.obstaclePools = [...this.cratePools, this.grassPool, this.flowerPool];
        this.obstaclePrefabs = [...this.cratePrefabs, this.grassPrefab, this.flowerPrefab];
    }

    // This helper function creates and fills a pool.
    private initPool(pool: NodePool, prefab: Prefab | null, count: number) {
        if (!prefab) return;
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            pool.put(node);
        }
    }

    // This is the main spawn logic that runs every frame.
    update(deltaTime: number) {
        // We will add the game rules logic here in the next step!
        // For now, let's just spawn a chilli every second to test.
        // this.spawnTimer += deltaTime;

        // // If it's time to spawn...
        // if (this.spawnTimer >= this.spawnInterval) {
        //     this.spawnTimer = 0;

        //     const randomValue = random(); // Get a random number between 0 and 1

        //     // --- Spawn Decision Logic ---
        //     if (randomValue < 0.1) {
        //         // 2% chance for a power-up
        //         this.spawnRandomPowerUp();
        //     } else if (randomValue < 0.3 && randomValue > 0.1) {
        //         // 48% chance for an obstacle
        //         this.spawnObstaclePattern();
        //         // this.spawnRandomPowerUp();
        //     } else {
        //         // 50% chance for chillies
        //         this.spawnChilliPattern();
        //     }
        // }

        this.generalSpawnTimer += deltaTime * 5;
        this.obstacleTimer += deltaTime;

        // --- Obstacle Guarantee ---
        if (this.obstacleTimer >= this.obstacleSpawnInterval) {
            this.obstacleTimer = 0; // Reset obstacle timer
            this.spawnObstaclePattern();
        }
        
        // --- General Random Spawning ---
        if (this.generalSpawnTimer >= this.generalSpawnInterval) {
            this.generalSpawnTimer = 0; 

            const randomValue = random(); 
            // Adjust probabilities as needed: e.g., 5% powerup, 95% chillies
            // if (randomValue < 0.1 && this.powerupPools.length > 0) { 
            //     this.spawnRandomPowerUp();
            // } else { 
            //     this.spawnChilliPattern();
            // }
            
            // // Probabilities: ~2% powerup, ~48% obstacle, ~50% chillies
            if (randomValue < 0.2 && this.powerupPools.length > 0) { 
                this.spawnRandomPowerUp();
            } else if (randomValue < 0.4 && randomValue > 0.2 && this.obstaclePools.length > 0) { 
                // Only spawn if the obstacle timer didn't *just* spawn one
                if(this.obstacleTimer > 0.1) { // Avoid double spawns 
                   this.spawnObstaclePattern();
                }
            } else { 
                this.spawnChilliPattern();
            }
        }
    }

    private spawnRandomPowerUp() {
        if (this.powerupPools.length === 0) return;
        const randomIndex = randomRangeInt(0, this.powerupPools.length);
        const randomLane = randomRangeInt(0, 3);
        // this.spawnObject(
        //     this.powerupPools[randomIndex],
        //     this.powerupPrefabs[randomIndex],
        //     randomLane
        // );
        this.trySpawnObject(this.powerupPools[randomIndex], this.powerupPrefabs[randomIndex], randomLane);
    }

    private spawnObstaclePattern() {
        const randomLane = randomRangeInt(0, 3);
        this.spawnRandomObstacle(randomLane);

        // --- Difficulty Scaling for Obstacles ---
        // The chance of a 2-lane block increases with game speed.
        // Let's say max speed is 600. Chance = gameSpeed / (maxSpeed * 2)
        // const twoLaneChance = this.gameSpeed / 1200;
        // if (random() < twoLaneChance) {
            let secondLane;
            do {
                secondLane = randomRangeInt(0, 3);
            } while (secondLane === randomLane); // Make sure it's a different lane
            this.spawnRandomObstacle(secondLane);
        // }
    }

    private spawnRandomObstacle(lane: number) {
        if (this.obstaclePools.length === 0) return;
        const randomIndex = randomRangeInt(0, this.obstaclePools.length);
        this.trySpawnObject(this.obstaclePools[randomIndex], this.obstaclePrefabs[randomIndex], lane);
        // this.spawnObject(
        //     this.obstaclePools[randomIndex],
        //     this.obstaclePrefabs[randomIndex],
        //     lane
        // );
    }

    private spawnChilliPattern() {
        const numToSpawn = randomRangeInt(1, 4); // 1 to 3 chillies
        const usedLanes = new Set<number>();
        for (let i = 0; i < numToSpawn; i++) {
            let lane;
            do {
                lane = randomRangeInt(0, 3);
            } while (usedLanes.has(lane)); // Ensure we don't spawn two in the same lane
            usedLanes.add(lane);
            this.trySpawnObject(this.chilliPool, this.chilliPrefab, lane);
            // this.spawnObject(this.chilliPool, this.chilliPrefab, lane);
        }
    }

    // --- NEW: Wrapper function to check for overlap before spawning ---
    private trySpawnObject(pool: NodePool, prefab: Prefab | null, lane: number) {
        // // Check if the spawn position is too close to the last spawn in this lane
        // if (SPAWN_Y - this.lastSpawnY[lane] < MIN_SPAWN_DISTANCE_Y) {
        //      // console.log(`Skipped spawn in lane ${lane} due to overlap`);
        //      return; // Skip this spawn
        // }
        
        // this.spawnObject(pool, prefab, lane);

        // Dynamically check positions of active objects in the target lane
        let highestYInLane = -Infinity;
        for (const child of this.node.children) {
            const movingObject = child.getComponent(MovingObject);
            // Check if the child is a moving object and is in the target lane
            if (movingObject && !movingObject.isAnimatingDespawn && movingObject.laneIndex === lane) {
                highestYInLane = Math.max(highestYInLane, child.position.y);
            }
        }

        // Check if the spawn position is too close to the highest object found
        if (SPAWN_Y - highestYInLane < MIN_SPAWN_DISTANCE_Y) {
             // console.log(`Skipped spawn in lane ${lane} due to overlap with object at Y=${highestYInLane.toFixed(0)}`);
             return; // Skip this spawn
        }
        
        // If the check passes, proceed to spawn
        this.spawnObject(pool, prefab, lane);
    }

    private spawnObject(pool: NodePool, prefab: Prefab | null, lane: number) {
        if (!prefab) return;

        const objNode: Node | null =
            pool.size() > 0 ? pool.get() : instantiate(prefab);

        if (objNode) {
            const movingObject = objNode.getComponent(MovingObject);
            if (movingObject) {
                movingObject.spawner = this;
                movingObject.laneIndex = lane;
            }

            const initialX = this.laneRenderer.laneCenterXAtY(lane, SPAWN_Y);
            objNode.setPosition(initialX, SPAWN_Y, 0);
            this.node.addChild(objNode);

            // // --- Update the last spawn position for this lane ---
            // this.lastSpawnY[lane] = SPAWN_Y; 
        }
    }

    public despawnObject(objectNode: Node) {
        const pool = this.pools.get(objectNode.name);
        if (pool) {
            // Before putting back, reset its Y position slightly above the last known spawn 
            // This helps ensure the next check in trySpawnObject is accurate
            // const movingObject = objectNode.getComponent(MovingObject);
            //  if (movingObject) {
            //      this.lastSpawnY[movingObject.laneIndex] = Math.min(this.lastSpawnY[movingObject.laneIndex], objectNode.position.y);
            //  }
            pool.put(objectNode);
        } else {
            objectNode.destroy();
        }
    }
}
