export class GroundTruth {
  constructor(velocity = 30) {
    this.velocity = velocity; // m/s
  }

  getPosition(time) {
    return this.velocity * time;
  }
}
