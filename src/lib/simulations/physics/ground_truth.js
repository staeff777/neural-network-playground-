export class GroundTruth {
  constructor(velocity = 30, initialPosition = 50) {
    this.velocity = velocity; // m/s
    this.initialPosition = initialPosition; // m
  }

  getPosition(time) {
    return this.velocity * time + this.initialPosition;
  }
}
