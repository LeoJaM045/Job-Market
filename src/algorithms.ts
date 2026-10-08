/**
 * Algorithmic Streaming Layer
 * - Bloom Filter for spam & fraud filtration
 * - DGIM Algorithm for O(log^2 N) counting in sliding windows
 */

export class ClientBloomFilter {
  size: number;
  numHashes: number;
  bitArray: Uint8Array;
  itemsCount: number;

  constructor(size: number = 8000, numHashes: number = 4) {
    this.size = size;
    this.numHashes = numHashes;
    this.bitArray = new Uint8Array(size);
    this.itemsCount = 0;
  }

  private hashString(str: string, seed: number): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i) + seed * 31;
      hash = Math.imul(hash, 0x01000193);
    }
    return Math.abs(hash) % this.size;
  }

  getHashIndices(item: string): number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.numHashes; i++) {
      indices.push(this.hashString(item, i + 1));
    }
    return indices;
  }

  add(item: string): void {
    const indices = this.getHashIndices(item);
    for (const idx of indices) {
      this.bitArray[idx] = 1;
    }
    this.itemsCount++;
  }

  contains(item: string): boolean {
    const indices = this.getHashIndices(item);
    return indices.every((idx) => this.bitArray[idx] === 1);
  }

  falsePositiveProbability(): number {
    if (this.itemsCount === 0) return 0;
    const exponent = (-1.0 * this.numHashes * this.itemsCount) / this.size;
    return Math.pow(1.0 - Math.exp(exponent), this.numHashes);
  }
}

export interface DGIMBucketModel {
  size: number;
  timestamp: number;
}

export class ClientDGIMStream {
  windowSize: number;
  currentTime: number;
  buckets: DGIMBucketModel[];
  recentTicks: { tick: number; bit: number }[];

  constructor(windowSize: number = 100) {
    this.windowSize = windowSize;
    this.currentTime = 0;
    this.buckets = [];
    this.recentTicks = [];
  }

  update(bit: number): void {
    this.currentTime++;
    this.recentTicks.push({ tick: this.currentTime, bit });
    if (this.recentTicks.length > 200) {
      this.recentTicks.shift();
    }

    // Expire buckets outside window
    this.buckets = this.buckets.filter(
      (b) => this.currentTime - b.timestamp < this.windowSize
    );

    if (bit === 1) {
      // New bucket of size 1
      this.buckets.unshift({ size: 1, timestamp: this.currentTime });
      this.consolidate();
    }
  }

  private consolidate(): void {
    let i = 0;
    while (i < this.buckets.length - 2) {
      // Check if 3 consecutive buckets have identical size
      if (
        this.buckets[i].size === this.buckets[i + 1].size &&
        this.buckets[i + 1].size === this.buckets[i + 2].size
      ) {
        const mergedSize = this.buckets[i + 1].size * 2;
        const mergedTimestamp = this.buckets[i + 1].timestamp;

        this.buckets.splice(i + 1, 2, {
          size: mergedSize,
          timestamp: mergedTimestamp,
        });
      } else {
        i++;
      }
    }
  }

  countOnes(limitWindow?: number): number {
    const limit = limitWindow ?? this.windowSize;
    const cutoff = this.currentTime - limit;
    let total = 0;
    let lastBucketSize = 0;

    for (const b of this.buckets) {
      if (b.timestamp > cutoff) {
        total += b.size;
        lastBucketSize = b.size;
      } else {
        break;
      }
    }

    return Math.max(0, total - Math.floor(lastBucketSize / 2));
  }
}
